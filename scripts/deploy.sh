#!/usr/bin/env bash
# LOTUS Protocol — Soroban Deployment Script
# Usage: bash scripts/deploy.sh [testnet|mainnet]
set -euo pipefail

NETWORK="${1:-testnet}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

echo "==> Deploying LOTUS Protocol to $NETWORK"

# ── Pre-checks ────────────────────────────────────────────────────────────────
command -v stellar &>/dev/null || { echo "ERROR: stellar-cli not found. Install: cargo install --locked stellar-cli --features opt"; exit 1; }
command -v cargo  &>/dev/null  || { echo "ERROR: cargo not found."; exit 1; }
[[ -f "$ENV_FILE" ]] || { echo "ERROR: $ENV_FILE not found. Copy .env.example first."; exit 1; }
source "$ENV_FILE"
[[ -n "${ADMIN_SECRET:-}" ]] || { echo "ERROR: ADMIN_SECRET not set in $ENV_FILE"; exit 1; }

# ── Network Setup ─────────────────────────────────────────────────────────────
if [[ "$NETWORK" == "testnet" ]]; then
  stellar network add testnet \
    --rpc-url  https://soroban-testnet.stellar.org \
    --network-passphrase "Test SDF Network ; September 2015" 2>/dev/null || true
  echo "$ADMIN_SECRET" | stellar keys add admin --secret-key 2>/dev/null || true
  stellar keys fund admin --network testnet 2>/dev/null || echo "(fund skipped — may already be funded)"
fi

# ── Build ─────────────────────────────────────────────────────────────────────
echo "==> Building contracts..."
cd "$ROOT_DIR/contracts/lotus"
cargo build --target wasm32-unknown-unknown --release
WASM="$ROOT_DIR/contracts/lotus/target/wasm32-unknown-unknown/release/lotus_vault.wasm"

# ── Deploy ────────────────────────────────────────────────────────────────────
echo "==> Deploying lotus-vault..."
LOTUS_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source admin \
  --network "$NETWORK" 2>&1 | tail -1)
echo "lotus-vault: $LOTUS_ID"

# ── Update .env.local ─────────────────────────────────────────────────────────
sed -i "s|NEXT_PUBLIC_LOTUS_VAULT_CONTRACT=.*|NEXT_PUBLIC_LOTUS_VAULT_CONTRACT=$LOTUS_ID|" "$ENV_FILE"
echo "==> Updated $ENV_FILE"

# ── Initialize ────────────────────────────────────────────────────────────────
ADMIN_PUBKEY=$(stellar keys address admin)
BLEND_POOL="${NEXT_PUBLIC_BLEND_USDC_POOL:-}"
USDC="${USDC_CONTRACT:-CA63EPM4EEXUVUANF6FQUJEJ37RWRYIXCARWFXYUMPP7RLZWFNLTVNR4}"
DRAW_INTERVAL=60  # 1 minute for testnet

echo "==> Initializing contract..."
stellar contract invoke \
  --id "$LOTUS_ID" \
  --source admin \
  --network "$NETWORK" \
  -- initialize \
  --admin "$ADMIN_PUBKEY" \
  --blend_pool "${BLEND_POOL:-$LOTUS_ID}" \
  --usdc_token "$USDC" \
  --draw_interval "$DRAW_INTERVAL"

echo ""
echo "=== Deployment Complete ==================================="
echo "  Network:      $NETWORK"
echo "  lotus-vault:  $LOTUS_ID"
echo "  Next draw in: ${DRAW_INTERVAL}s"
echo "==========================================================="
