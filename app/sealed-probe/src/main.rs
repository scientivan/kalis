//! Sealed-input probe for OutLayer.
//!
//! Goal: show that everything that passes through the OutLayer coordinator
//! (input and output) is ciphertext, while the TEE worker can still read the
//! buyer's portfolio, run the rebalancing method, and answer.
//!
//! Key: `PROTECTED_SEAL_KEY` is a 32-byte secret generated inside the TEE
//! keystore (`outlayer secrets set --generate PROTECTED_SEAL_KEY:hex32`).
//! Nobody, including the project owner, sees its value. This module derives
//! the X25519 public key from it and publishes only the public key.
//!
//! Commands (stdin JSON):
//!   {"cmd":"pubkey"}
//!   {"cmd":"run","epk":<b64>,"nonce":<b64>,"ct":<b64>}
//! Request plaintext = portfolio case JSON (same fields as
//! validation/portfolio-method-02/cases.json).

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use chacha20poly1305::{aead::Aead, ChaCha20Poly1305, KeyInit, Nonce};
use hkdf::Hkdf;
use serde::Deserialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::io::{self, Read};
use x25519_dalek::{PublicKey, StaticSecret};

const INFO_REQ: &[u8] = b"sealed-probe/v1/request";
const INFO_RESP: &[u8] = b"sealed-probe/v1/response";

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

/// Port of `oracle()`: exhaustive integer enumeration, minimum cost.
fn solve(c: &Case) -> Value {
    let n = c.holdings.len();
    let ranges: Vec<(i64, i64)> = (0..n)
        .map(|i| (if c.allow_sell { -c.holdings[i] } else { 0 }, c.buy_limit))
        .collect();
    let mut d = ranges.iter().map(|r| r.0).collect::<Vec<_>>();
    let mut best: Option<(Vec<i64>, f64, f64, f64, Vec<f64>)> = None;
    loop {
        if let Some((cost, cash, nav, values)) = audit(c, &d) {
            if best.as_ref().map_or(true, |b| cost < b.1 - 1e-9) {
                best = Some((d.clone(), cost, cash, nav, values));
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

fn seal_key() -> Result<StaticSecret, String> {
    let hexkey = std::env::var("PROTECTED_SEAL_KEY").map_err(|_| "PROTECTED_SEAL_KEY missing".to_string())?;
    let bytes = hex::decode(hexkey.trim()).map_err(|_| "seal key not hex".to_string())?;
    let arr: [u8; 32] = bytes.try_into().map_err(|_| "seal key not 32 bytes".to_string())?;
    Ok(StaticSecret::from(arr))
}

fn derive(shared: &[u8], epk: &[u8], tpk: &[u8], info: &[u8]) -> [u8; 32] {
    let mut salt = Vec::with_capacity(64);
    salt.extend_from_slice(epk);
    salt.extend_from_slice(tpk);
    let hk = Hkdf::<Sha256>::new(Some(&salt), shared);
    let mut okm = [0u8; 32];
    hk.expand(info, &mut okm).expect("hkdf");
    okm
}

fn b64(v: &Value, k: &str) -> Result<Vec<u8>, String> {
    let s = v.get(k).and_then(|x| x.as_str()).ok_or(format!("missing {k}"))?;
    B64.decode(s).map_err(|_| format!("{k} not base64"))
}

fn run(input: &Value) -> Result<Value, String> {
    let sk = seal_key()?;
    let tpk = PublicKey::from(&sk);
    let epk_bytes: [u8; 32] = b64(input, "epk")?.try_into().map_err(|_| "epk not 32 bytes")?;
    let nonce = b64(input, "nonce")?;
    let ct = b64(input, "ct")?;
    if nonce.len() != 12 {
        return Err("nonce not 12 bytes".into());
    }
    let shared = sk.diffie_hellman(&PublicKey::from(epk_bytes));
    let k_req = derive(shared.as_bytes(), &epk_bytes, tpk.as_bytes(), INFO_REQ);
    let pt = ChaCha20Poly1305::new((&k_req).into())
        .decrypt(Nonce::from_slice(&nonce), ct.as_ref())
        .map_err(|_| "decrypt failed".to_string())?;
    let case: Case = serde_json::from_slice(&pt).map_err(|e| format!("bad case: {e}"))?;
    let result = solve(&case);

    let k_resp = derive(shared.as_bytes(), &epk_bytes, tpk.as_bytes(), INFO_RESP);
    let mut rnonce = [0u8; 12];
    getrandom::getrandom(&mut rnonce).map_err(|_| "rng")?;
    let rct = ChaCha20Poly1305::new((&k_resp).into())
        .encrypt(Nonce::from_slice(&rnonce), serde_json::to_vec(&result).unwrap().as_ref())
        .map_err(|_| "encrypt failed".to_string())?;
    Ok(json!({
        "ok": true,
        "tee_pubkey": hex::encode(tpk.as_bytes()),
        // hash of the sealed request lets the buyer match this answer to what it sent
        "request_ct_sha256": hex::encode(Sha256::digest(&ct)),
        "nonce": B64.encode(rnonce),
        "ct": B64.encode(rct)
    }))
}

fn main() {
    let mut buf = String::new();
    io::stdin().read_to_string(&mut buf).ok();
    let input: Value = serde_json::from_str(&buf).unwrap_or(Value::Null);
    let out = match input.get("cmd").and_then(|c| c.as_str()) {
        Some("pubkey") => seal_key()
            .map(|sk| json!({"ok": true, "tee_pubkey": hex::encode(PublicKey::from(&sk).as_bytes())})),
        Some("run") => run(&input),
        _ => Err("unknown cmd".into()),
    };
    let out = out.unwrap_or_else(|e| json!({"ok": false, "error": e}));
    println!("{}", out);
}
