import {
  rpc as StellarRpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  scValToNative,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { ACTIVE_NETWORK, IS_TESTNET, ACTIVE_CONTRACTS } from '@/constants';

// RPC Server instance
export const getRpcServer = () => new StellarRpc.Server(ACTIVE_NETWORK.RPC_URL, {
  allowHttp: false,
});

// Network passphrase
export const getNetworkPassphrase = () => IS_TESTNET
  ? Networks.TESTNET
  : Networks.PUBLIC;

// Simulate a contract call (read-only)
export async function simulateContractCall(
  contractId: string,
  method: string,
  args: Parameters<Contract['call']>[1][],
  sourcePublicKey: string
) {
  const rpc = getRpcServer();
  const account = await rpc.getAccount(sourcePublicKey);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpc.simulateTransaction(tx);

  if (StellarRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  return scValToNative(simResult.result!.retval);
}

// Build a contract invoke transaction (write)
export async function buildContractInvoke(
  contractId: string,
  method: string,
  args: Parameters<Contract['call']>[1][],
  sourcePublicKey: string
) {
  const rpc = getRpcServer();
  const account = await rpc.getAccount(sourcePublicKey);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const preparedTx = await rpc.prepareTransaction(tx);
  return preparedTx;
}

// Submit signed transaction.
// Sends the signed XDR directly via JSON-RPC to avoid any re-parsing
// through TransactionBuilder.fromXDR — which can fail when wallet-signed
// Soroban XDR uses slightly different union discriminants than the local SDK.
export async function submitTransaction(signedXdr: string) {
  const rpc = getRpcServer();

  // POST signed XDR directly so we never re-parse it locally
  const response = await fetch(ACTIVE_NETWORK.RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: { transaction: signedXdr },
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: HTTP ${response.status}`);
  }

  const data = await response.json() as {
    result?: { status: string; hash: string; errorResult?: unknown };
    error?: { message: string; code: number };
  };

  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  const rpcResult = data.result!;

  if (rpcResult.status === 'ERROR') {
    throw new Error(`Transaction rejected: ${JSON.stringify(rpcResult.errorResult ?? rpcResult)}`);
  }

  const txHash = rpcResult.hash;

  // Poll for on-chain confirmation
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    const txResult = await rpc.getTransaction(txHash);
    if (txResult.status === 'SUCCESS') {
      return { success: true, txHash, result: txResult };
    }
    if (txResult.status === 'FAILED') {
      throw new Error(`Transaction failed on-chain: ${txHash}`);
    }
    // NOT_FOUND → still pending, keep polling
    attempts++;
  }
  throw new Error(`Transaction ${txHash} timed out after 60 seconds`);
}

// Fetch USDC balance directly from Horizon — picks the first USDC entry with a
// non-zero balance, regardless of issuer. This is the fallback for when the SAC
// contract address doesn't match the issuer the user actually holds tokens from.
async function fetchHorizonUsdcBalance(publicKey: string): Promise<bigint> {
  try {
    const url = `${ACTIVE_NETWORK.HORIZON_URL}/accounts/${publicKey}`;
    console.log('[USDC] Horizon fallback — fetching:', url);
    const resp = await fetch(url);
    if (!resp.ok) {
      console.log('[USDC] Horizon response not ok:', resp.status);
      return 0n;
    }
    const data = await resp.json() as {
      balances?: { asset_type: string; asset_code?: string; balance?: string; asset_issuer?: string }[];
    };
    console.log('[USDC] Horizon balances:', JSON.stringify(data.balances ?? []));
    const usdcEntry = (data.balances ?? []).find(
      b => b.asset_code === 'USDC' && parseFloat(b.balance ?? '0') > 0
    );
    if (!usdcEntry?.balance) {
      console.log('[USDC] No non-zero USDC entry found in Horizon');
      return 0n;
    }
    console.log(`[USDC] Horizon USDC found: ${usdcEntry.balance} (issuer: ${usdcEntry.asset_issuer})`);
    // Horizon returns classic format like "937.0000000" — convert to 7-decimal bigint
    const [whole, fraction = ''] = usdcEntry.balance.split('.');
    const paddedFraction = fraction.padEnd(7, '0').slice(0, 7);
    return BigInt(whole) * BigInt(10 ** 7) + BigInt(paddedFraction);
  } catch (err) {
    console.log('[USDC] Horizon fetch error:', err);
    return 0n;
  }
}

// Internal helper: checks Horizon for any USDC classic trustline on this account,
// regardless of issuer. Used as a fallback for zero-balance accounts so the
// TrustlineGuard "Add Trustline + Request USDC" flow still works for new users.
async function hasClassicUsdcTrustline(publicKey: string): Promise<boolean> {
  try {
    const resp = await fetch(`${ACTIVE_NETWORK.HORIZON_URL}/accounts/${publicKey}`);
    if (!resp.ok) return false;
    const data = await resp.json() as {
      balances?: { asset_type: string; asset_code?: string }[];
    };
    return (data.balances ?? []).some(
      b => b.asset_type !== 'native' && b.asset_code === 'USDC'
    );
  } catch {
    return false;
  }
}

// Check whether a user can transfer USDC via the vault's token contract (the SAC).
// Uses the SAC's balance() as the primary signal. Falls back to Horizon (any issuer)
// so users with a mismatched SAC still see the correct trustline / balance state.
export async function checkUsdcTrustline(publicKey: string): Promise<boolean> {
  console.log(`[checkUsdcTrustline] publicKey=${publicKey} sacContract=${ACTIVE_CONTRACTS.USDC}`);
  const sacBalance = await fetchTokenBalance(ACTIVE_CONTRACTS.USDC, publicKey);
  console.log(`[checkUsdcTrustline] SAC balance=${sacBalance}`);
  if (sacBalance > 0n) return true;
  const horizonBalance = await fetchHorizonUsdcBalance(publicKey);
  console.log(`[checkUsdcTrustline] Horizon balance=${horizonBalance}`);
  if (horizonBalance > 0n) return true;
  return hasClassicUsdcTrustline(publicKey);
}

// Return the best available USDC balance AND trustline state for deposit pre-flight.
// Priority: SAC balance (needed for vault transfer) → Horizon any-issuer balance
// (shows real holdings even when the SAC address doesn't match the held issuer).
export async function getUsdcStatus(
  publicKey: string
): Promise<{ hasTrustline: boolean; balance: bigint }> {
  console.log(`[getUsdcStatus] publicKey=${publicKey} sacContract=${ACTIVE_CONTRACTS.USDC}`);
  const sacBalance = await fetchTokenBalance(ACTIVE_CONTRACTS.USDC, publicKey);
  console.log(`[getUsdcStatus] SAC balance=${sacBalance}`);
  if (sacBalance > 0n) {
    return { hasTrustline: true, balance: sacBalance };
  }
  // SAC returned 0 — the SAC address likely doesn't match the issuer the user holds.
  // Try Horizon to show the real balance.
  const horizonBalance = await fetchHorizonUsdcBalance(publicKey);
  console.log(`[getUsdcStatus] Horizon fallback balance=${horizonBalance}`);
  const hasTrustline = horizonBalance > 0n || await hasClassicUsdcTrustline(publicKey);
  return { hasTrustline, balance: horizonBalance };
}

// Fetch token balance via SAC `balance(address)` — works for any Stellar Asset Contract.
// Returns 0n if the account has no trustline or the call fails.
export async function fetchTokenBalance(
  tokenContractId: string,
  address: string
): Promise<bigint> {
  try {
    const result = await simulateContractCall(
      tokenContractId,
      'balance',
      [nativeToScVal(address, { type: 'address' })],
      address
    );
    return BigInt(result);
  } catch {
    return 0n;
  }
}

// Format bigint USDC to display string
export function formatUSDC(amount: bigint, decimals = 7): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fractionStr}`;
}

// Parse display string to bigint
export function parseUSDC(amount: string, decimals = 7): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);
}

// USDC approve — grant spending allowance to a contract (SEP-41 token standard)
export async function buildApproveTx(
  tokenContractId: string,
  ownerAddress: string,
  spenderAddress: string,
  amount: bigint,
  expirationLedger?: number
): Promise<string> {
  const rpc = getRpcServer();
  const account = await rpc.getAccount(ownerAddress);
  const contract = new Contract(tokenContractId);

  const ledgerInfo = await rpc.getLatestLedger();
  const expLedger = expirationLedger ?? ledgerInfo.sequence + 500;

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(contract.call(
      'approve',
      nativeToScVal(ownerAddress, { type: 'address' }),
      nativeToScVal(spenderAddress, { type: 'address' }),
      nativeToScVal(amount, { type: 'i128' }),
      nativeToScVal(expLedger, { type: 'u32' })
    ))
    .setTimeout(30)
    .build();

  const preparedTx = await rpc.prepareTransaction(tx);
  return preparedTx.toXDR();
}

// Submit a signed XDR transaction and return its hash
export async function submitSignedTx(signedXdr: string): Promise<string> {
  const { txHash } = await submitTransaction(signedXdr);
  return txHash;
}
