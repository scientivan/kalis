# Kalis method manifest v5

Documentation audit, 14 November 2026. This is the manifest schema contract, not proof of every end-to-end workflow. Current runtime, privacy boundaries, version evidence and unresolved policy are reconciled in ../../CURRENT_STATE.md. Runtime methods use the manifest hash of their selected on-chain version. Earlier example versions are not automatically the latest deployed version.

One JSON file per method version. Its SHA-256 (of the exact file bytes) is recorded on chain as
`manifest_hash`, so every field below is bound to the version the buyer pays for. The runner, the
five protections, the buyer form, the result view and the buyer checks all read this file. No
per-method code in the platform.

Decided in RANCANGAN_PRODUK.md 65 and 65.1–65.4.

## Top-level fields

```json
{
  "manifest_version": 5,
  "method_id": "tender-bid",
  "kind": "wasm",
  "listing": { ... },
  "inputs": { ... },
  "ai": { "allowed": ["deepseek-ai/DeepSeek-V4.1-Flash-1017"], "proprietary": false },
  "steps": [ { "id": "read_requirements", "what": "..." } ],
  "connectors": [ ... ],
  "outbound": [ ... ],
  "memory": { "read": false, "write": false },
  "browser": { "enabled": false },
  "outputs": { ... },
  "buyer_checks": [ ... ],
  "seller_secrets": ["pricing rules"],
  "disclosures": ["..."],
  "runtime": { "runner": "kalis-runner 0.5", "outlayer_network": ["cloud-api.near.ai"] },
  "dao_share_percent": 10
}
```

- `kind`: `"wasm"` or `"prompt"`. Prompt methods must list at least one model in `ai.allowed`; the runner uses the first.
- `steps`: ids the method reports. Prompt methods always declare `ask_model` then `leak_check` (the runner reports them).
- `connectors`, `outbound`, `memory`, `browser`: unchanged from v4 (see `portfolio-rebalance/manifest-v4.json`, `tender-bid/manifest.json`). Connector entries: `{ "id": "sheets_mock", "operations": ["read_range"], "what": "..." }`.
- `dao_share_percent`: must equal `dao_share_pct` published on chain, at least 10.

## listing

Shown on the marketplace card and the detail page. Required: `title`, `outcome` (one sentence of what the buyer gets), `category`, `seller` (`{ "display_name", "role", "demo": true }`), `urgency` (one sentence on why this cannot wait and why the data must stay private), `limits` (array of strings), `sample_output` (short synthetic example, labelled), `not_advice` (true for finance or legal methods).

```json
"listing": {
  "title": "Price a tender bid above your minimum margin",
  "outcome": "A bid price, the reasons behind it and a checklist of mandatory documents.",
  "category": "Procurement",
  "seller": { "display_name": "Rani Hartono (demo seller)", "role": "Procurement consultant", "demo": true },
  "urgency": "The tender closes on 20 November and your cost price must never reach a competitor.",
  "limits": ["Indonesian public tenders in IDR", "One tender per run"],
  "sample_output": "Synthetic example: bid IDR 885,080,000 (90.3% of HPS) ...",
  "not_advice": false
}
```

## inputs

The buyer form is generated from `inputs.fields`. Each field:

| Key | Meaning |
|---|---|
| `id` | JSON key in the buyer data object (dots not allowed; nest with `type: "object"`) |
| `label` | Form label |
| `type` | `string`, `number`, `integer`, `boolean`, `enum`, `money`, `percent`, `date`, `array`, `object`, `text` (long text) |
| `required` | boolean |
| `private` | true if the value is sensitive. The UI marks it and adds it to the outbound private-values list |
| `unit` | e.g. `IDR`, `NEAR`, `%`, `days` |
| `min`, `max` | numeric bounds |
| `enum` | allowed values for `enum` |
| `items` | for `array`: `{ "type": ..., "fields": [...] }` for arrays of objects, `min_items`, `max_items` |
| `fields` | for `object`: nested field list |
| `source` | where the value may come from: `typed` (default), `document`, `connector:<id>.<operation>`, `memory`, `browser`, `file_import:xlsx`, `file_import:docx` |
| `help` | one sentence shown under the field |

`percent` values are fractions in data (`0.09` means 9%). `money` values are plain numbers in the stated unit.

Also: `inputs.sample` (a synthetic example object, labelled fictional) and `inputs.documents` (`["image", "pdf"]` or `[]`).

## outputs

The result view is generated from `outputs.fields`, same field shape as inputs plus `display`: `money`, `percent`, `number`, `text`, `list`, `table`, `badge`, `markdown`. Prompt methods: the answer opens as `{ status, text }`; if the prompt asks the model for JSON, declare `outputs.parse: "json_in_text"` and the client parses `text` before checks.

`outputs.status_field` names the field that carries the outcome (for example `status` with values `feasible` / `infeasible`). `outputs.unverifiable_status` lists status values the buyer cannot check on device (for example `["infeasible"]`).

## buyer_checks

Each check is data, evaluated on the buyer device by the platform checker (`checks.js`, JSONLogic). Seller JavaScript is never run.

```json
{
  "id": "price_floor",
  "description": "Bid is at least cost price plus minimum margin",
  "when": { "==": [ { "var": "answer.status" }, "ok" ] },
  "rule": { ">=": [ { "var": "answer.bid_price" }, { "*": [ { "var": "input.cost_price" }, { "+": [1, { "var": "input.min_margin" }] } ] } ] },
  "message": "The bid is below your cost price plus your minimum margin.",
  "tolerance": 0.000001
}
```

- Variables: `input.*` (the buyer data before sealing) and `answer.*` (the opened answer, after `json_in_text` parsing for prompts).
- `when` (optional): if it is false, the check result is `not_applicable`.
- Result per check: `pass`, `fail`, or `cannot_check` (a variable is missing or not a number, or the rule errors). Missing checks are never counted as pass.
- `tolerance` (optional): numeric comparisons `>=`, `<=`, `==` are relaxed by this absolute amount.
- Supported operators: JSONLogic core (`var`, `missing`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, `!`, `!!`, `if`, `+`, `-`, `*`, `/`, `%`, `min`, `max`, `map`, `reduce`, `filter`, `all`, `some`, `none`, `in`, `cat`), plus Kalis extras `sum` (sum of a list), `count`, `abs`, `round2`, `zip_dot` (dot product of two lists), `get` (`{"get": [list, index]}`), `range` (`{"range": [n]}` gives 0..n-1, so a rule can walk several lists by index), `is_int`, `lower`, and `digits` (numbers in a text as whole tokens with thousand separators removed, so `{"in": [{"digits": [{"var": "input.walk_away"}]}, {"digits": [{"var": "answer.reply"}]}]}` finds 28000000 written as "28,000,000" or "28.000.000" but not inside 128000000). Any other operator makes the check `cannot_check`; there is no eval.
- Inside `map`, `filter`, `all`, `some`, `none`, `{"var": ""}` is the current item; inside `reduce` use `current` and `accumulator`. Paths starting with `input.`, `answer.` or `derived.` always read the root, so a loop over `{"range": [n]}` can index any list.
- `all` over an empty list is false.
- A checker version is reported: `kalis-checks/1`.

### derived

Optional named expressions computed once before the checks, in file order, readable as `derived.<name>` (each may use earlier ones). Use them for values several checks share, such as cost or cash after trades. A derived value that cannot be computed is simply absent, so the checks that read it report `cannot_check`.

### messages

`message` (required) is shown when the check fails, `pass_message` (optional) when it passes. Both may contain placeholders `{{path}}`, `{{path:2}}` (two decimals), `{{path:pct}}` (fraction as percent, one decimal) or `{{path:int}}`, with paths under `input`, `answer` or `derived`.

### Result and verdict

`runChecks(manifest, input, answer)` (exported by `kalis-crypto.js`, served as `/checks.js`) returns `{ checker_version, results: [{ id, description, status, message }], counts, passed, has_cannot_check, no_checks, unverifiable, derived, answer }`. `passed` means no check failed. `runVerdict({ ..., checks })` gives `do_not_use` when any check fails, `attention` when a check is `cannot_check`, when there are no checks, or when the status is in `outputs.unverifiable_status`. A prompt method is never better than `attention`. The local result never moves escrow money.

Worked examples: `portfolio-rebalance/manifest-v5.json` (all of `recheckPortfolio` as data, proven equal on 12 cases and 1,440 random trade lists by `app/backend/scripts/checks-test.mjs`) and `salary-counteroffer/manifest-v5.json` (prompt with `json_in_text`).

## Validation before publish

`POST /api/manifests/validate` (backend, `src/manifest-validate.js`) refuses a manifest that has: an unknown `kind`; a prompt without a model, or prompt steps other than `ask_model, leak_check`; a model the runner cannot attest (today DeepSeek V4.1 Flash, Qwen3-VL 30B, privacy-filter) or `ai.proprietary: true`; a connector or operation the backend does not serve (`broker_mock.read_positions`, `sheets_mock.read_range`, `docs_mock.read_document`, `wallet_mock.read_positions|read_loans|read_vesting`); an input `source` naming an undeclared connector, or `document`/`memory`/`browser` without the matching permission; a check or derived value reading a variable not declared in `inputs`, `outputs` or `derived`; an unknown operator; a `dao_share_percent` outside 10–90; an empty `steps` list for `wasm`; missing `listing` fields; malformed fields (bad id, unknown type or display, enum without values). Older manifests (v2–v4) pass with a warning so published versions stay readable; new versions should be v5.
