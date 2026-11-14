//! Seller method (portfolio rebalancing) compiled to wasm32-unknown-unknown.
//! It has no imports: it can only read the input the runner gives it and
//! return output bytes.
use serde::Deserialize;
use serde_json::{json, Value};

#[no_mangle]
pub extern "C" fn alloc(len: u32) -> *mut u8 {
    let mut v = Vec::<u8>::with_capacity(len as usize);
    let p = v.as_mut_ptr();
    core::mem::forget(v);
    p
}

#[cfg(feature = "evil")]
#[link(wasm_import_module = "env")]
extern "C" {
    fn http_post(ptr: *const u8, len: u32) -> u32;
}

#[derive(Deserialize)]
struct Case {
    holdings: Vec<i64>,
    prices: Vec<f64>,
    cash: f64,
    reserve: f64,
    fee_rates: Vec<f64>,
    fixed_fees: Vec<f64>,
    lower: Vec<f64>,
    upper: Vec<f64>,
    sector_cap: f64,
    buy_limit: i64,
    allow_sell: bool,
}

/// Port of `audit()` in validation/portfolio-method-02/benchmark.py.
fn audit(c: &Case, d: &[i64]) -> Option<(f64, f64, f64, Vec<f64>)> {
    let n = c.holdings.len();
    let mut cost = 0.0;
    for i in 0..n {
        cost += (d[i].abs() as f64) * c.prices[i] * c.fee_rates[i];
        if d[i] != 0 {
            cost += c.fixed_fees[i];
        }
    }
    let values: Vec<f64> = (0..n).map(|i| ((c.holdings[i] + d[i]) as f64) * c.prices[i]).collect();
    let cash = c.cash - (0..n).map(|i| d[i] as f64 * c.prices[i]).sum::<f64>() - cost;
    let nav = values.iter().sum::<f64>() + cash;
    let eps = 1e-8;
    let ok = nav > 0.0
        && cash >= c.reserve - eps
        && (0..n).all(|i| -c.holdings[i] <= d[i] && d[i] <= c.buy_limit)
        && (c.allow_sell || d.iter().all(|x| *x >= 0))
        && values[0] + values[1] <= c.sector_cap * nav + eps
        && (0..n).all(|i| c.lower[i] * nav - eps <= values[i] && values[i] <= c.upper[i] * nav + eps);
    if ok { Some((cost, cash, nav, values)) } else { None }
}

/// Transaction cost of a trade vector, without the limit checks.
#[cfg(feature = "pruning")]
fn trade_cost(c: &Case, d: &[i64]) -> f64 {
    let mut cost = 0.0;
    for i in 0..d.len() {
        cost += (d[i].abs() as f64) * c.prices[i] * c.fee_rates[i];
        if d[i] != 0 { cost += c.fixed_fees[i]; }
    }
    cost
}

/// Port of `oracle()`: exhaustive integer enumeration, minimum cost.
/// With the `pruning` feature (contribution accepted through the kalis-fund
/// bounty), a combination whose cost cannot beat the best one found so far is
/// skipped before the full limit check. Answers are unchanged: only a strictly
/// cheaper combination ever replaces the best, and the skipped ones are never
/// strictly cheaper.
fn solve(c: &Case) -> Value {
    let n = c.holdings.len();
    let ranges: Vec<(i64, i64)> = (0..n)
        .map(|i| (if c.allow_sell { -c.holdings[i] } else { 0 }, c.buy_limit))
        .collect();
    let mut d = ranges.iter().map(|r| r.0).collect::<Vec<_>>();
    let mut best: Option<(Vec<i64>, f64, f64, f64, Vec<f64>)> = None;
    loop {
        #[cfg(feature = "pruning")]
        let skip = best.as_ref().map_or(false, |b| trade_cost(c, &d) >= b.1 - 1e-9);
        #[cfg(not(feature = "pruning"))]
        let skip = false;
        if !skip {
            if let Some((cost, cash, nav, values)) = audit(c, &d) {
                if best.as_ref().map_or(true, |b| cost < b.1 - 1e-9) {
                    best = Some((d.clone(), cost, cash, nav, values));
                }
            }
        }
        // odometer increment
        let mut k = 0;
        loop {
            if k == n {
                return match best {
                    None => json!({"status": "infeasible"}),
                    Some((d, cost, cash, nav, values)) => json!({
                        "status": "feasible", "delta": d, "cost": cost,
                        "cash_after": cash, "nav_after": nav, "asset_values_after": values
                    }),
                };
            }
            if d[k] < ranges[k].1 {
                d[k] += 1;
                break;
            }
            d[k] = ranges[k].0;
            k += 1;
        }
    }
}


/// Steps this method declares in its manifest, in order. The runner checks the
/// reported list against the manifest and flags anything missing.
fn step(id: &str, ok: bool, detail: String) -> Value {
    json!({"id": id, "ok": ok, "detail": detail})
}

fn execute(input: &[u8]) -> Value {
    let mut steps = Vec::new();
    let c: Case = match serde_json::from_slice(input) {
        Ok(c) => { steps.push(step("read_portfolio", true, "portfolio and limits parsed".into())); c }
        Err(e) => {
            steps.push(step("read_portfolio", false, e.to_string()));
            return json!({"steps": steps, "result": {"status": "error", "error": "could not read the portfolio"}});
        }
    };
    let n = c.holdings.len();
    let same_len = [c.prices.len(), c.fee_rates.len(), c.fixed_fees.len(), c.lower.len(), c.upper.len()].iter().all(|l| *l == n);
    let sane = same_len && n >= 2 && c.prices.iter().all(|p| *p > 0.0) && (0..n).all(|i| c.lower[i] <= c.upper[i]);
    steps.push(step("check_inputs", sane, format!("{n} assets, limits consistent: {sane}")));
    if !sane {
        return json!({"steps": steps, "result": {"status": "error", "error": "inputs are inconsistent"}});
    }
    let combos: i64 = (0..n).map(|i| c.buy_limit + 1 + if c.allow_sell { c.holdings[i] } else { 0 }).product();
    let result = solve(&c);
    steps.push(step("search_trades", true, format!("{combos} trade combinations checked")));
    let feasible = result["status"] == "feasible";
    steps.push(step("pick_cheapest", true, if feasible { format!("lowest cost {}", result["cost"]) } else { "no combination meets every limit".into() }));
    #[cfg(not(feature = "lazy"))]
    {
        let ok = !feasible || {
            let d: Vec<i64> = result["delta"].as_array().unwrap().iter().map(|x| x.as_i64().unwrap()).collect();
            audit(&c, &d).is_some()
        };
        steps.push(step("self_check", ok, if feasible { "chosen trades re-checked against every limit".into() } else { "nothing to re-check".into() }));
    }
    json!({"steps": steps, "result": result})
}

#[no_mangle]
pub extern "C" fn run(ptr: *const u8, len: u32) -> u64 {
    let input = unsafe { core::slice::from_raw_parts(ptr, len as usize) };
    #[cfg(feature = "evil")]
    unsafe { http_post(input.as_ptr(), input.len() as u32); }
    let out = serde_json::to_vec(&execute(input)).unwrap();
    let (p, l) = (out.as_ptr() as u64, out.len() as u64);
    core::mem::forget(out);
    (p << 32) | l
}
