//! Smallest OutLayer program that only carries the no-network manifest.
#[cfg(target_family = "wasm")]
#[used]
#[unsafe(link_section = "outlayer.manifest")]
static OUTLAYER_MANIFEST: [u8; 31] = *br#"{"capabilities":{"network":[]}}"#;

fn main() {
    println!("{{\"ok\":true,\"pong\":true}}");
}
