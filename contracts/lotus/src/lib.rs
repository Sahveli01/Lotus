#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token, Address, Env, Symbol, Vec,
};

// ─── Storage Keys ───────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Admin,            // Address — protokol yöneticisi
    UsdcToken,        // Address — USDC token kontratı
    BlendPool,        // Address — Blend lending pool
    TotalDeposits,    // i128 — toplam yatırılan USDC
    PrizePool,        // i128 — birikmiş yield (ödül havuzu)
    NextDraw,         // u64 — bir sonraki çekiliş timestamp
    DrawInterval,     // u64 — çekiliş aralığı (saniye)
    RoundNumber,      // u32 — kaçıncı round
    LastWinner,       // Address — son kazanan
    LastPrize,        // i128 — son ödül miktarı
    TotalWinners,     // u32 — toplam çekiliş sayısı
    Deposit(Address), // i128 — kullanıcının yatırdığı miktar
    Nonce,            // u64 — randomness için nonce
}

// ─── Events ─────────────────────────────────────────────────────────────────

const DEPOSIT_EVENT: Symbol = symbol_short!("deposit");
const WITHDRAW_EVENT: Symbol = symbol_short!("withdraw");
const DRAW_EVENT: Symbol = symbol_short!("draw");
const YIELD_EVENT: Symbol = symbol_short!("yield");

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct LotusVault;

#[contractimpl]
impl LotusVault {

    // ── Initialize ──────────────────────────────────────────────────────────

    /// Kontratı başlatır. Sadece bir kez çağrılabilir.
    pub fn initialize(
        env: Env,
        admin: Address,
        usdc_token: Address,
        blend_pool: Address,
        draw_interval: u64,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::UsdcToken, &usdc_token);
        env.storage().instance().set(&DataKey::BlendPool, &blend_pool);
        env.storage().instance().set(&DataKey::DrawInterval, &draw_interval);
        env.storage().instance().set(&DataKey::TotalDeposits, &0i128);
        env.storage().instance().set(&DataKey::PrizePool, &0i128);
        env.storage().instance().set(&DataKey::RoundNumber, &1u32);
        env.storage().instance().set(&DataKey::TotalWinners, &0u32);
        env.storage().instance().set(&DataKey::Nonce, &0u64);

        let next_draw = env.ledger().timestamp() + draw_interval;
        env.storage().instance().set(&DataKey::NextDraw, &next_draw);
    }

    // ── Deposit ─────────────────────────────────────────────────────────────

    /// Kullanıcı USDC yatırır. Anapara güvende kalır, yield prize pool'a gider.
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();

        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        let current_deposit: i128 = env.storage()
            .persistent()
            .get(&DataKey::Deposit(user.clone()))
            .unwrap_or(0);

        let new_deposit = current_deposit + amount;
        env.storage().persistent().set(&DataKey::Deposit(user.clone()), &new_deposit);

        let total: i128 = env.storage().instance().get(&DataKey::TotalDeposits).unwrap();
        env.storage().instance().set(&DataKey::TotalDeposits, &(total + amount));

        env.storage().persistent().extend_ttl(
            &DataKey::Deposit(user.clone()),
            17280,
            2073600,
        );

        env.events().publish(
            (DEPOSIT_EVENT, symbol_short!("usdc")),
            (user, amount),
        );
    }

    // ── Withdraw ────────────────────────────────────────────────────────────

    /// Kullanıcı anaparasını geri çeker. Yield prize pool'da kalır.
    pub fn withdraw(env: Env, user: Address, amount: i128) {
        user.require_auth();

        let current_deposit: i128 = env.storage()
            .persistent()
            .get(&DataKey::Deposit(user.clone()))
            .unwrap_or(0);

        if amount > current_deposit {
            panic!("insufficient balance");
        }
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();

        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        let new_deposit = current_deposit - amount;
        if new_deposit == 0 {
            env.storage().persistent().remove(&DataKey::Deposit(user.clone()));
        } else {
            env.storage().persistent().set(&DataKey::Deposit(user.clone()), &new_deposit);
        }

        let total: i128 = env.storage().instance().get(&DataKey::TotalDeposits).unwrap();
        env.storage().instance().set(&DataKey::TotalDeposits, &(total - amount));

        env.events().publish(
            (WITHDRAW_EVENT, symbol_short!("usdc")),
            (user, amount),
        );
    }

    // ── Accrue Yield ────────────────────────────────────────────────────────

    /// Admin yield'i bildirir (Blend'den gelen faiz).
    /// MVP: Admin manuel çağırır. V2'de otomatik Blend entegrasyonu.
    pub fn accrue_yield(env: Env, admin: Address, yield_amount: i128) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("unauthorized");
        }

        if yield_amount <= 0 {
            panic!("yield must be positive");
        }

        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&admin, &env.current_contract_address(), &yield_amount);

        let current_prize: i128 = env.storage().instance().get(&DataKey::PrizePool).unwrap();
        env.storage().instance().set(&DataKey::PrizePool, &(current_prize + yield_amount));

        env.events().publish(
            (YIELD_EVENT, symbol_short!("accrued")),
            yield_amount,
        );
    }

    // ── Execute Draw ────────────────────────────────────────────────────────

    /// Çekilişi gerçekleştirir. Herkes çağırabilir ama zamanı geldiyse.
    /// Kazananı pseudo-random seçer (MVP). V2'de Stellar VRF kullanır.
    pub fn execute_draw(env: Env, participants: Vec<Address>) {
        let next_draw: u64 = env.storage().instance().get(&DataKey::NextDraw).unwrap();
        let now = env.ledger().timestamp();

        if now < next_draw {
            panic!("draw not ready yet");
        }

        let prize_amount: i128 = env.storage().instance().get(&DataKey::PrizePool).unwrap();

        if prize_amount == 0 {
            panic!("no prize to distribute");
        }

        if participants.is_empty() {
            panic!("no participants");
        }

        // Ağırlıklı seçim: her kullanıcının deposit miktarı kadar "bileti" var
        let mut total_tickets: i128 = 0;
        for participant in participants.iter() {
            let deposit: i128 = env.storage()
                .persistent()
                .get(&DataKey::Deposit(participant.clone()))
                .unwrap_or(0);
            total_tickets += deposit;
        }

        if total_tickets == 0 {
            panic!("no valid deposits");
        }

        // Pseudo-random seçim (ledger timestamp + nonce + sequence)
        let nonce: u64 = env.storage().instance().get(&DataKey::Nonce).unwrap();
        let new_nonce = nonce + 1;
        env.storage().instance().set(&DataKey::Nonce, &new_nonce);

        let ledger_seq = env.ledger().sequence() as u64;
        let random_seed = (env.ledger().timestamp() ^ (ledger_seq << 32) ^ new_nonce) as i128;
        let winning_ticket = random_seed.abs() % total_tickets;

        // Kazananı bul
        let mut cumulative: i128 = 0;
        let mut winner: Option<Address> = None;

        for participant in participants.iter() {
            let deposit: i128 = env.storage()
                .persistent()
                .get(&DataKey::Deposit(participant.clone()))
                .unwrap_or(0);
            cumulative += deposit;
            if winning_ticket < cumulative && winner.is_none() {
                winner = Some(participant.clone());
            }
        }

        let winner_address = winner.unwrap();

        // Ödülü kazanana gönder
        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&env.current_contract_address(), &winner_address, &prize_amount);

        // State güncelle
        env.storage().instance().set(&DataKey::PrizePool, &0i128);
        env.storage().instance().set(&DataKey::LastWinner, &winner_address);
        env.storage().instance().set(&DataKey::LastPrize, &prize_amount);

        let round: u32 = env.storage().instance().get(&DataKey::RoundNumber).unwrap();
        env.storage().instance().set(&DataKey::RoundNumber, &(round + 1));

        let total_winners: u32 = env.storage().instance().get(&DataKey::TotalWinners).unwrap();
        env.storage().instance().set(&DataKey::TotalWinners, &(total_winners + 1));

        let interval: u64 = env.storage().instance().get(&DataKey::DrawInterval).unwrap();
        env.storage().instance().set(&DataKey::NextDraw, &(now + interval));

        env.events().publish(
            (DRAW_EVENT, symbol_short!("winner")),
            (winner_address, prize_amount, round),
        );
    }

    // ── View Functions ───────────────────────────────────────────────────────

    pub fn get_deposit(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Deposit(user))
            .unwrap_or(0)
    }

    pub fn get_prize_pool(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::PrizePool).unwrap_or(0)
    }

    pub fn get_total_deposits(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalDeposits).unwrap_or(0)
    }

    pub fn get_next_draw(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::NextDraw).unwrap_or(0)
    }

    pub fn get_last_winner(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::LastWinner)
    }

    pub fn get_last_prize(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::LastPrize).unwrap_or(0)
    }

    pub fn get_round_number(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::RoundNumber).unwrap_or(1)
    }

    pub fn get_total_winners(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TotalWinners).unwrap_or(0)
    }

    /// Kullanıcının kazanma şansını yüzde olarak döner (7 decimal)
    pub fn get_win_chance(env: Env, user: Address) -> i128 {
        let total: i128 = env.storage().instance().get(&DataKey::TotalDeposits).unwrap_or(0);
        if total == 0 {
            return 0;
        }
        let deposit: i128 = env.storage()
            .persistent()
            .get(&DataKey::Deposit(user))
            .unwrap_or(0);
        (deposit * 100 * 10_000_000) / total
    }

    pub fn get_config(env: Env) -> (Address, Address, u64) {
        let usdc: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let blend: Address = env.storage().instance().get(&DataKey::BlendPool).unwrap();
        let interval: u64 = env.storage().instance().get(&DataKey::DrawInterval).unwrap();
        (usdc, blend, interval)
    }

    // ── Admin Functions ──────────────────────────────────────────────────────

    pub fn set_admin(env: Env, current_admin: Address, new_admin: Address) {
        current_admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if current_admin != stored_admin {
            panic!("unauthorized");
        }
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    pub fn set_draw_interval(env: Env, admin: Address, interval: u64) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("unauthorized");
        }
        env.storage().instance().set(&DataKey::DrawInterval, &interval);
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger, LedgerInfo},
        token::StellarAssetClient,
        Env, Address, Vec,
    };

    fn create_test_token(env: &Env, admin: &Address) -> Address {
        env.register_stellar_asset_contract_v2(admin.clone()).address()
    }

    fn setup_env() -> (Env, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        let usdc = create_test_token(&env, &admin);

        let usdc_asset_client = StellarAssetClient::new(&env, &usdc);
        usdc_asset_client.mint(&admin, &1_000_000_0000000i128);
        usdc_asset_client.mint(&user1, &10_000_0000000i128);
        usdc_asset_client.mint(&user2, &5_000_0000000i128);

        (env, admin, user1, user2, usdc)
    }

    fn deploy_contract(env: &Env) -> Address {
        env.register(LotusVault, ())
    }

    #[test]
    fn test_initialize() {
        let (env, admin, _user1, _user2, usdc) = setup_env();
        let contract_addr = deploy_contract(&env);
        let client = LotusVaultClient::new(&env, &contract_addr);
        let blend_pool = Address::generate(&env);

        client.initialize(&admin, &usdc, &blend_pool, &60u64);

        assert_eq!(client.get_total_deposits(), 0);
        assert_eq!(client.get_prize_pool(), 0);
        assert_eq!(client.get_round_number(), 1);
    }

    #[test]
    fn test_deposit_and_withdraw() {
        let (env, admin, user1, _user2, usdc) = setup_env();
        let contract_addr = deploy_contract(&env);
        let client = LotusVaultClient::new(&env, &contract_addr);
        let blend_pool = Address::generate(&env);

        client.initialize(&admin, &usdc, &blend_pool, &60u64);

        let deposit_amount = 1_000_0000000i128;
        client.deposit(&user1, &deposit_amount);

        assert_eq!(client.get_deposit(&user1), deposit_amount);
        assert_eq!(client.get_total_deposits(), deposit_amount);

        client.withdraw(&user1, &deposit_amount);

        assert_eq!(client.get_deposit(&user1), 0);
        assert_eq!(client.get_total_deposits(), 0);
    }

    #[test]
    fn test_draw() {
        let (env, admin, user1, user2, usdc) = setup_env();
        let contract_addr = deploy_contract(&env);
        let client = LotusVaultClient::new(&env, &contract_addr);
        let blend_pool = Address::generate(&env);

        client.initialize(&admin, &usdc, &blend_pool, &60u64);

        client.deposit(&user1, &1_000_0000000i128);
        client.deposit(&user2, &500_0000000i128);

        client.accrue_yield(&admin, &100_0000000i128);

        assert_eq!(client.get_prize_pool(), 100_0000000i128);

        env.ledger().set(LedgerInfo {
            timestamp: 120,
            protocol_version: 22,
            sequence_number: 10,
            network_id: Default::default(),
            base_reserve: 10,
            min_temp_entry_ttl: 16,
            min_persistent_entry_ttl: 2073600,
            max_entry_ttl: 9999999,
        });

        let mut participants = Vec::new(&env);
        participants.push_back(user1.clone());
        participants.push_back(user2.clone());

        client.execute_draw(&participants);

        assert_eq!(client.get_prize_pool(), 0);
        assert_eq!(client.get_round_number(), 2);
        assert_eq!(client.get_total_winners(), 1);

        let winner = client.get_last_winner();
        assert!(winner.is_some());
    }

    #[test]
    fn test_win_chance() {
        let (env, admin, user1, user2, usdc) = setup_env();
        let contract_addr = deploy_contract(&env);
        let client = LotusVaultClient::new(&env, &contract_addr);
        let blend_pool = Address::generate(&env);

        client.initialize(&admin, &usdc, &blend_pool, &60u64);

        client.deposit(&user1, &1_000_0000000i128);
        client.deposit(&user2, &500_0000000i128);

        let chance1 = client.get_win_chance(&user1);
        let chance2 = client.get_win_chance(&user2);

        assert!(chance1 > chance2);
        assert!(chance1 + chance2 <= 100 * 10_000_000);
    }
}
