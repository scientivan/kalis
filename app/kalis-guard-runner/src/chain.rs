//! Guard runner only: read NEAR testnet state inside the TEE before the seller's method runs.
//! The buyer's data may carry `onchain_request: {"account": <sandbox id>, "token": <contract id>}`.
//! The runner (not the method, which still has no socket) makes read-only JSON-RPC view calls to one
//! host, `rpc.testnet.near.org` (the only other host in this runner's OutLayer allowlist), and puts the
//! answers into the data as `onchain`, overwriting anything the buyer typed under that key.
use serde_json::{json, Value};

pub const RPC: &str = "https://rpc.testnet.near.org";
const ADMIN: [&str; 22] = ["set_owner", "change_owner", "transfer_ownership", "set_admin", "pause", "unpause", "set_paused",
    "blacklist", "add_to_blacklist", "ban", "freeze", "mint", "ft_mint", "upgrade", "migrate", "update_contract",
    "set_fee", "set_tax", "set_sell_tax", "withdraw_all", "burn_from", "set_metadata"];

fn rpc(params: Value) -> Result<Value, String> {
    let body = serde_json::to_vec(&json!({"jsonrpc": "2.0", "id": "kalis", "method": "query", "params": params})).unwrap();
    let (status, out) = crate::ai::http("POST", RPC, &[("Content-Type", "application/json".to_string())], Some(body))?;
    if status != 200 { return Err(format!("rpc status {status}")); }
    let v: Value = serde_json::from_slice(&out).map_err(|e| e.to_string())?;
    if !v["error"].is_null() { return Err(v["error"]["cause"]["name"].as_str().unwrap_or("rpc error").to_string()); }
    if let Some(e) = v["result"]["error"].as_str() { return Err(e.chars().take(160).collect()); }
    Ok(v["result"].clone())
}
fn valid_id(s: &str) -> bool { !s.is_empty() && s.len() <= 64 && s.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || matches!(c, '-' | '_' | '.')) }

/// Names in the export section (id 7) of a WASM module.
fn exports(w: &[u8]) -> Vec<String> {
    fn leb(w: &[u8], i: &mut usize) -> Option<u64> { let (mut r, mut s) = (0u64, 0); loop { let b = *w.get(*i)?; *i += 1; r |= ((b & 0x7f) as u64) << s; if b & 0x80 == 0 { return Some(r); } s += 7; if s > 63 { return None; } } }
    let mut out = Vec::new();
    if w.len() < 8 || &w[0..4] != b"\0asm" { return out; }
    let mut i = 8;
    while i < w.len() {
        let id = w[i]; i += 1;
        let Some(len) = leb(w, &mut i) else { break };
        let end = i + len as usize;
        if id == 7 {
            let mut j = i;
            let n = leb(w, &mut j).unwrap_or(0);
            for _ in 0..n { let Some(l) = leb(w, &mut j) else { break }; let e = j + l as usize; if e > end { break; } out.push(String::from_utf8_lossy(&w[j..e]).to_string()); j = e + 1; let _ = leb(w, &mut j); }
            break;
        }
        i = end;
    }
    out
}

fn account(id: &str) -> Result<Value, String> {
    let a = rpc(json!({"request_type": "view_account", "finality": "final", "account_id": id}))?;
    Ok(json!({"id": id, "amount": a["amount"], "locked": a["locked"], "code_hash": a["code_hash"], "storage_usage": a["storage_usage"], "block_height": a["block_height"]}))
}

pub fn enrich(data: &[u8]) -> (Vec<u8>, Option<Value>) {
    let Ok(mut v) = serde_json::from_slice::<Value>(data) else { return (data.to_vec(), None) };
    let req = v["onchain_request"].clone();
    if !req.is_object() { return (data.to_vec(), None); }
    let mut oc = json!({"rpc": RPC, "read_by": "kalis-guard-runner inside the OutLayer TEE"});
    let mut summary = Vec::new();
    if let Some(id) = req["account"].as_str().filter(|s| valid_id(s)) {
        match account(id) {
            Ok(a) => {
                oc["block_height"] = a["block_height"].clone();
                oc["account"] = a;
                match rpc(json!({"request_type": "view_access_key_list", "finality": "final", "account_id": id})) {
                    Ok(k) => { oc["access_keys"] = k["keys"].clone(); }
                    Err(e) => { oc["access_keys_error"] = json!(e); }
                }
                summary.push(format!("account {id}"));
            }
            Err(e) => { oc["error"] = json!(format!("view_account {id}: {e}")); }
        }
    }
    if let Some(id) = req["token"].as_str().filter(|s| valid_id(s)) {
        let mut c = json!({"id": id});
        match account(id) {
            Ok(a) => {
                c["code_hash"] = a["code_hash"].clone(); c["storage_usage"] = a["storage_usage"].clone(); c["amount"] = a["amount"].clone();
                c["has_code"] = json!(a["code_hash"] != "11111111111111111111111111111111");
                oc["block_height"] = a["block_height"].clone();
                if let Ok(code) = rpc(json!({"request_type": "view_code", "finality": "final", "account_id": id})) {
                    use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
                    let w = B64.decode(code["code_base64"].as_str().unwrap_or("")).unwrap_or_default();
                    let ex = exports(&w);
                    c["code_size"] = json!(w.len());
                    c["export_count"] = json!(ex.len());
                    c["admin_methods"] = json!(ex.iter().filter(|n| ADMIN.iter().any(|a| n.as_str() == *a || n.contains(a))).cloned().collect::<Vec<_>>());
                    c["is_ft"] = json!(ex.iter().any(|n| n == "ft_transfer"));
                }
                let args = "e30="; // base64 of {}
                if let Ok(m) = rpc(json!({"request_type": "call_function", "finality": "final", "account_id": id, "method_name": "ft_metadata", "args_base64": args})) {
                    let bytes: Vec<u8> = m["result"].as_array().map(|a| a.iter().filter_map(|b| b.as_u64().map(|x| x as u8)).collect()).unwrap_or_default();
                    c["ft_metadata"] = serde_json::from_slice::<Value>(&bytes).unwrap_or(Value::Null);
                }
                for owner in ["get_owner", "owner_id", "get_owner_id"] {
                    if let Ok(m) = rpc(json!({"request_type": "call_function", "finality": "final", "account_id": id, "method_name": owner, "args_base64": args})) {
                        let bytes: Vec<u8> = m["result"].as_array().map(|a| a.iter().filter_map(|b| b.as_u64().map(|x| x as u8)).collect()).unwrap_or_default();
                        c["owner"] = serde_json::from_slice::<Value>(&bytes).unwrap_or(Value::Null);
                        break;
                    }
                }
                summary.push(format!("token {id}"));
            }
            Err(e) => { c["error"] = json!(e); }
        }
        oc["contract"] = c;
    }
    let report = json!({"rpc": RPC, "read": summary, "block_height": oc["block_height"], "error": oc["error"]});
    v["onchain"] = oc;
    (serde_json::to_vec(&v).unwrap(), Some(report))
}
