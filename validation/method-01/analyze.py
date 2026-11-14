"""Synthetic-schema reconciliation prototype. Not a causal diagnosis or production runtime."""
import json
from collections import defaultdict, Counter

def _reconcile(data):
    seen = {}
    conflicts = []
    for e in data["events"]:
        if e["id"] in seen and seen[e["id"]] != e:
            conflicts.append(e["id"])
        seen[e["id"]] = e
    if conflicts:
        return {"status": "data_conflict", "first_observed": None,
                "evidence_ids": sorted(set(conflicts)), "findings": [],
                "uncertainty": "Conflicting event payloads require reconciliation before localization."}
    ctx = [x for x in data.get("context", []) if isinstance(x, dict)]
    aliases = {x["alias"]: x["canonical"] for x in ctx if x.get("type") == "sku_alias"}
    def canonical(s):
        return aliases.get(s, s)
    lines = defaultdict(list)
    for e in seen.values():
        lines[(e["order"], e["line"])].append(e)
    findings = []
    insufficient = False
    for (order, line), events in sorted(lines.items()):
        targets = [e for e in events if e["stage"] in ("order", "amendment")]
        stages = [s for s in ("pick", "pack", "ship") if any(e["stage"] == s for e in events)]
        if not targets or not stages:
            insufficient = True
            continue
        for stage in stages:
            logs = [e for e in events if e["stage"] == stage]
            t = min(e["time"] for e in logs)
            available = [e for e in targets if e["time"] <= t]
            if not available:
                insufficient = True
                continue
            target = max(available, key=lambda e: (e["time"], e["version"]))
            expected = Counter({canonical(target["sku"]): target["qty"]})
            for x in ctx:
                if x.get("type") == "approved_substitution" and x["order"] == order and x["line"] == line and x["time"] <= t:
                    old, new, qty = canonical(x["from_sku"]), canonical(x["to_sku"]), x["qty"]
                    if expected[old] < qty:
                        return {"status":"data_conflict", "first_observed":None, "evidence_ids":[x["id"]], "findings":[], "uncertainty":"Substitution exceeds target quantity."}
                    expected[old] -= qty
                    expected[new] += qty
            actual = Counter()
            for e in logs:
                actual[canonical(e["sku"])] += e["qty"]
            if +expected != +actual:
                findings.append({"order":order, "line":line, "stage":stage,
                    "time":t, "expected":dict(+expected), "observed":dict(+actual),
                    "evidence_ids":[target["id"]]+[e["id"] for e in logs]})
                break
    first = min(findings, key=lambda x:x["time"]) if findings else None
    return {"status":"mismatch" if findings else "insufficient" if insufficient else "consistent",
        "first_observed": first["stage"] if first else None,
        "evidence_ids":sorted({i for f in findings for i in f["evidence_ids"]}),
        "findings":findings,
        "uncertainty":"Only supplied log consistency was checked. First observed stage is not proof of origin or cause. Missing stages and physical contents remain unverified."}

def analyze(data):
    if not data.get("events"):
        return {"status":"insufficient", "first_observed":None, "evidence_ids":[], "findings":[], "uncertainty":"Empty export contains no evidence."}
    open_stages = [x for x in data.get("context", []) if isinstance(x,dict) and x.get("type") == "stage_state" and x.get("state") == "open"]
    if open_stages:
        return {"status":"insufficient", "first_observed":None, "evidence_ids":[], "findings":[], "uncertainty":"Open stages require a completed snapshot before shortage classification. Other lines not certified by this limited prototype."}
    result = _reconcile(data)
    if result["status"] == "consistent" and any(e["stage"] == "complaint" for e in data["events"]):
        result["status"] = "insufficient"
        result["evidence_ids"] = [e["id"] for e in data["events"] if e["stage"] == "complaint"]
        result["uncertainty"] = "System logs are consistent but a customer report remains unresolved. Request physical verification."
    return result

if __name__ == "__main__":
    import sys
    print(json.dumps(analyze(json.load(sys.stdin)), ensure_ascii=False, indent=2))
