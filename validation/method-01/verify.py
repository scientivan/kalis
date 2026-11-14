"""Reproduce bounded synthetic correctness checks. Does not run an LLM benchmark."""
from pathlib import Path
import json, random, copy, time
from analyze import analyze
r=Path(__file__).parent
keys=json.loads((r/"evaluator/answer-key.json").read_text())
passed=0
stable=0
rng=random.Random(20261113)
for k in keys:
    data=json.loads((r/"inputs"/k["split"]/(k["case_id"]+".json")).read_text())
    out=analyze(data)
    passed += (out["status"],out["first_observed"]) == (k["status"],k["first_observed"])
    for _ in range(10):
        x=copy.deepcopy(data)
        rng.shuffle(x["events"])
        z=analyze(x)
        stable += (z["status"],z["first_observed"]) == (out["status"],out["first_observed"])
reg=json.loads((r/"results/revised-checks.json").read_text())["adversarial_development_regressions"]
reg_pass=sum(analyze(x["input"])["status"]==x["expected_status"] for x in reg)
bulk=json.loads((r/"inputs/bulk-1000.json").read_text())
t=time.perf_counter()
b=analyze(bulk)
elapsed=time.perf_counter()-t
report={"original_status_stage_passes":passed,"original_total":12,"shuffle_stability":stable,"shuffle_total":120,"development_regression_passes":reg_pass,"development_regression_total":5,"bulk_findings":len(b["findings"]),"bulk_expected":100,"bulk_stages_correct":all(f["stage"]=="pack" for f in b["findings"]),"bulk_seconds":elapsed,"llm_benchmark_completed":False,"human_efficiency_measured":False}
(r/"results/final-local-checks.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps(report,indent=2))
raise SystemExit(0 if passed==12 and stable==120 and reg_pass==5 and len(b["findings"])==100 and report["bulk_stages_correct"] else 1)
