//! Test method for runner v0.5: asks an AI model through the runner's only
//! import, `kalis.ai_chat`. Input `{"question", "model"}`. Used to prove that an
//! allowed model answers and that a model outside the manifest is refused.
use serde_json::{json, Value};

#[link(wasm_import_module = "kalis")]
extern "C" {
    fn ai_chat(req_ptr: *const u8, req_len: u32, out_ptr: *mut u8, out_cap: u32) -> i32;
}

#[no_mangle]
pub extern "C" fn alloc(len: u32) -> *mut u8 {
    let mut v = Vec::<u8>::with_capacity(len as usize);
    let p = v.as_mut_ptr();
    core::mem::forget(v);
    p
}

fn ask(model: &str, question: &str) -> Option<String> {
    let req = serde_json::to_vec(&json!({"model": model, "max_tokens": 200,
        "messages": [{"role": "user", "content": question}]})).unwrap();
    let mut out = vec![0u8; 8192];
    let n = unsafe { ai_chat(req.as_ptr(), req.len() as u32, out.as_mut_ptr(), out.len() as u32) };
    if n < 0 { return None; }
    out.truncate((n as usize).min(out.len()));
    Some(String::from_utf8_lossy(&out).to_string())
}

#[no_mangle]
pub extern "C" fn run(ptr: *const u8, len: u32) -> u64 {
    let input: Value = serde_json::from_slice(unsafe { core::slice::from_raw_parts(ptr, len as usize) }).unwrap_or(Value::Null);
    let model = input["model"].as_str().unwrap_or("deepseek-ai/DeepSeek-V4.1-Flash-1017");
    let question = input["question"].as_str().unwrap_or("Reply with the single word OK.");
    let answer = ask(model, question);
    let steps = vec![
        json!({"id": "ask_ai", "ok": answer.is_some(), "detail": if answer.is_some() { format!("{model} answered") } else { format!("runner refused or failed the call to {model}") }}),
    ];
    let out = serde_json::to_vec(&json!({"steps": steps, "result": {"answer": answer}})).unwrap();
    let (p, l) = (out.as_ptr() as u64, out.len() as u64);
    core::mem::forget(out);
    (p << 32) | l
}
