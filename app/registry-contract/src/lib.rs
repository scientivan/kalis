//! Method registry (demo flow step 1).
//!
//! A seller registers a method and publishes versions. Each version records
//! three hashes so a buyer can check, before sending data, that what runs is
//! what was offered:
//! - `code_hash`: SHA-256 of the seller's method WASM (the guest the runner loads)
//! - `manifest_hash`: SHA-256 of the method manifest (models, connectors, outbound, ...)
//! - `runner_hash`: SHA-256 of the platform runner WASM that OutLayer attests
//!
//! The method code and the buyer data never touch this contract.
//! Versions are append-only. A version can point to a parent version and
//! list contributors, which steps 4–5 (bounty and lineage) build on.

use near_sdk::store::{IterableMap, Vector};
use near_sdk::{env, near, require, AccountId, NearToken, PanicOnDefault, Promise};

const MAX_TITLE: usize = 120;
const MAX_NOTE: usize = 500;
const MAX_CONTRIBUTORS: usize = 10;

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
    pub parent: Option<u32>,
    pub contributors: Vec<AccountId>,
    pub note: String,
    pub published_by: AccountId,
    pub published_at_ns: u64,
}

#[near(serializers = [json])]
pub struct MethodView {
    pub method_id: String,
    pub owner: AccountId,
    pub title: String,
    pub created_at_ns: u64,
    pub version_count: u32,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Registry {
    methods: IterableMap<String, Method>,
    versions: IterableMap<String, Vector<Version>>,
}

fn valid_method_id(id: &str) -> bool {
    (3..=48).contains(&id.len())
        && id.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
        && !id.starts_with('-')
        && !id.ends_with('-')
}

fn valid_hash(h: &str) -> bool {
    h.len() == 64 && h.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn emit(event: &str, data: near_sdk::serde_json::Value) {
    env::log_str(&format!(
        "EVENT_JSON:{}",
        near_sdk::serde_json::json!({"standard": "method-registry", "version": "1.0.0", "event": event, "data": [data]})
    ));
}

/// Charge the caller for the storage their call added, refund the rest.
fn settle_storage(before: u64) {
    let used = env::storage_usage().saturating_sub(before);
    let cost = env::storage_byte_cost().saturating_mul(used as u128);
    let attached = env::attached_deposit();
    require!(attached >= cost, format!("attach at least {} yoctoNEAR for storage", cost.as_yoctonear()));
    let refund = attached.saturating_sub(cost);
    if refund > NearToken::from_yoctonear(0) {
        let _ = Promise::new(env::predecessor_account_id()).transfer(refund);
    }
}

#[near]
impl Registry {
    #[init]
    pub fn new() -> Self {
        Self { methods: IterableMap::new(b"m"), versions: IterableMap::new(b"v") }
    }

    /// Register a new method. The caller becomes its owner.
    #[payable]
    pub fn register_method(&mut self, method_id: String, title: String) {
        require!(valid_method_id(&method_id), "method_id: 3-48 chars of a-z, 0-9, '-'");
        require!(!title.trim().is_empty() && title.len() <= MAX_TITLE, "title: 1-120 chars");
        require!(self.methods.get(&method_id).is_none(), "method_id already registered");
        let before = env::storage_usage();
        let owner = env::predecessor_account_id();
        self.methods.insert(
            method_id.clone(),
            Method { owner: owner.clone(), title: title.clone(), created_at_ns: env::block_timestamp(), version_count: 0 },
        );
        let prefix = [b"x".as_slice(), env::sha256(method_id.as_bytes()).as_slice()].concat();
        self.versions.insert(method_id.clone(), Vector::new(prefix));
        self.methods.flush();
        self.versions.flush();
        emit("method_registered", near_sdk::serde_json::json!({"method_id": method_id, "owner": owner, "title": title}));
        settle_storage(before);
    }

    /// Publish a new version. Only the method owner may publish (steps 4–5
    /// will add DAO-approved contributor versions). Returns the version number.
    #[payable]
    pub fn publish_version(
        &mut self,
        method_id: String,
        code_hash: String,
        manifest_hash: String,
        runner_hash: String,
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
            number,
            code_hash,
            manifest_hash,
            runner_hash,
            parent,
            contributors,
            note,
            published_by: caller,
            published_at_ns: env::block_timestamp(),
        };
        emit("version_published", near_sdk::serde_json::json!({
            "method_id": method_id, "number": number, "code_hash": v.code_hash,
            "manifest_hash": v.manifest_hash, "runner_hash": v.runner_hash, "parent": v.parent,
            "contributors": v.contributors
        }));
        self.versions.get_mut(&method_id).expect("versions").push(v);
        method.version_count = number;
        self.methods.insert(method_id, method);
        self.methods.flush();
        self.versions.flush();
        settle_storage(before);
        number
    }

    pub fn get_method(&self, method_id: String) -> Option<MethodView> {
        self.methods.get(&method_id).map(|m| MethodView {
            method_id: method_id.clone(),
            owner: m.owner.clone(),
            title: m.title.clone(),
            created_at_ns: m.created_at_ns,
            version_count: m.version_count,
        })
    }

    pub fn list_methods(&self, from_index: Option<u32>, limit: Option<u32>) -> Vec<MethodView> {
        self.methods
            .iter()
            .skip(from_index.unwrap_or(0) as usize)
            .take(limit.unwrap_or(50).min(100) as usize)
            .map(|(id, m)| MethodView {
                method_id: id.clone(),
                owner: m.owner.clone(),
                title: m.title.clone(),
                created_at_ns: m.created_at_ns,
                version_count: m.version_count,
            })
            .collect()
    }

    /// Version by number (1-based). `None` number returns the latest.
    pub fn get_version(&self, method_id: String, number: Option<u32>) -> Option<Version> {
        let vs = self.versions.get(&method_id)?;
        let n = number.unwrap_or(vs.len());
        if n == 0 || n > vs.len() {
            return None;
        }
        vs.get(n - 1).cloned()
    }

    pub fn list_versions(&self, method_id: String) -> Vec<Version> {
        self.versions.get(&method_id).map(|vs| vs.iter().cloned().collect()).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    const H1: &str = "85ceaeadb5b4b7e2054d5aef076d0a872add64248406e9b67a8f52f833404064";
    const H2: &str = "cbf2dc310db7c2baaf29947b2de35eee0ea2c4dd473d0a5c622ce75cd9b36be6";

    fn ctx(who: usize) {
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(accounts(who))
            .attached_deposit(NearToken::from_millinear(100))
            .build());
    }

    #[test]
    fn register_and_publish() {
        ctx(0);
        let mut r = Registry::new();
        r.register_method("portfolio-rebalance".into(), "Rebalance under allocation and cash limits".into());
        let n1 = r.publish_version("portfolio-rebalance".into(), H1.into(), H2.into(), H1.into(), None, None, Some("first".into()));
        let n2 = r.publish_version("portfolio-rebalance".into(), H2.into(), H2.into(), H1.into(), Some(1), Some(vec![accounts(1)]), None);
        assert_eq!((n1, n2), (1, 2));
        let latest = r.get_version("portfolio-rebalance".into(), None).unwrap();
        assert_eq!(latest.parent, Some(1));
        assert_eq!(latest.contributors, vec![accounts(1)]);
        assert_eq!(r.get_method("portfolio-rebalance".into()).unwrap().version_count, 2);
        assert_eq!(r.list_versions("portfolio-rebalance".into()).len(), 2);
        assert_eq!(r.list_methods(None, None).len(), 1);
    }

    #[test]
    #[should_panic(expected = "only the method owner")]
    fn only_owner_publishes() {
        ctx(0);
        let mut r = Registry::new();
        r.register_method("tender-bid".into(), "Tender bid".into());
        ctx(1);
        r.publish_version("tender-bid".into(), H1.into(), H1.into(), H1.into(), None, None, None);
    }

    #[test]
    #[should_panic(expected = "64 lowercase hex")]
    fn rejects_bad_hash() {
        ctx(0);
        let mut r = Registry::new();
        r.register_method("tender-bid".into(), "Tender bid".into());
        r.publish_version("tender-bid".into(), "abc".into(), H1.into(), H1.into(), None, None, None);
    }

    #[test]
    #[should_panic(expected = "already registered")]
    fn rejects_duplicate_id() {
        ctx(0);
        let mut r = Registry::new();
        r.register_method("tender-bid".into(), "Tender bid".into());
        r.register_method("tender-bid".into(), "Again".into());
    }

    #[test]
    #[should_panic(expected = "parent must be")]
    fn rejects_missing_parent() {
        ctx(0);
        let mut r = Registry::new();
        r.register_method("tender-bid".into(), "Tender bid".into());
        r.publish_version("tender-bid".into(), H1.into(), H1.into(), H1.into(), Some(3), None, None);
    }
}
