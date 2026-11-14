"""Cost-minimizing constrained rebalancing, synthetic data, no profit tests.
Adaptation of public fixed + proportional cost modelling, not proprietary IP.
"""
import argparse
import copy
import hashlib
import itertools
import json
import subprocess
import time
from pathlib import Path
import numpy as np
from scipy.optimize import milp, Bounds, LinearConstraint

ROOT = Path(__file__).resolve().parent


def audit(c, d):
    if not isinstance(d, list) or len(d) != len(c['holdings']) or not all(type(x) is int for x in d):
        return {'valid': False}
    costs = sum(abs(d[i])*c['prices'][i]*c['fee_rates'][i] + (c['fixed_fees'][i] if d[i] else 0) for i in range(len(d)))
    values = [(h+x)*p for h, x, p in zip(c['holdings'], d, c['prices'])]
    cash = c['cash']-sum(x*p for x,p in zip(d,c['prices']))-costs
    nav = sum(values)+cash
    checks = [nav > 0, cash >= c['reserve']-1e-8,
              all(-h <= x <= c['buy_limit'] for h,x in zip(c['holdings'],d)),
              c['allow_sell'] or min(d)>=0,
              sum(values[:2]) <= c['sector_cap']*nav+1e-8,
              all(lo*nav-1e-8 <= v <= hi*nav+1e-8 for lo,v,hi in zip(c['lower'],values,c['upper']))]
    return {'valid': bool(all(checks)), 'cost': costs, 'cash_after': cash, 'nav_after': nav, 'asset_values_after': values}


def solve(c):
    n=len(c['holdings']);p=np.array(c['prices']);h=np.array(c['holdings']);nav=p@h+c['cash']
    # b, s, buy-active, sell-active. Positive costs and exclusivity avoid wash trades.
    cost=np.r_[p*np.array(c['fee_rates']),p*np.array(c['fee_rates']),c['fixed_fees'],c['fixed_fees']]
    rows=[];rhs=[]
    cash=cost.copy();cash[:n]+=p;cash[n:2*n]-=p
    rows.append(cash);rhs.append(c['cash']-c['reserve'])
    for i in range(n):
        for cap, sign in [(c['upper'][i],1),(c['lower'][i],-1)]:
            row=sign*cap*cost.copy();row[i]+=sign*p[i];row[n+i]-=sign*p[i]
            rows.append(row);rhs.append(sign*(cap*nav-h[i]*p[i]))
        row=np.zeros(4*n);row[i]=1;row[2*n+i]=-c['buy_limit'];rows.append(row);rhs.append(0)
        row=np.zeros(4*n);row[n+i]=1;row[3*n+i]=-h[i];rows.append(row);rhs.append(0)
        row=np.zeros(4*n);row[2*n+i]=row[3*n+i]=1;rows.append(row);rhs.append(1)
    row=c['sector_cap']*cost.copy()
    row[:2]+=p[:2];row[n:n+2]-=p[:2];rows.append(row);rhs.append(c['sector_cap']*nav-p[:2]@h[:2])
    ub=np.r_[np.full(n,c['buy_limit']),h if c['allow_sell'] else np.zeros(n),np.ones(2*n)]
    out=milp(cost,integrality=np.ones(4*n),bounds=Bounds(np.zeros(4*n),ub),constraints=LinearConstraint(np.array(rows),-np.inf,np.array(rhs)),options={'mip_rel_gap':0,'time_limit':10})
    if out.status==2:return {'status':'infeasible'}
    if out.status!=0:raise RuntimeError(f'Solver failed {out.status}')
    x=np.rint(out.x).astype(int);d=(x[:n]-x[n:2*n]).tolist()
    return {'status':'feasible','delta':d,'audit':audit(c,d)}


def oracle(c):
    best=None
    for d in itertools.product(*(range(-h if c['allow_sell'] else 0,c['buy_limit']+1) for h in c['holdings'])):
        a=audit(c,list(d))
        if a['valid'] and (best is None or a['cost']<best['cost']-1e-9):best={'delta':list(d),**a}
    return best


def fixtures():
    base=dict(holdings=[4,1,3],prices=[2,3,1],cash=5,reserve=3,fee_rates=[.01,.015,.02],fixed_fees=[.05,.08,.03],lower=[.1,.1,.1],upper=[.4,.4,.4],sector_cap=.65,buy_limit=5,allow_sell=True)
    changes=[{}, {'holdings':[2,1,3]}, {'holdings':[7,1,1]}, {'holdings':[0,0,0],'cash':20},
             {'fixed_fees':[.5,.8,.3]}, {'fee_rates':[.1,.15,.2]}, {'sector_cap':.4},
             {'reserve':8}, {'holdings':[7,1,1],'allow_sell':False}, {'reserve':30},
             {'lower':[.2,.2,.2],'upper':[.3,.3,.3]}, {'prices':[3,2,2],'holdings':[3,2,1]}]
    return [{'id':f'C{i+1:02}',**copy.deepcopy(base),**v} for i,v in enumerate(changes)]


REQUEST='''Saya ingin merapikan portofolio berikut dengan biaya transaksi serendah mungkin. Tolong beri jumlah unit yang perlu dibeli atau dijual, atau nyatakan jika tidak memungkinkan. Tidak perlu memprediksi keuntungan investasi.
Semua batas alokasi dan kas wajib terpenuhi setelah biaya dipotong. Jangan mengejar titik tengah alokasi jika masih dalam rentang yang saya izinkan. Tidak bertransaksi boleh jika sudah memenuhi kebutuhan.
Data tiap kasus memakai urutan aset A, B, C. holdings adalah unit awal, prices harga tetap per unit, cash kas awal, reserve kas minimum. lower dan upper adalah batas bawah/atas proporsi aset terhadap seluruh portofolio termasuk kas sesudah biaya. A dan B satu sektor dan proporsi gabungannya tidak boleh melebihi sector_cap.
fee_rates adalah tarif biaya dari nilai transaksi dan fixed_fees biaya tambahan sekali untuk tiap aset yang ditransaksikan. Tarif beli dan jual sama. Biaya dibayar dari kas. Jumlah unit harus bulat, tidak boleh short atau meminjam. buy_limit membatasi tambahan unit setiap aset. allow_sell menyatakan apakah boleh menjual. Tidak ada pajak atau biaya lain dalam contoh ini.
Jawab setiap kasus secara terpisah. Untuk memudahkan pencatatan, gunakan JSON {"answers":[{"id":"C01","status":"feasible","delta":[0,0,0]}]}. delta positif untuk beli, negatif untuk jual. Jika tidak mungkin, status="infeasible" tanpa delta. Pilih pendekatanmu sendiri.
Data kasus
'''


def grade(cases,answers):
    rows=[]
    for c in cases:
        found=[a for a in answers if isinstance(a,dict) and a.get('id')==c['id']];o=oracle(c)
        a=found[0] if len(found)==1 else {};valid=False;optimal=False;gap=None
        if o is None:valid=optimal=a.get('status')=='infeasible'
        elif a.get('status')=='feasible':
            result=audit(c,a.get('delta'));valid=result['valid']
            if valid:gap=result['cost']-o['cost'];optimal=abs(gap)<=1e-7
        rows.append({'id':c['id'],'feasible_or_correct_status':bool(valid),'minimum_cost_or_correct_status':bool(optimal),'cost_gap_if_feasible':gap})
    return {'count':len(cases),'valid':sum(r['feasible_or_correct_status'] for r in rows),'optimal':sum(r['minimum_cost_or_correct_status'] for r in rows),'rows':rows}


def parse_answers(raw):
    """Accept one complete answer object surrounded by prose or Markdown.

    Do not repair malformed JSON, invent answers, or choose between alternatives.
    """
    if not isinstance(raw,str):raise ValueError('Model result is not text')
    decoder=json.JSONDecoder();candidates=[];position=0
    while position<len(raw):
        start=raw.find('{',position)
        if start<0:break
        try:obj,end=decoder.raw_decode(raw,start)
        except json.JSONDecodeError:
            position=start+1;continue
        position=end
        if isinstance(obj,dict) and 'answers' in obj:candidates.append(obj)
    if len(candidates)!=1:raise ValueError('Expected exactly one complete JSON answer object')
    answers=candidates[0]['answers']
    if not isinstance(answers,list) or not all(isinstance(a,dict) for a in answers):
        raise ValueError('answers must be a list of answer objects')
    return answers


def grade_run(path):
    run=json.loads(path.read_text())
    if run.get('status')!='completed' or run.get('returncode')!=0:
        raise ValueError('Run did not complete successfully, no score assigned')
    envelope=json.loads(run['stdout'])
    if envelope.get('is_error'):raise ValueError('Provider returned an error, no score assigned')
    answers=parse_answers(envelope.get('result'))
    cases=json.loads((ROOT/'cases.json').read_text())
    report=grade(cases,answers)
    output=path.with_name(path.name.replace('model-run-','model-grade-',1))
    if output==path:raise ValueError('Expected model-run-*.json filename')
    output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))
    return report


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--run-model',action='store_true')
    ap.add_argument('--grade-run',type=Path,help='Regrade an existing run without another API call')
    args=ap.parse_args()
    if args.grade_run:
        try:grade_run(args.grade_run)
        except (ValueError,KeyError) as e:ap.exit(1,f'No score assigned: {e}\n')
        return
    cases=fixtures();prompt=REQUEST+json.dumps(cases,ensure_ascii=False,indent=2)
    # Do not silently change frozen inputs after a model response has been obtained.
    for name,content in [('cases.json',json.dumps(cases,indent=2)+'\n'),('prompt.txt',prompt)]:
        p=ROOT/name
        if p.exists() and p.read_text()!=content:raise RuntimeError('Frozen fixture differs, create a new experiment version')
        p.write_text(content)
    rows=[]
    for c in cases:
        t=time.perf_counter();s=solve(c);elapsed=time.perf_counter()-t;o=oracle(c)
        ok=(s['status']=='infeasible' and o is None) or (o is not None and s['status']=='feasible' and s['audit']['valid'] and abs(s['audit']['cost']-o['cost'])<=1e-7)
        rows.append({'id':c['id'],'output':s,'oracle':o,'pass':bool(ok),'solver_seconds':elapsed})
    assert all(r['pass'] for r in rows)
    (ROOT/'method-results.json').write_text(json.dumps(rows,indent=2)+'\n')
    (ROOT/'protocol.json').write_text(json.dumps({'prompt_sha256':hashlib.sha256(prompt.encode()).hexdigest(),'cases':12,'primary':'satisfy user constraints or correctly report infeasible','secondary':'minimize actual stated transaction cost among feasible solutions, ties accepted','no_hidden_strategy_matching':True,'repetitions':1,'synthetic':True},indent=2)+'\n')
    assert grade(cases,[{'id':r['id'],**r['output']} for r in rows])['optimal']==len(cases)
    assert grade(cases,[])['optimal']==0
    print(json.dumps({'method_passed':len(rows),'cases':len(rows),'model_called':args.run_model}),flush=True)
    if not args.run_model:return
    cmd=['claude','-p','--safe-mode','--tools','','--disable-slash-commands','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--no-session-persistence','--output-format','json','--system-prompt','Answer the user request using the supplied data.']
    start=time.monotonic()
    try:
        p=subprocess.run(cmd,input=prompt,capture_output=True,text=True,cwd='/tmp',timeout=240)
        run={'status':'completed','returncode':p.returncode,'seconds':time.monotonic()-start,'stdout':p.stdout,'stderr':p.stderr}
    except subprocess.TimeoutExpired:run={'status':'timeout','seconds':time.monotonic()-start}
    stamp=time.time_ns();run_path=ROOT/f'model-run-{stamp}.json';run_path.write_text(json.dumps(run,indent=2)+'\n')
    if run['status']=='completed' and run['returncode']==0:
        try:grade_run(run_path)
        except (ValueError,KeyError) as e:
            print(f'No score assigned: {e}. Raw response preserved in {run_path.name}.')
    else:print('No model score. Inspect saved run for connection or authentication errors.')


if __name__=='__main__':main()
