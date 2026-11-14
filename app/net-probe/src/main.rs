//! Network probe for OutLayer. Built twice from the same source:
//! without a manifest (control) and with `--features no-network`, which embeds
//! `{"capabilities":{"network":[]}}`. Each build tries one outbound HTTPS GET
//! and reports what happened.
use wstd::http::{Body, Client, Request};

#[cfg(all(target_family = "wasm", feature = "no-network"))]
#[used]
#[unsafe(link_section = "outlayer.manifest")]
static OUTLAYER_MANIFEST: [u8; 31] = *br#"{"capabilities":{"network":[]}}"#;

const TARGET: &str = "https://example.com/";

#[wstd::main]
async fn main() {
    let manifest = if cfg!(feature = "no-network") { "network: []" } else { "none" };
    let req = Request::get(TARGET).body(Body::empty());
    let result = match req {
        Err(e) => serde_json::json!({"reached": false, "error": format!("build request: {e}")}),
        Ok(req) => match Client::new().send(req).await {
            Ok(resp) => serde_json::json!({"reached": true, "status": resp.status().as_u16()}),
            Err(e) => serde_json::json!({"reached": false, "error": e.to_string()}),
        },
    };
    println!("{}", serde_json::json!({"ok": true, "manifest": manifest, "target": TARGET, "result": result}));
}
