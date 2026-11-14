"""Synthetic portfolio-conditioned strategy experiment. No real market or trading API."""
import copy, hashlib, itertools, json, math, random, time
from pathlib import Path
import numpy as np
from scipy.optimize import milp, Bounds, LinearConstraint
import scipy
ROOT=Path(__file__).parent

def scores(case):
    # Toy strategy: market preference reduced by existing portfolio concentration.
    nav=sum(case["holdings"])+case["cash"]
    base=[3.,2.,1.] if case["regime"]=="normal" else [-1.,-2.,-3.]
    return [base[i]-4*case["holdings"][i]/nav for i in range(3)]

def solve(case):
    h=np.array(case["holdings"],float); cash=case["cash"]; nav=sum(h)+cash
    if nav<=0 or cash<0 or any(h<0) or case["fee"]<0:
        return {"status":"invalid_input"}
    fee=case["fee"]; sc=np.array(scores(case)); cost=np.r_[-sc+.05,sc+.05]
    rows=[];limits=[]
    # cash after fees >= reserve
    rows.append(np.r_[np.ones(3)*(1+fee),np.ones(3)*(-1+fee)])
    limits.append(cash-case["reserve"])
    # weights measured against NAV AFTER fees, not pre-trade NAV
    for i,cap in enumerate(case["caps"]):
        row=np.ones(6)*cap*fee;row[i]+=1;row[i+3]-=1
        rows.append(row);limits.append(cap*nav-h[i])
    row=np.ones(6)*case["sector_cap"]*fee
    row[0]+=1;row[1]+=1;row[3]-=1;row[4]-=1
    rows.append(row);limits.append(case["sector_cap"]*nav-h[0]-h[1])
    rows.append(np.ones(6));limits.append(case["turnover"])
    upper=np.r_[np.ones(3)*case["buy_limit"],h if case["allow_sell"] else np.zeros(3)]
    result=milp(cost,integrality=np.ones(6),bounds=Bounds(np.zeros(6),upper),constraints=LinearConstraint(np.array(rows),-np.inf,np.array(limits)),options={"time_limit":5,"mip_rel_gap":0})
    if result.status==2:return {"status":"infeasible"}
    if result.status!=0:return {"status":"solver_failure","code":int(result.status)}
    x=np.rint(result.x).astype(int);delta=x[:3]-x[3:]
    return {"status":"feasible","delta":delta.tolist(),"scores":sc.tolist(),"objective":float(-result.fun)}

def audit(case,delta):
    # Independent direct ledger arithmetic, rather than reuse solver matrices.
    h=case["holdings"]; nav=sum(h)+case["cash"]
    traded=sum(abs(v) for v in delta); fees=case["fee"]*traded
    after=[h[i]+delta[i] for i in range(3)]
    cash=case["cash"]-sum(delta)-fees; final_nav=sum(after)+cash
    checks={"integer_units":all(v==int(v) for v in delta),"no_short":min(after)>=0,"cash_reserve":cash>=case["reserve"]-1e-8,"buy_limit":max(delta)<=case["buy_limit"],"sell_permission":case["allow_sell"] or min(delta)>=0,"turnover":traded<=case["turnover"],"asset_caps":all(after[i]<=case["caps"][i]*final_nav+1e-8 for i in range(3)),"shared_sector":after[0]+after[1]<=case["sector_cap"]*final_nav+1e-8}
    return {"pass":all(checks.values()),"checks":checks,"holdings_after":after,"cash_after":cash,"fees":fees,"nav_after":final_nav}

def exhaustive(case):
    low=[-x if case["allow_sell"] else 0 for x in case["holdings"]]
    best=None;sc=scores(case)
    for d in itertools.product(*(range(lo,case["buy_limit"]+1) for lo in low)):
        if not audit(case,d)["pass"]:continue
        value=sum(sc[i]*d[i] for i in range(3))-.05*sum(abs(x) for x in d)
        if best is None or value>best["objective"]+1e-8:best={"delta":list(d),"objective":value}
    return best

base={"holdings":[3,2,1],"cash":4,"reserve":2,"fee":.01,"caps":[.4,.4,.4],"sector_cap":.6,"turnover":8,"buy_limit":5,"allow_sell":True,"regime":"normal"}
specs=[("P01_base",{}),("P02_concentrated",{"holdings":[7,1,1],"cash":1}),("P03_low_cash",{"holdings":[3,3,3],"cash":1}),("P04_cash_only",{"holdings":[0,0,0],"cash":10}),("P05_high_fees",{"fee":.2}),("P06_sector_overlap",{"sector_cap":.3}),("P07_no_sell_infeasible",{"holdings":[7,1,1],"cash":1,"allow_sell":False}),("P08_reserve_infeasible",{"reserve":11}),("P09_stress",{"regime":"stress"}),("P10_no_turnover",{"turnover":0}),("P11_zero_fees",{"fee":0}),("P12_negative_cash",{"cash":-1})]
cases=[]
for name,changes in specs:
    c=copy.deepcopy(base);c.update(changes);c["case_id"]=name;cases.append(c)
rng=random.Random(613)
for n in range(30):
    c=copy.deepcopy(base);c.update(case_id=f"R{n:02}",holdings=[rng.randint(0,5) for _ in range(3)],cash=rng.randint(1,7),reserve=rng.randint(0,5),fee=rng.choice([0,.01,.1]),sector_cap=rng.choice([.3,.6,.8]),allow_sell=rng.choice([True,False]),regime=rng.choice(["normal","stress"]));cases.append(c)
results=[]
for c in cases:
    t=time.perf_counter();out=solve(c);elapsed=time.perf_counter()-t
    if c["cash"]<0:
        ok=out["status"]=="invalid_input";oracle=None;aud=None
    else:
        oracle=exhaustive(c);aud=audit(c,out["delta"]) if out["status"]=="feasible" else None
        ok=(out["status"]=="infeasible" and oracle is None) or (out["status"]=="feasible" and oracle is not None and aud["pass"] and abs(out["objective"]-oracle["objective"])<1e-6)
    results.append({"case_id":c["case_id"],"strategy_output":out,"ledger_audit":aud,"enumeration_oracle":oracle,"pass":bool(ok),"solver_seconds":elapsed})
# Same market, different portfolios. Demonstrates generation dependence, not a precomputed signal checker.
paired=[x for x in results if x["case_id"] in ['P01_base','P02_concentrated','P03_low_cash','P04_cash_only']]
# Static candidate is a deliberately simple control, NOT an AI baseline.
static_audit=audit(base,[2,0,0])
report={"scope":"Toy financial logic only. Not investment advice, trading performance, privacy proof or AI benchmark.","scipy_version":scipy.__version__,"case_count":len(cases),"passed":sum(r["pass"] for r in results),"paired_portfolio_outputs":paired,"static_control":{"delta":[2,0,0],"audit":static_audit,"not_ai_baseline":True},"cases":results}
(ROOT/'cases.json').write_text(json.dumps(cases,indent=2)+"\n")
(ROOT/'results.json').write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps({"cases":len(cases),"passed":report["passed"],"paired":[{"id":r["case_id"],"out":r["strategy_output"],"audit":r["ledger_audit"]} for r in paired],"static_control":static_audit},indent=2))
raise SystemExit(0 if all(r["pass"] for r in results) else 1)
