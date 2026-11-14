//! Kalis market: method registry, per-run escrow and payout split.
//!
//! - Sellers register methods and publish append-only versions. A version
//!   records the seller method hash, manifest hash, runner hash, price per run
//!   and the share of each payment that goes to the shared DAO fund
//!   (at least 10%). The platform share is fixed at 10%; the seller gets the rest.
//! - A buyer pays for one run up front. The money is held here.
//! - The Kalis runner, inside an OutLayer TEE, signs a completion record with a
//!   key that exists only in the TEE. Anyone may submit it. If the signature is
//!   valid and the record matches this run (run id, buyer data hash, method and
//!   manifest hashes) the money is released or refunded:
//!   every stage succeeded -> split to seller, DAO and platform;
//!   any stage failed or a declared method step is missing -> refund to buyer.
//!   Release never depends on whether the method's answer is good.
//! - If no valid record arrives before the timeout, the buyer can take the
//!   money back.

use near_sdk::serde::Deserialize;
use near_sdk::store::{IterableMap, LookupMap, Vector};
use near_sdk::{env, near, require, AccountId, NearToken, PanicOnDefault, Promise};

const MAX_TITLE: usize = 120;
const MAX_NOTE: usize = 500;
const MAX_CONTRIBUTORS: usize = 10;
const PLATFORM_SHARE_PCT: u8 = 10;
const MIN_DAO_SHARE_PCT: u8 = 10;
const COMPLETION_PREFIX: &str = "kalis-completion:v1:";

#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct Method {
    pub owner: AccountId,
    pub title: String,
    pub created_at_ns: u64,
    pub version_count: u32,
}

#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct Version {
    pub number: u32,
    pub code_hash: String,
    pub manifest_hash: String,
    pub runner_hash: String,
    pub price: NearToken,
    pub dao_share_pct: u8,
    pub parent: Option<u32>,
    pub contributors: Vec<AccountId>,
    pub note: String,
    pub published_by: AccountId,
    pub published_at_ns: u64,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, PartialEq, Debug)]
pub enum RunStatus {
    Paid,
    Released,
    Refunded,
}

#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct Run {
    pub buyer: AccountId,
    pub method_id: String,
    pub version: u32,
    pub amount: NearToken,
    pub data_ct_sha256: String,
    pub paid_at_ns: u64,
    pub status: RunStatus,
    pub reason: String,
}

#[near(serializers = [json])]
pub struct MethodView {
    pub method_id: String,
    pub owner: AccountId,
    pub title: String,
    pub created_at_ns: u64,
    pub version_count: u32,
}

#[near(serializers = [json])]
pub struct ConfigView {
    pub owner: AccountId,
    pub platform: AccountId,
    pub dao: AccountId,
    pub runner_pubkey: String,
    pub platform_share_pct: u8,
    pub min_dao_share_pct: u8,
    pub timeout_ns: u64,
}

/// The completion record the runner signs. Extra fields are ignored.
#[derive(Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct Completion {
    run_id: String,
    all_ok: bool,
    data_ct_sha256: String,
    method_sha256: String,
    manifest_sha256: String,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Market {
    owner: AccountId,
    platform: AccountId,
    dao: AccountId,
    runner_pubkey: [u8; 32],
    timeout_ns: u64,
    methods: IterableMap<String, Method>,
    versions: IterableMap<String, Vector<Version>>,
    runs: LookupMap<String, Run>,
}

fn valid_id(id: &str, min: usize, max: usize) -> bool {
    (min..=max).contains(&id.len()) && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

fn valid_hash(h: &str) -> bool {
    h.len() == 64 && h.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn parse_pubkey(hex_key: &str) -> [u8; 32] {
    require!(hex_key.len() == 64 && valid_hash(hex_key), "runner_pubkey: 64 lowercase hex chars");
    let mut out = [0u8; 32];
    for i in 0..32 {
        out[i] = u8::from_str_radix(&hex_key[i * 2..i * 2 + 2], 16).unwrap();
    }
    out
}

fn to_hex(b: &[u8]) -> String {
    b.iter().map(|x| format!("{x:02x}")).collect()
}

fn emit(event: &str, data: near_sdk::serde_json::Value) {
    env::log_str(&format!(
        "EVENT_JSON:{}",
        near_sdk::serde_json::json!({"standard": "kalis-market", "version": "1.0.0", "event": event, "data": [data]})
    ));
}

fn storage_cost(before: u64) -> NearToken {
    env::storage_byte_cost().saturating_mul(env::storage_usage().saturating_sub(before) as u128)
}

fn refund_excess(attached: NearToken, needed: NearToken) {
    require!(attached >= needed, format!("attach at least {} yoctoNEAR", needed.as_yoctonear()));
    let rest = attached.saturating_sub(needed);
    if rest > NearToken::from_yoctonear(0) {
        let _ = Promise::new(env::predecessor_account_id()).transfer(rest);
    }
}

#[near]
impl Market {
    #[init]
    pub fn new(platform: AccountId, dao: AccountId, runner_pubkey: String, timeout_minutes: u64) -> Self {
        Self {
            owner: env::predecessor_account_id(),
            platform,
            dao,
            runner_pubkey: parse_pubkey(&runner_pubkey),
            timeout_ns: timeout_minutes * 60 * 1_000_000_000,
            methods: IterableMap::new(b"m"),
            versions: IterableMap::new(b"v"),
            runs: LookupMap::new(b"r"),
        }
    }

    /// Owner only. Rotates the runner key, for example after a runner project is replaced.
    pub fn set_runner_pubkey(&mut self, runner_pubkey: String) {
        require!(env::predecessor_account_id() == self.owner, "only the owner");
        self.runner_pubkey = parse_pubkey(&runner_pubkey);
        emit("runner_key_set", near_sdk::serde_json::json!({"runner_pubkey": runner_pubkey}));
    }

    // ----- registry -----

    #[payable]
    pub fn register_method(&mut self, method_id: String, title: String) {
        require!(valid_id(&method_id, 3, 48), "method_id: 3-48 chars of letters, digits, '-', '_'");
        require!(!title.trim().is_empty() && title.len() <= MAX_TITLE, "title: 1-120 chars");
        require!(self.methods.get(&method_id).is_none(), "method_id already registered");
        let before = env::storage_usage();
        let owner = env::predecessor_account_id();
        self.methods.insert(method_id.clone(), Method { owner: owner.clone(), title: title.clone(), created_at_ns: env::block_timestamp(), version_count: 0 });
        let prefix = [b"x".as_slice(), env::sha256(method_id.as_bytes()).as_slice()].concat();
        self.versions.insert(method_id.clone(), Vector::new(prefix));
        self.methods.flush();
        self.versions.flush();
        emit("method_registered", near_sdk::serde_json::json!({"method_id": method_id, "owner": owner, "title": title}));
        refund_excess(env::attached_deposit(), storage_cost(before));
    }

    /// Owner of the method only. Hands the method (and its future versions and seller payouts) to
    /// another account. Past versions keep their `published_by`.
    pub fn transfer_method_owner(&mut self, method_id: String, new_owner: AccountId) {
        let mut method = self.methods.get(&method_id).cloned().unwrap_or_else(|| env::panic_str("unknown method_id"));
        require!(env::predecessor_account_id() == method.owner, "only the method owner can transfer it");
        let old = method.owner.clone();
        method.owner = new_owner.clone();
        self.methods.insert(method_id.clone(), method);
        emit("method_transferred", near_sdk::serde_json::json!({"method_id": method_id, "from": old, "to": new_owner}));
    }

    /// Owner of the method only. `price` is in yoctoNEAR per run.
    #[payable]
    pub fn publish_version(
        &mut self,
        method_id: String,
        code_hash: String,
        manifest_hash: String,
        runner_hash: String,
        price: NearToken,
        dao_share_pct: u8,
        parent: Option<u32>,
        contributors: Option<Vec<AccountId>>,
        note: Option<String>,
    ) -> u32 {
        let caller = env::predecessor_account_id();
        let mut method = self.methods.get(&method_id).cloned().unwrap_or_else(|| env::panic_str("unknown method_id"));
        require!(method.owner == caller, "only the method owner can publish a version");
        for (name, h) in [("code_hash", &code_hash), ("manifest_hash", &manifest_hash), ("runner_hash", &runner_hash)] {
            require!(valid_hash(h), format!("{name}: 64 lowercase hex chars (SHA-256)"));
        }
        require!(dao_share_pct >= MIN_DAO_SHARE_PCT, "dao_share_pct must be at least 10");
        require!(dao_share_pct <= 100 - PLATFORM_SHARE_PCT, "dao_share_pct must be at most 90");
        require!(price > NearToken::from_yoctonear(0), "price must be above zero");
        if let Some(p) = parent {
            require!(p >= 1 && p <= method.version_count, "parent must be an existing version number");
        }
        let contributors = contributors.unwrap_or_default();
        require!(contributors.len() <= MAX_CONTRIBUTORS, "at most 10 contributors");
        let note = note.unwrap_or_default();
        require!(note.len() <= MAX_NOTE, "note: at most 500 chars");
        let before = env::storage_usage();
        let number = method.version_count + 1;
        let v = Version {
            number, code_hash, manifest_hash, runner_hash, price, dao_share_pct, parent, contributors, note,
            published_by: caller, published_at_ns: env::block_timestamp(),
        };
        emit("version_published", near_sdk::serde_json::json!({
            "method_id": method_id, "number": number, "code_hash": v.code_hash, "manifest_hash": v.manifest_hash,
            "runner_hash": v.runner_hash, "price": v.price, "dao_share_pct": v.dao_share_pct, "parent": v.parent, "contributors": v.contributors
        }));
        self.versions.get_mut(&method_id).expect("versions").push(v);
        method.version_count = number;
        self.methods.insert(method_id, method);
        self.methods.flush();
        self.versions.flush();
        refund_excess(env::attached_deposit(), storage_cost(before));
        number
    }

    // ----- escrow -----

    /// Pay for one run. Attach the version price plus a little for storage; the
    /// excess is returned. `data_ct_sha256` is the SHA-256 of the buyer's sealed
    /// data ciphertext, so the completion record must be for this buyer's data.
    #[payable]
    pub fn pay_for_run(&mut self, run_id: String, method_id: String, version: u32, data_ct_sha256: String) {
        require!(valid_id(&run_id, 1, 64), "run_id: 1-64 chars of letters, digits, '-', '_'");
        require!(valid_hash(&data_ct_sha256), "data_ct_sha256: 64 lowercase hex chars");
        require!(self.runs.get(&run_id).is_none(), "run_id already used");
        let v = self.version_or_panic(&method_id, version);
        let before = env::storage_usage();
        let buyer = env::predecessor_account_id();
        self.runs.insert(run_id.clone(), Run {
            buyer: buyer.clone(), method_id: method_id.clone(), version, amount: v.price,
            data_ct_sha256, paid_at_ns: env::block_timestamp(), status: RunStatus::Paid, reason: String::new(),
        });
        self.runs.flush();
        emit("run_paid", near_sdk::serde_json::json!({"run_id": run_id, "buyer": buyer, "method_id": method_id, "version": version, "amount": v.price}));
        refund_excess(env::attached_deposit(), v.price.saturating_add(storage_cost(before)));
    }

    /// Anyone may call. `completion` is the record text exactly as the runner
    /// returned it, `signature` its ed25519 signature in hex.
    pub fn settle(&mut self, run_id: String, completion: String, signature: String) -> RunStatus {
        let mut run = self.runs.get(&run_id).cloned().unwrap_or_else(|| env::panic_str("unknown run_id"));
        require!(run.status == RunStatus::Paid, "run already settled");
        require!(signature.len() == 128 && signature.bytes().all(|b| b.is_ascii_hexdigit()), "signature: 128 hex chars");
        let mut sig = [0u8; 64];
        for i in 0..64 {
            sig[i] = u8::from_str_radix(&signature[i * 2..i * 2 + 2], 16).unwrap();
        }
        let message = format!("{COMPLETION_PREFIX}{completion}");
        require!(env::ed25519_verify(&sig, message.as_bytes(), &self.runner_pubkey), "completion signature is not from the Kalis runner");
        let rec: Completion = near_sdk::serde_json::from_str(&completion).unwrap_or_else(|_| env::panic_str("completion is not valid JSON"));
        require!(rec.run_id == run_id, "completion is for another run");
        require!(rec.data_ct_sha256 == run.data_ct_sha256, "completion is for other buyer data");
        let v = self.version_or_panic(&run.method_id, run.version);
        require!(rec.method_sha256 == v.code_hash, "completion ran another method build");
        require!(rec.manifest_sha256 == v.manifest_hash, "completion used another manifest");

        let owner = self.methods.get(&run.method_id).expect("method").owner.clone();
        if rec.all_ok {
            let total = run.amount.as_yoctonear();
            let to_dao = total * v.dao_share_pct as u128 / 100;
            let to_platform = total * PLATFORM_SHARE_PCT as u128 / 100;
            let to_seller = total - to_dao - to_platform;
            let _ = Promise::new(owner.clone()).transfer(NearToken::from_yoctonear(to_seller));
            let _ = Promise::new(self.dao.clone()).transfer(NearToken::from_yoctonear(to_dao));
            let _ = Promise::new(self.platform.clone()).transfer(NearToken::from_yoctonear(to_platform));
            run.status = RunStatus::Released;
            run.reason = "every stage succeeded".into();
            emit("run_released", near_sdk::serde_json::json!({
                "run_id": run_id, "seller": owner, "to_seller": to_seller.to_string(), "dao": self.dao, "to_dao": to_dao.to_string(),
                "platform": self.platform, "to_platform": to_platform.to_string()
            }));
        } else {
            let _ = Promise::new(run.buyer.clone()).transfer(run.amount);
            run.status = RunStatus::Refunded;
            run.reason = "a stage failed or a declared method step was missing".into();
            emit("run_refunded", near_sdk::serde_json::json!({"run_id": run_id, "buyer": run.buyer, "amount": run.amount, "reason": run.reason}));
        }
        let status = run.status.clone();
        self.runs.insert(run_id, run);
        status
    }

    /// The buyer takes the money back when no valid completion arrived in time.
    pub fn refund_expired(&mut self, run_id: String) {
        let mut run = self.runs.get(&run_id).cloned().unwrap_or_else(|| env::panic_str("unknown run_id"));
        require!(run.status == RunStatus::Paid, "run already settled");
        require!(env::predecessor_account_id() == run.buyer, "only the buyer");
        require!(env::block_timestamp() >= run.paid_at_ns + self.timeout_ns, "the run has not timed out yet");
        let _ = Promise::new(run.buyer.clone()).transfer(run.amount);
        run.status = RunStatus::Refunded;
        run.reason = "no completion before the timeout".into();
        emit("run_refunded", near_sdk::serde_json::json!({"run_id": run_id, "buyer": run.buyer, "amount": run.amount, "reason": run.reason}));
        self.runs.insert(run_id, run);
    }

    // ----- views -----

    pub fn get_config(&self) -> ConfigView {
        ConfigView {
            owner: self.owner.clone(), platform: self.platform.clone(), dao: self.dao.clone(),
            runner_pubkey: to_hex(&self.runner_pubkey), platform_share_pct: PLATFORM_SHARE_PCT,
            min_dao_share_pct: MIN_DAO_SHARE_PCT, timeout_ns: self.timeout_ns,
        }
    }

    pub fn get_method(&self, method_id: String) -> Option<MethodView> {
        self.methods.get(&method_id).map(|m| MethodView {
            method_id: method_id.clone(), owner: m.owner.clone(), title: m.title.clone(), created_at_ns: m.created_at_ns, version_count: m.version_count,
        })
    }

    pub fn list_methods(&self, from_index: Option<u32>, limit: Option<u32>) -> Vec<MethodView> {
        self.methods.iter().skip(from_index.unwrap_or(0) as usize).take(limit.unwrap_or(50).min(100) as usize)
            .map(|(id, m)| MethodView { method_id: id.clone(), owner: m.owner.clone(), title: m.title.clone(), created_at_ns: m.created_at_ns, version_count: m.version_count })
            .collect()
    }

    /// Version by number (1-based). `None` returns the latest.
    pub fn get_version(&self, method_id: String, number: Option<u32>) -> Option<Version> {
        let vs = self.versions.get(&method_id)?;
        let n = number.unwrap_or(vs.len());
        if n == 0 || n > vs.len() { return None; }
        vs.get(n - 1).cloned()
    }

    pub fn list_versions(&self, method_id: String) -> Vec<Version> {
        self.versions.get(&method_id).map(|vs| vs.iter().cloned().collect()).unwrap_or_default()
    }

    pub fn get_run(&self, run_id: String) -> Option<Run> {
        self.runs.get(&run_id).cloned()
    }

    fn version_or_panic(&self, method_id: &str, number: u32) -> Version {
        let vs = self.versions.get(method_id).unwrap_or_else(|| env::panic_str("unknown method_id"));
        require!(number >= 1 && number <= vs.len(), "unknown version");
        vs.get(number - 1).cloned().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    const H1: &str = "61616ac60e6124124a3c94b62836ae4a165d2bb665ff0921c031d6f0f378fd85";
    const H2: &str = "e2cebb81fd2e1cf44eec8199e53a330aa48e16a88dd6000916e0411890b88a92";
    const D1: &str = "7f65b7fbd8b84704daa3075e38a7b321252cb4253a4629a9f76d76566fccb2db";

    fn ctx(who: usize, deposit_milli: u128, ts: u64) {
        testing_env!(VMContextBuilder::new().predecessor_account_id(accounts(who))
            .attached_deposit(NearToken::from_millinear(deposit_milli)).block_timestamp(ts).build());
    }
    fn key() -> SigningKey { SigningKey::from_bytes(&[9u8; 32]) }
    fn record(run_id: &str, ok: bool, data: &str) -> String {
        format!(r#"{{"all_ok":{ok},"data_ct_sha256":"{data}","manifest_sha256":"{H2}","method_sha256":"{H1}","run_id":"{run_id}","runner":"kalis-runner/0.4"}}"#)
    }
    fn sign(rec: &str) -> String { to_hex(&key().sign(format!("{COMPLETION_PREFIX}{rec}").as_bytes()).to_bytes()) }

    fn setup() -> Market {
        ctx(0, 0, 0);
        // accounts(0) owner and platform, accounts(1) seller, accounts(2) buyer, accounts(3) dao
        let mut m = Market::new(accounts(0), accounts(3), to_hex(&key().verifying_key().to_bytes()), 60);
        ctx(1, 100, 0);
        m.register_method("portfolio-rebalance".into(), "Rebalance".into());
        m.publish_version("portfolio-rebalance".into(), H1.into(), H2.into(), H1.into(), NearToken::from_millinear(50), 20, None, None, None);
        m
    }

    #[test]
    fn owner_can_transfer_method_and_new_owner_publishes() {
        let mut m = setup();
        ctx(1, 0, 0);
        m.transfer_method_owner("portfolio-rebalance".into(), accounts(4));
        assert_eq!(m.get_method("portfolio-rebalance".into()).unwrap().owner, accounts(4));
        ctx(4, 100, 0);
        m.publish_version("portfolio-rebalance".into(), H1.into(), H2.into(), H1.into(), NearToken::from_millinear(50), 20, Some(1), None, None);
    }

    #[test]
    #[should_panic(expected = "only the method owner can transfer it")]
    fn non_owner_cannot_transfer() {
        let mut m = setup();
        ctx(2, 0, 0);
        m.transfer_method_owner("portfolio-rebalance".into(), accounts(2));
    }

    #[test]
    fn release_on_success() {
        let mut m = setup();
        ctx(2, 100, 1);
        m.pay_for_run("r1".into(), "portfolio-rebalance".into(), 1, D1.into());
        ctx(4, 0, 2);
        let rec = record("r1", true, D1);
        assert_eq!(m.settle("r1".into(), rec.clone(), sign(&rec)), RunStatus::Released);
        assert_eq!(m.get_run("r1".into()).unwrap().status, RunStatus::Released);
    }

    #[test]
    fn refund_on_failed_stage() {
        let mut m = setup();
        ctx(2, 100, 1);
        m.pay_for_run("r2".into(), "portfolio-rebalance".into(), 1, D1.into());
        let rec = record("r2", false, D1);
        assert_eq!(m.settle("r2".into(), rec.clone(), sign(&rec)), RunStatus::Refunded);
    }

    #[test]
    #[should_panic(expected = "not from the Kalis runner")]
    fn rejects_forged_signature() {
        let mut m = setup();
        ctx(2, 100, 1);
        m.pay_for_run("r3".into(), "portfolio-rebalance".into(), 1, D1.into());
        let rec = record("r3", true, D1);
        let forged = to_hex(&SigningKey::from_bytes(&[1u8; 32]).sign(format!("{COMPLETION_PREFIX}{rec}").as_bytes()).to_bytes());
        m.settle("r3".into(), rec, forged);
    }

    #[test]
    #[should_panic(expected = "other buyer data")]
    fn rejects_other_data() {
        let mut m = setup();
        ctx(2, 100, 1);
        m.pay_for_run("r4".into(), "portfolio-rebalance".into(), 1, D1.into());
        let rec = record("r4", true, H1);
        m.settle("r4".into(), rec.clone(), sign(&rec));
    }

    #[test]
    #[should_panic(expected = "another run")]
    fn rejects_record_of_other_run() {
        let mut m = setup();
        ctx(2, 100, 1);
        m.pay_for_run("r5".into(), "portfolio-rebalance".into(), 1, D1.into());
        let rec = record("other", true, D1);
        m.settle("r5".into(), rec.clone(), sign(&rec));
    }

    #[test]
    #[should_panic(expected = "at least 10")]
    fn rejects_low_dao_share() {
        let mut m = setup();
        ctx(1, 100, 0);
        m.publish_version("portfolio-rebalance".into(), H1.into(), H2.into(), H1.into(), NearToken::from_millinear(50), 5, None, None, None);
    }

    #[test]
    #[should_panic(expected = "not timed out")]
    fn timeout_not_reached() {
        let mut m = setup();
        ctx(2, 100, 1);
        m.pay_for_run("r6".into(), "portfolio-rebalance".into(), 1, D1.into());
        ctx(2, 0, 2);
        m.refund_expired("r6".into());
    }

    #[test]
    fn refund_after_timeout() {
        let mut m = setup();
        ctx(2, 100, 1);
        m.pay_for_run("r7".into(), "portfolio-rebalance".into(), 1, D1.into());
        ctx(2, 0, 1 + 61 * 60 * 1_000_000_000);
        m.refund_expired("r7".into());
        assert_eq!(m.get_run("r7".into()).unwrap().status, RunStatus::Refunded);
    }

    #[test]
    #[should_panic(expected = "already settled")]
    fn no_double_settle() {
        let mut m = setup();
        ctx(2, 100, 1);
        m.pay_for_run("r8".into(), "portfolio-rebalance".into(), 1, D1.into());
        let rec = record("r8", true, D1);
        m.settle("r8".into(), rec.clone(), sign(&rec));
        m.settle("r8".into(), rec.clone(), sign(&rec));
    }
}
