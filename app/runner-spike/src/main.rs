//! Platform runner: loads seller wasm, links only the functions it allows,
//! meters fuel, and returns the guest output. Spike only.
use std::io::Read;

/// OutLayer project manifest: an empty network list means this runner may
/// reach no host at all. The worker reads this custom section and enforces it.
#[cfg(target_family = "wasm")]
#[used]
#[unsafe(link_section = "outlayer.manifest")]
static OUTLAYER_MANIFEST: [u8; 31] = *br#"{"capabilities":{"network":[]}}"#;

/// Seller method for the spike. Later this comes encrypted from a secret.
static GUEST: &[u8] = include_bytes!("../../guest-spike/target/wasm32-unknown-unknown/release/guest_spike.wasm");
use wasmi::{Config, Engine, Linker, Module, Store};

fn run_guest(wasm: &[u8], input: &[u8]) -> Result<String, String> {
    let mut cfg = Config::default();
    cfg.consume_fuel(true);
    let engine = Engine::new(&cfg);
    let module = Module::new(&engine, wasm).map_err(|e| format!("bad module: {e}"))?;
    for imp in module.imports() {
        // allowlist of host functions; nothing here touches the network
        return Err(format!("refused import {}::{}", imp.module(), imp.name()));
    }
    let mut store = Store::new(&engine, ());
    store.set_fuel(2_000_000_000).unwrap();
    let linker = <Linker<()>>::new(&engine);
    let inst = linker.instantiate_and_start(&mut store, &module).map_err(|e| e.to_string())?;
    let mem = inst.get_memory(&store, "memory").ok_or("no memory")?;
    let alloc = inst.get_typed_func::<u32, u32>(&store, "alloc").map_err(|e| e.to_string())?;
    let run = inst.get_typed_func::<(u32, u32), u64>(&store, "run").map_err(|e| e.to_string())?;
    let p = alloc.call(&mut store, input.len() as u32).map_err(|e| e.to_string())?;
    mem.write(&mut store, p as usize, input).map_err(|e| e.to_string())?;
    let r = run.call(&mut store, (p, input.len() as u32)).map_err(|e| e.to_string())?;
    let (op, ol) = ((r >> 32) as usize, (r & 0xffff_ffff) as usize);
    let mut out = vec![0u8; ol];
    mem.read(&store, op, &mut out).map_err(|e| e.to_string())?;
    let used = 2_000_000_000 - store.get_fuel().unwrap();
    Ok(format!("{} (fuel used {used})", String::from_utf8_lossy(&out)))
}

fn main() {
    let wasm = match std::env::args().nth(1) {
        Some(path) => std::fs::read(path).unwrap(),
        None => GUEST.to_vec(),
    };
    let mut input = Vec::new();
    std::io::stdin().read_to_end(&mut input).ok();
    if input.starts_with(b"{\"cmd\":\"ping\"") {
        println!("{{\"ok\":true,\"pong\":true,\"guest_bytes\":{}}}", wasm.len());
        return;
    }
    match run_guest(&wasm, &input) {
        Ok(s) => println!("OK {s}"),
        Err(e) => println!("REFUSED {e}"),
    }
}
