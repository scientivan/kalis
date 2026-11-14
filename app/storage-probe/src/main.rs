//! OutLayer storage probe. Uses the same raw storage calls as the private
//! protections runner (get-raw, set-if-absent-raw, set-if-equals-raw) on a
//! caller-chosen key, so two calls prove persistence across executions.
//! Input: {"key": "...", "mode": "write" | "read"}. Values are synthetic.
use std::io::Read;
mod host {
    wit_bindgen::generate!({world:"private-storage",path:"wit",generate_all});
}
use host::near::storage::api as s;

fn main() {
    let mut raw = String::new();
    std::io::stdin().read_to_string(&mut raw).ok();
    let v: serde_json::Value = serde_json::from_str(&raw).unwrap_or_default();
    let key = format!("probe/{}", v["key"].as_str().unwrap_or("default"));
    let mode = v["mode"].as_str().unwrap_or("write");
    let mut steps = Vec::new();
    let (b, e) = s::get_raw(&key);
    steps.push(serde_json::json!({"op":"get_raw","value":String::from_utf8_lossy(&b),"error":e}));
    if mode == "write" {
        let (ok, e) = s::set_if_absent_raw(&key, b"v1");
        steps.push(serde_json::json!({"op":"set_if_absent v1","ok":ok,"error":e}));
        let (ok, e) = s::set_if_absent_raw(&key, b"vX");
        steps.push(serde_json::json!({"op":"set_if_absent again (expect false)","ok":ok,"error":e}));
        let (ok, _, e) = s::set_if_equals_raw(&key, b"v1", b"v2");
        steps.push(serde_json::json!({"op":"set_if_equals v1->v2","ok":ok,"error":e}));
        let (ok, _, e) = s::set_if_equals_raw(&key, b"v1", b"v3");
        steps.push(serde_json::json!({"op":"set_if_equals stale v1->v3 (expect false)","ok":ok,"error":e}));
        let (b, e) = s::get_raw(&key);
        steps.push(serde_json::json!({"op":"get_raw (expect v2)","value":String::from_utf8_lossy(&b),"error":e}));
    }
    println!("{}", serde_json::json!({"ok":true,"key":key,"mode":mode,"steps":steps}));
}
