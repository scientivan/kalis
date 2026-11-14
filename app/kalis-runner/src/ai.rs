//! Calls to NEAR AI Cloud from inside the runner.
//!
//! The runner is the only program that talks to the network, and the OutLayer
//! manifest lets it reach one host, `cloud-api.near.ai`. A seller's method never
//! gets a socket: it asks the runner through the `kalis.ai_chat` import, and the
//! runner decides whether the model is allowed by the method manifest.
//!
//! Every call is checked the same way as the backend does it
//! (`app/backend/src/protections/nearai.js`):
//! 1. Fresh-nonce attestation: the TDX report_data of the gateway and of every
//!    model server must hold that server's signing key and our nonce.
//! 2. The chat response must carry an ed25519 signature, by one of those
//!    attested model keys, over `<model>:<sha256 request>:<sha256 response>`.
//! An answer that fails either check is thrown away.
//! Limit: the Intel and NVIDIA certificate chains are not verified here.

use serde_json::{json, Value};
use sha2::{Digest, Sha256};

const BASE: &str = "https://cloud-api.near.ai/v1";
/// Most AI calls one run may make, whatever the method asks for.
pub const MAX_CALLS: usize = 4;
/// Largest `max_tokens` a method may ask for in one call.
pub const MAX_TOKENS: u64 = 4000;

/// One HTTP exchange. Returns (status, body).
#[cfg(target_family = "wasm")]
fn http(method: &str, url: &str, headers: &[(&str, String)], body: Option<Vec<u8>>) -> Result<(u16, Vec<u8>), String> {
    use wstd::http::{Body, Client, Request};
    wstd::runtime::block_on(async move {
        let mut b = Request::builder().method(method).uri(url);
        for (k, v) in headers {
            b = b.header(*k, v.as_str());
        }
        let req = b.body(match body { Some(x) => Body::from(x), None => Body::empty() }).map_err(|e| e.to_string())?;
        let mut resp = Client::new().send(req).await.map_err(|e| format!("{url}: {e}"))?;
        let status = resp.status().as_u16();
        let bytes = resp.body_mut().contents().await.map_err(|e| e.to_string())?.to_vec();
        Ok((status, bytes))
    })
}

/// Native builds (local tests only) use a blocking client.
#[cfg(not(target_family = "wasm"))]
fn http(method: &str, url: &str, headers: &[(&str, String)], body: Option<Vec<u8>>) -> Result<(u16, Vec<u8>), String> {
    let mut req = ureq::request(method, url);
    for (k, v) in headers {
        req = req.set(k, v);
    }
    let res = match body { Some(b) => req.send_bytes(&b), None => req.call() };
    let resp = match res {
        Ok(r) => r,
        Err(ureq::Error::Status(_, r)) => r,
        Err(e) => return Err(format!("{url}: {e}")),
    };
    let status = resp.status();
    let mut out = Vec::new();
    std::io::Read::read_to_end(&mut resp.into_reader(), &mut out).map_err(|e| e.to_string())?;
    Ok((status, out))
}

fn sha_hex(b: &[u8]) -> String {
    hex::encode(Sha256::digest(b))
}

/// Bytes 568..632 of a TDX quote: the report_data the enclave chose.
fn report_data(quote_hex: &str) -> Option<String> {
    let q = hex::decode(quote_hex).ok()?;
    (q.len() >= 632).then(|| hex::encode(&q[568..632]))
}

/// Attest the model with a fresh nonce. Returns the attested signing keys.
fn attest(model: &str) -> Result<(String, Vec<String>), String> {
    let mut n = [0u8; 32];
    getrandom::getrandom(&mut n).map_err(|_| "rng")?;
    let nonce = hex::encode(n);
    let url = format!("{BASE}/attestation/report?nonce={nonce}&signing_algo=ed25519&model={}&provider=near", model.replace('/', "%2F"));
    let (status, body) = http("GET", &url, &[], None)?;
    let d: Value = serde_json::from_slice(&body).map_err(|_| format!("attestation report for {model} is not JSON (HTTP {status})"))?;
    if d.get("error").is_some() {
        return Err(format!("{model} has no attestation report"));
    }
    let bound = |a: &Value| -> bool {
        let addr = a["signing_address"].as_str().unwrap_or("").to_lowercase();
        let rd = a["intel_quote"].as_str().and_then(report_data).unwrap_or_default();
        a["request_nonce"].as_str() == Some(nonce.as_str()) && rd.len() == 128 && rd[..64] == addr && rd[64..] == nonce
    };
    let models = d["model_attestations"].as_array().cloned().unwrap_or_default();
    if !bound(&d["gateway_attestation"]) || models.is_empty() || !models.iter().all(bound) {
        return Err(format!("{model} attestation did not bind the fresh nonce"));
    }
    Ok((nonce, models.iter().filter_map(|m| m["signing_address"].as_str().map(|s| s.to_lowercase())).collect()))
}

fn verify_sig(sig: &Value, signers: &[String], expected: &str) -> bool {
    use ed25519_dalek::{Signature, Verifier, VerifyingKey};
    let addr = sig["signing_address"].as_str().unwrap_or("").to_lowercase();
    if sig["text"].as_str() != Some(expected) || !signers.contains(&addr) {
        return false;
    }
    let (Ok(pk), Ok(s)) = (hex::decode(&addr), hex::decode(sig["signature"].as_str().unwrap_or("").trim_start_matches("0x"))) else { return false };
    let (Ok(pk), Ok(s)): (Result<[u8; 32], _>, Result<[u8; 64], _>) = (pk.try_into(), s.try_into()) else { return false };
    match VerifyingKey::from_bytes(&pk) {
        Ok(vk) => vk.verify(expected.as_bytes(), &Signature::from_bytes(&s)).is_ok(),
        Err(_) => false,
    }
}

fn pause(secs: u64) {
    std::thread::sleep(std::time::Duration::from_secs(secs));
}

/// One attested, signed chat completion. Returns (answer text, public proof).
/// The proof holds no prompt or answer text, only hashes and the model.
pub fn chat(key: &str, model: &str, messages: &Value, max_tokens: u64) -> Result<(String, Value), String> {
    let (nonce, signers) = attest(model)?;
    let req = serde_json::to_vec(&json!({"model": model, "messages": messages, "max_tokens": max_tokens, "stream": false})).unwrap();
    let auth = format!("Bearer {key}");
    let headers = [("Content-Type", "application/json".to_string()), ("Authorization", auth.clone()), ("x-no-aliasing", "true".to_string()), ("Accept-Encoding", "identity".to_string())];
    let (status, resp) = http("POST", &format!("{BASE}/chat/completions"), &headers, Some(req.clone()))?;
    if status != 200 {
        return Err(format!("{model} answered HTTP {status}"));
    }
    let out: Value = serde_json::from_slice(&resp).map_err(|_| "model answer is not JSON")?;
    let id = out["id"].as_str().ok_or("model answer has no id")?.to_string();
    let text = out["choices"][0]["message"]["content"].as_str().unwrap_or("").trim().to_string();
    if text.is_empty() {
        let why = out["choices"][0]["finish_reason"].as_str().unwrap_or("unknown");
        return Err(format!("{model} returned an empty answer (finish_reason {why})"));
    }
    let expected = format!("{model}:{}:{}", sha_hex(&req), sha_hex(&resp));
    let mut signed = false;
    for i in 0..6 {
        if i > 0 {
            pause(2);
        }
        let (s, body) = http("GET", &format!("{BASE}/signature/{id}?signing_algo=ed25519"), &[("Authorization", auth.clone())], None)?;
        if s != 200 {
            continue;
        }
        if let Ok(sig) = serde_json::from_slice::<Value>(&body) {
            if sig.get("error_code").is_none() {
                signed = verify_sig(&sig, &signers, &expected);
                break;
            }
        }
    }
    if !signed {
        return Err(format!("{model} response signature could not be verified, so the answer was discarded"));
    }
    Ok((text, json!({
        "model": model, "fresh_nonce": nonce, "attested_signers": signers.len(),
        "signature_valid": true, "request_sha256": sha_hex(&req), "response_sha256": sha_hex(&resp)
    })))
}

/// What a method may ask the runner for, from its manifest.
pub struct AiPolicy {
    pub allowed: Vec<String>,
    pub key: Option<String>,
    pub calls: Vec<Value>,
}

impl AiPolicy {
    pub fn from_manifest(manifest: &Value) -> Self {
        let allowed = manifest["ai"]["allowed"].as_array().map(|a| a.iter().filter_map(|m| m.as_str().map(String::from)).collect()).unwrap_or_default();
        AiPolicy { allowed, key: std::env::var("NEAR_AI_API_KEY").ok().filter(|k| !k.trim().is_empty()), calls: Vec::new() }
    }

    /// Handle one request from a method: `{"model", "messages", "max_tokens"?}`.
    /// Every outcome, refused or not, is recorded for the execution report.
    pub fn handle(&mut self, request: &[u8]) -> Result<String, String> {
        let req: Value = serde_json::from_slice(request).unwrap_or(Value::Null);
        let model = req["model"].as_str().unwrap_or("").to_string();
        let result = if req.is_null() {
            Err("AI request is not JSON".to_string())
        } else if model.is_empty() {
            Err("AI request names no model".to_string())
        } else if self.calls.len() >= MAX_CALLS {
            Err(format!("more than {MAX_CALLS} AI calls in one run"))
        } else if !self.allowed.contains(&model) {
            Err("model is not in this method's manifest".to_string())
        } else if let Some(key) = self.key.clone() {
            let max_tokens = req["max_tokens"].as_u64().unwrap_or(800).min(MAX_TOKENS);
            chat(&key, &model, &req["messages"], max_tokens)
        } else {
            Err("runner has no NEAR AI key".to_string())
        };
        match result {
            Ok((text, proof)) => {
                self.calls.push(json!({"ok": true, "proof": proof}));
                Ok(text)
            }
            Err(e) => {
                self.calls.push(json!({"ok": false, "model": model, "error": e}));
                Err(e)
            }
        }
    }
}

/// Private document classification. The endpoint has attestation but does not expose a response signature.
pub fn classify_private(key:&str,text:&str)->Result<(Value,Value),String>{
 let model="openai/privacy-filter";
 let (nonce,_)=attest(model)?;
 let request=serde_json::to_vec(&json!({"model":model,"input":text})).unwrap();
 let headers=[("Authorization",format!("Bearer {key}")),("Content-Type","application/json".to_string())];
 let (status,body)=http("POST",&format!("{BASE}/privacy/classify"),&headers,Some(request))?;
 if status!=200{return Err("private document classification failed".into())}
 let data:Value=serde_json::from_slice(&body).map_err(|_|"invalid classification response")?;
 let spans=data["data"][0]["spans"].as_array().ok_or("missing classification spans")?;
 let safe:Vec<Value>=spans.iter().map(|s|json!({"category":s["category"],"start":s["start"],"end":s["end"],"score":s["score"]})).collect();
 Ok((json!(safe),json!({"model":model,"fresh_nonce":nonce,"response_signature_verified":false,"note":"Classification endpoint has model attestation but no response signature."})))
}
