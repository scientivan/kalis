"""Reproducible operator-access tests and a frozen, tool-free LLM benchmark.

Only synthetic fixtures. Never calls a broker or tests financial returns.
Default is local testing. --run-model makes one tools-disabled Claude inference.
"""
import argparse
import ast
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = ROOT.parent


def load_functions():
    # Preserve exact functions, avoid the fixture-writing top-level experiment.
    source = (BASE / 'run_tests.py').read_text()
    tree = ast.parse(source)
    nodes = [n for n in tree.body if isinstance(n, (ast.Import, ast.ImportFrom, ast.FunctionDef))]
    ns = {'__file__': str(BASE / 'run_tests.py')}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(BASE / 'run_tests.py'), 'exec'), ns)
    return ns


def operator_probe():
    # Models an operator who controls the ordinary Python host. Not an exploit
    # against another user, a remote service, or a TEE.
    ns = load_functions()
    case = json.loads((BASE / 'cases.json').read_text())[0]
    code = (BASE / 'run_tests.py').read_text()
    captured = {}

    def trace(frame, event, arg):
        if frame.f_code.co_name == 'scores' and event == 'return':
            captured.update(portfolio=frame.f_locals['case'],
                            strategy_base=frame.f_locals['base'], scores=arg)
        return trace

    sys.settrace(trace)
    try:
        result = ns['solve'](case)
    finally:
        sys.settrace(None)
    checks = [
        {'test': 'operator_reads_portfolio_file', 'attack_succeeded': case['holdings'] == [3, 2, 1]},
        {'test': 'operator_reads_strategy_source', 'attack_succeeded': '4*case["holdings"][i]/nav' in code},
        {'test': 'operator_captures_portfolio_at_runtime', 'attack_succeeded': captured.get('portfolio') == case},
        {'test': 'operator_captures_strategy_at_runtime', 'attack_succeeded': captured.get('strategy_base') == [3., 2., 1.]},
    ]
    print(json.dumps({'checks': checks, 'captured_synthetic': captured,
                      'computation_status': result['status'],
                      'scope': 'ordinary host controlled by operator, not a TEE attack'}))


RULES = '''Solve this synthetic integer portfolio allocation task without tools. All information needed is below. No investment forecasting is requested.
For each case, choose three integer net trades delta for A/B/C. Prices are all 1, positive means buy, negative means sell.
Initial NAV = sum(holdings) + cash. If cash < 0, any holding < 0, NAV <= 0 or fee < 0, report invalid_input.
Scores = base - 4 * holdings / initial NAV, where base=[3,2,1] for normal and [-1,-2,-3] for stress. Scores use INITIAL holdings and are not recomputed after trading.
Maximize sum(scores[i]*delta[i]) - 0.05*sum(abs(delta[i])). This is synthetic utility, NOT profit.
Constraints: final holdings=holdings+delta >=0. Each delta <=buy_limit. When allow_sell is false every delta>=0. Turnover=sum(abs(delta))<=turnover.
Fees=fee*turnover. Final cash=cash-sum(delta)-fees >=reserve. Final NAV=initial NAV-fees. Each final holding<=caps[i]*final NAV. A+B final holdings<=sector_cap*final NAV.
All constraints apply simultaneously, after fees. Zero trades are permitted only if all constraints hold. Do not call a valid input invalid merely because no feasible trades exist. Report infeasible only if no integer solution exists. Among feasible trades give a global optimum, not only any feasible solution. Ties are accepted.
Reason carefully and double-check each final answer. Return ONLY JSON {"answers":[{"id":"T01","status":"feasible","delta":[0,0,0]}, ...]}. Status must be feasible, infeasible, or invalid_input. Omit delta for the latter two. Solve every case independently.
CASES
'''


def prepare():
    cases = json.loads((BASE / 'cases.json').read_text())
    blind = [{**{k: v for k, v in c.items() if k != 'case_id'}, 'id': f'T{i+1:02}'} for i, c in enumerate(cases)]
    prompt = RULES + json.dumps(blind, separators=(',', ':'))
    (ROOT / 'prompt.txt').write_text(prompt)
    (ROOT / 'protocol.json').write_text(json.dumps({
        'cases': len(cases), 'repetitions': 1, 'prompt_sha256': hashlib.sha256(prompt.encode()).hexdigest(),
        'primary_metric': 'correct status and feasible global optimum, tolerance 1e-6',
        'secondary_metric': 'correct status and feasible solution, without optimum requirement',
        'conditions': 'same complete rules and cases as solver, model has no tools or answer key',
        'limits': ['synthetic same-author cases, not independent holdout', 'single tool-free model run is not all AI',
                   'no human time measurement', 'AI with code tools not evaluated', 'no financial returns'],
    }, indent=2) + '\n')
    return cases, prompt


def grade(cases, response):
    ns = load_functions()
    answers = response.get('answers', [])
    rows = []
    for i, case in enumerate(cases):
        key = f'T{i+1:02}'
        found = [a for a in answers if isinstance(a, dict) and a.get('id') == key]
        optimum = ns['exhaustive'](case) if case['cash'] >= 0 else None
        expected = 'invalid_input' if case['cash'] < 0 else 'infeasible' if optimum is None else 'feasible'
        correct = feasible = False
        reason = 'missing_or_duplicate_answer'
        if len(found) == 1:
            a = found[0]
            reason = 'wrong_status_or_invalid_delta'
            if a.get('status') == expected:
                if expected != 'feasible':
                    correct = feasible = True
                else:
                    d = a.get('delta')
                    if isinstance(d, list) and len(d) == 3 and all(type(x) is int for x in d):
                        feasible = ns['audit'](case, d)['pass']
                        value = sum(s*x for s, x in zip(ns['scores'](case), d)) - .05*sum(map(abs, d))
                        correct = feasible and abs(value-optimum['objective']) <= 1e-6
                reason = 'correct' if correct else 'suboptimal_or_constraint_violation'
        rows.append({'id': key, 'correct': bool(correct), 'feasible_or_correct_status': bool(feasible), 'reason': reason})
    return {'count': len(rows), 'correct': sum(r['correct'] for r in rows), 'rows': rows}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--operator-probe', action='store_true')
    ap.add_argument('--run-model', action='store_true')
    ap.add_argument('--model-only', action='store_true', help='Run inference without repeating operator-access probes')
    ap.add_argument('--grade-response', type=Path, help='Grade a saved answer JSON from a fresh tool-free model conversation')
    args = ap.parse_args()
    if args.operator_probe:
        operator_probe()
        return
    cases, prompt = prepare()
    if args.grade_response:
        response = json.loads(args.grade_response.read_text())
        result = grade(cases, response)
        (ROOT / 'model-grade.json').write_text(json.dumps(result, indent=2)+'\n')
        print(json.dumps({'correct': result['correct'], 'count': result['count']}))
        return
    if args.model_only:
        run_model(cases, prompt)
        return
    p = subprocess.run([sys.executable, str(Path(__file__).resolve()), '--operator-probe'], capture_output=True, text=True, check=True)
    privacy = json.loads(p.stdout)
    privacy['operator_privacy_passed'] = not any(t['attack_succeeded'] for t in privacy['checks'])
    (ROOT / 'privacy-results.json').write_text(json.dumps(privacy, indent=2)+'\n')
    # Control the grader itself with a known optimum and deliberately bad outputs.
    control = {'answers': [{'id': f'T{i+1:02}', **nsout} for i, nsout in enumerate(
        load_functions()['solve'](c) for c in cases)]}
    assert grade(cases, control)['correct'] == len(cases)
    assert grade(cases, {'answers': []})['correct'] == 0
    assert grade(cases, {'answers': [{'id': 'T01', 'status': 'feasible', 'delta': [2,0,0]}]})['correct'] == 0
    print(json.dumps({'privacy_attacks_succeeded': sum(t['attack_succeeded'] for t in privacy['checks']), 'privacy_tests': len(privacy['checks']), 'grader_controls': 'passed', 'prompt_prepared': len(cases)}))
    if not args.run_model:
        return
    run_model(cases, prompt)


def run_model(cases, prompt):
    cmd = ['claude','-p','--safe-mode','--tools','','--disable-slash-commands',
           '--strict-mcp-config','--mcp-config','{"mcpServers":{}}',
           '--no-session-persistence','--output-format','json',
           '--system-prompt','You solve synthetic allocation problems. Use only the supplied rules. Return the requested JSON.']
    start = time.monotonic()
    try:
        r = subprocess.run(cmd,input=prompt,capture_output=True,text=True,cwd='/tmp',timeout=180)
        result = {'status': 'completed', 'returncode': r.returncode, 'stdout': r.stdout, 'stderr': r.stderr, 'seconds': time.monotonic()-start}
    except subprocess.TimeoutExpired:
        result = {'status': 'timeout', 'seconds': time.monotonic()-start}
    (ROOT / 'model-run.json').write_text(json.dumps(result, indent=2)+'\n')
    if result['status'] == 'completed' and result['returncode'] == 0:
        envelope = json.loads(result['stdout'])
        raw = envelope['result'].strip()
        if raw.startswith('```'):
            raw = '\n'.join(raw.splitlines()[1:-1])
        (ROOT / 'model-grade.json').write_text(json.dumps(grade(cases,json.loads(raw)),indent=2)+'\n')


if __name__ == '__main__':
    main()
