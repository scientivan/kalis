//! Kalis bounty pools: escrowed crowdfunding for a Sputnik DAO bounty.
//!
//! People pledge NEAR to a pool. The NEAR is locked in this contract. Nobody (not Kalis, not the pool
//! creator, not the contract owner) can move it, except by two rules:
//!
//! * release(pool_id, proposal_id): anyone may call it. The contract reads the proposal from the DAO it
//!   was initialised with (cross-contract `get_proposal`). If that proposal is a BountyDone for the
//!   pool's bounty, was submitted after the pool was created, and is Approved, the whole pool goes to
//!   the proposal's `receiver_id` (the contributor the DAO paid).
//! * refund(pool_id): each pledger takes back their own pledge once the deadline has passed without a
//!   release, or after `mark_rejected` proved that a BountyDone proposal for the bounty was rejected.
//!
//! There is no owner withdraw, no admin key path and no fee.
use near_sdk::json_types::{U128, U64};
use near_sdk::serde_json::Value;
use near_sdk::store::{IterableMap, LookupMap};
use near_sdk::{env, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise, PromiseError};

const MIN_PLEDGE: u128 = 10_000_000_000_000_000_000_000; // 0.01 NEAR, covers the pledge's storage
const MAX_PLEDGERS: usize = 100;
const MAX_DEADLINE_NS: u64 = 90 * 86_400 * 1_000_000_000;
const GAS_VIEW: Gas = Gas::from_tgas(15);
const GAS_CB: Gas = Gas::from_tgas(15);

#[near(serializers = [borsh])]
#[derive(BorshStorageKey)]
enum Key { Pools, Pledges }

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub enum PoolState { Open, Checking, Released, Refunding }

#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct Pool {
    pub id: u64,
    pub bounty_id: u64,
    pub title: String,
    pub creator: AccountId,
    pub created_ns: U64,
    pub deadline_ns: U64,
    pub state: PoolState,
    pub total: U128,
    pub pledgers: Vec<AccountId>,
    pub released_to: Option<AccountId>,
    pub proposal_id: Option<u64>,
    pub refund_reason: Option<String>,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    dao: AccountId,
    next_id: u64,
    pools: IterableMap<u64, Pool>,
    pledges: LookupMap<String, u128>,
}

fn pkey(pool: u64, a: &AccountId) -> String { format!("{pool}:{a}") }

/// Read a Sputnik ProposalOutput. Returns (status, bounty_id, receiver_id, submission_time).
pub fn read_bounty_done(v: &Value) -> Result<(String, u64, AccountId, u64), String> {
    let done = v.get("kind").and_then(|k| k.get("BountyDone")).ok_or("proposal is not a BountyDone")?;
    let bounty = done.get("bounty_id").and_then(|b| b.as_u64().or_else(|| b.as_str().and_then(|s| s.parse().ok()))).ok_or("no bounty_id")?;
    let recv: AccountId = done.get("receiver_id").and_then(|r| r.as_str()).ok_or("no receiver_id")?.parse().map_err(|_| "bad receiver_id")?;
    let status = v.get("status").and_then(|s| s.as_str()).ok_or("no status")?.to_string();
    let sub = v.get("submission_time").and_then(|s| s.as_str().and_then(|x| x.parse().ok()).or_else(|| s.as_u64())).ok_or("no submission_time")?;
    Ok((status, bounty, recv, sub))
}

#[near]
impl Contract {
    #[init]
    pub fn new(dao: AccountId) -> Self {
        Self { dao, next_id: 0, pools: IterableMap::new(Key::Pools), pledges: LookupMap::new(Key::Pledges) }
    }

    pub fn create_pool(&mut self, bounty_id: u64, title: String, deadline_ns: U64) -> u64 {
        let now = env::block_timestamp();
        require!(deadline_ns.0 > now && deadline_ns.0 <= now + MAX_DEADLINE_NS, "deadline must be within the next 90 days");
        require!(title.len() <= 200, "title too long");
        let id = self.next_id;
        self.next_id += 1;
        self.pools.insert(id, Pool {
            id, bounty_id, title, creator: env::predecessor_account_id(), created_ns: U64(now), deadline_ns,
            state: PoolState::Open, total: U128(0), pledgers: vec![], released_to: None, proposal_id: None, refund_reason: None,
        });
        id
    }

    #[payable]
    pub fn pledge(&mut self, pool_id: u64) -> U128 {
        let amount = env::attached_deposit().as_yoctonear();
        require!(amount >= MIN_PLEDGE, "a pledge is at least 0.01 NEAR");
        let who = env::predecessor_account_id();
        let pool = self.pools.get_mut(&pool_id).expect("no such pool");
        require!(pool.state == PoolState::Open, "pool is not open");
        require!(env::block_timestamp() < pool.deadline_ns.0, "deadline has passed");
        let k = pkey(pool_id, &who);
        let prev = self.pledges.get(&k).copied().unwrap_or(0);
        if prev == 0 {
            require!(pool.pledgers.len() < MAX_PLEDGERS, "pool is full");
            pool.pledgers.push(who.clone());
        }
        pool.total = U128(pool.total.0 + amount);
        self.pledges.insert(k, prev + amount);
        U128(prev + amount)
    }

    /// Anyone may call. Pays the whole pool to the contributor if the DAO approved their BountyDone.
    pub fn release(&mut self, pool_id: u64, proposal_id: u64) -> Promise {
        let pool = self.pools.get_mut(&pool_id).expect("no such pool");
        require!(pool.state == PoolState::Open, "pool is not open");
        require!(pool.total.0 > 0, "pool is empty");
        pool.state = PoolState::Checking;
        Promise::new(self.dao.clone())
            .function_call("get_proposal", format!("{{\"id\":{proposal_id}}}").into_bytes(), NearToken::from_yoctonear(0), GAS_VIEW)
            .then(Self::ext(env::current_account_id()).with_static_gas(GAS_CB).on_release(pool_id, proposal_id))
    }

    #[private]
    pub fn on_release(&mut self, pool_id: u64, proposal_id: u64, #[callback_result] r: Result<Value, PromiseError>) -> bool {
        let pool = self.pools.get_mut(&pool_id).expect("no such pool");
        let ok = r.map_err(|_| "dao call failed".to_string()).and_then(|v| read_bounty_done(&v)).and_then(|(status, b, recv, sub)| {
            if b != pool.bounty_id { return Err("proposal is for another bounty".into()); }
            if sub < pool.created_ns.0 { return Err("proposal predates the pool".into()); }
            if status != "Approved" { return Err(format!("proposal status is {status}, not Approved")); }
            Ok(recv)
        });
        match ok {
            Ok(recv) => {
                pool.state = PoolState::Released;
                pool.released_to = Some(recv.clone());
                pool.proposal_id = Some(proposal_id);
                let amt = pool.total.0;
                env::log_str(&format!("released {amt} to {recv} for pool {pool_id}"));
                let _ = Promise::new(recv).transfer(NearToken::from_yoctonear(amt));
                true
            }
            Err(e) => {
                pool.state = PoolState::Open;
                env::log_str(&format!("release refused: {e}"));
                false
            }
        }
    }

    /// Anyone may call. Opens refunds early if a BountyDone for this bounty was rejected by the DAO.
    pub fn mark_rejected(&mut self, pool_id: u64, proposal_id: u64) -> Promise {
        let pool = self.pools.get_mut(&pool_id).expect("no such pool");
        require!(pool.state == PoolState::Open, "pool is not open");
        pool.state = PoolState::Checking;
        Promise::new(self.dao.clone())
            .function_call("get_proposal", format!("{{\"id\":{proposal_id}}}").into_bytes(), NearToken::from_yoctonear(0), GAS_VIEW)
            .then(Self::ext(env::current_account_id()).with_static_gas(GAS_CB).on_rejected(pool_id, proposal_id))
    }

    #[private]
    pub fn on_rejected(&mut self, pool_id: u64, proposal_id: u64, #[callback_result] r: Result<Value, PromiseError>) -> bool {
        let pool = self.pools.get_mut(&pool_id).expect("no such pool");
        let ok = r.map_err(|_| "dao call failed".to_string()).and_then(|v| read_bounty_done(&v)).map(|(s, b, _, sub)| {
            b == pool.bounty_id && sub >= pool.created_ns.0 && matches!(s.as_str(), "Rejected" | "Removed" | "Expired")
        });
        if ok == Ok(true) {
            pool.state = PoolState::Refunding;
            pool.proposal_id = Some(proposal_id);
            pool.refund_reason = Some("work_rejected".into());
            true
        } else {
            pool.state = PoolState::Open;
            false
        }
    }

    /// The caller takes back their own pledge after the deadline (without a release) or after a rejection.
    pub fn refund(&mut self, pool_id: u64) -> U128 {
        let who = env::predecessor_account_id();
        let pool = self.pools.get_mut(&pool_id).expect("no such pool");
        if pool.state == PoolState::Open && env::block_timestamp() >= pool.deadline_ns.0 {
            pool.state = PoolState::Refunding;
            pool.refund_reason = Some("deadline_passed".into());
        }
        require!(pool.state == PoolState::Refunding, "refunds open only after the deadline or a rejected BountyDone");
        let amt = self.pledges.remove(&pkey(pool_id, &who)).expect("you have no pledge in this pool");
        pool.total = U128(pool.total.0 - amt);
        pool.pledgers.retain(|a| a != &who);
        let _ = Promise::new(who).transfer(NearToken::from_yoctonear(amt));
        U128(amt)
    }

    pub fn get_dao(&self) -> AccountId { self.dao.clone() }
    pub fn get_pool(&self, pool_id: u64) -> Option<Pool> { self.pools.get(&pool_id).cloned() }
    pub fn get_pools(&self, from_index: Option<u64>, limit: Option<u64>) -> Vec<Pool> {
        self.pools.values().skip(from_index.unwrap_or(0) as usize).take(limit.unwrap_or(50) as usize).cloned().collect()
    }
    pub fn get_pledge(&self, pool_id: u64, account_id: AccountId) -> U128 { U128(self.pledges.get(&pkey(pool_id, &account_id)).copied().unwrap_or(0)) }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::serde_json::json;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    const N: u128 = 1_000_000_000_000_000_000_000_000;
    fn a(s: &str) -> AccountId { s.parse().unwrap() }
    fn ctx(who: &str, deposit: u128, ts: u64) {
        testing_env!(VMContextBuilder::new().current_account_id(a("pools.testnet")).predecessor_account_id(a(who))
            .attached_deposit(NearToken::from_yoctonear(deposit)).block_timestamp(ts).build());
    }
    fn setup() -> Contract {
        ctx("creator.testnet", 0, 1_000);
        let mut c = Contract::new(a("dao.testnet"));
        c.create_pool(1, "fix fuel".into(), U64(1_000_000));
        ctx("alice.testnet", N, 2_000); c.pledge(0);
        ctx("bob.testnet", N / 2, 3_000); c.pledge(0);
        c
    }
    fn prop(status: &str, bounty: u64, sub: &str) -> Value {
        json!({"id": 7, "status": status, "submission_time": sub, "kind": {"BountyDone": {"bounty_id": bounty, "receiver_id": "dev.testnet"}}})
    }

    #[test]
    fn pledges_are_locked_and_summed() {
        let c = setup();
        let p = c.get_pool(0).unwrap();
        assert_eq!(p.total.0, N + N / 2);
        assert_eq!(p.pledgers.len(), 2);
        assert_eq!(c.get_pledge(0, a("alice.testnet")).0, N);
    }

    #[test]
    #[should_panic(expected = "refunds open only")]
    fn no_refund_before_deadline() {
        let mut c = setup();
        ctx("alice.testnet", 0, 5_000);
        c.refund(0);
    }

    #[test]
    fn refund_after_deadline() {
        let mut c = setup();
        ctx("alice.testnet", 0, 2_000_000);
        assert_eq!(c.refund(0).0, N);
        let p = c.get_pool(0).unwrap();
        assert_eq!(p.state, PoolState::Refunding);
        assert_eq!(p.total.0, N / 2);
        assert_eq!(c.get_pledge(0, a("alice.testnet")).0, 0);
    }

    #[test]
    #[should_panic(expected = "deadline has passed")]
    fn no_pledge_after_deadline() {
        let mut c = setup();
        ctx("carol.testnet", N, 2_000_000);
        c.pledge(0);
    }

    #[test]
    fn release_pays_on_approved() {
        let mut c = setup();
        ctx("anyone.testnet", 0, 5_000);
        let _ = c.release(0, 7);
        assert_eq!(c.get_pool(0).unwrap().state, PoolState::Checking);
        ctx("pools.testnet", 0, 5_000);
        assert!(c.on_release(0, 7, Ok(prop("Approved", 1, "4000"))));
        let p = c.get_pool(0).unwrap();
        assert_eq!(p.state, PoolState::Released);
        assert_eq!(p.released_to, Some(a("dev.testnet")));
    }

    #[test]
    fn release_refused_when_not_approved_or_wrong() {
        let mut c = setup();
        for v in [prop("InProgress", 1, "4000"), prop("Approved", 2, "4000"), prop("Approved", 1, "500")] {
            ctx("anyone.testnet", 0, 5_000);
            let _ = c.release(0, 7);
            ctx("pools.testnet", 0, 5_000);
            assert!(!c.on_release(0, 7, Ok(v)));
            assert_eq!(c.get_pool(0).unwrap().state, PoolState::Open);
        }
        ctx("anyone.testnet", 0, 5_000);
        let _ = c.release(0, 7);
        ctx("pools.testnet", 0, 5_000);
        assert!(!c.on_release(0, 7, Err(PromiseError::Failed)));
    }

    #[test]
    #[should_panic(expected = "pool is not open")]
    fn no_refund_race_while_checking() {
        let mut c = setup();
        ctx("anyone.testnet", 0, 5_000);
        let _ = c.release(0, 7);
        let _ = c.release(0, 7);
    }

    #[test]
    fn rejection_opens_refunds() {
        let mut c = setup();
        ctx("anyone.testnet", 0, 5_000);
        let _ = c.mark_rejected(0, 7);
        ctx("pools.testnet", 0, 5_000);
        assert!(c.on_rejected(0, 7, Ok(prop("Rejected", 1, "4000"))));
        ctx("bob.testnet", 0, 6_000);
        assert_eq!(c.refund(0).0, N / 2);
    }
    // #[private] on on_release/on_rejected is enforced by the wasm entry point, not in native unit tests.
}
