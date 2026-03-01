import {
  rpc as StellarRpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  scValToNative,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { ACTIVE_NETWORK, IS_TESTNET, ACTIVE_CONTRACTS, USDC_ISSUER } from '@/constants';

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

// Check whether the account has a classic trustline to the vault's USDC issuer.
// This is the issuer that the SAC (ACTIVE_CONTRACTS.USDC) wraps, so having this
// trustline is a prerequisite for the vault's transfer() to succeed.
async function hasUsdcIssuerTrustline(publicKey: string): Promise<boolean> {
  try {
    const resp = await fetch(`${ACTIVE_NETWORK.HORIZON_URL}/accounts/${publicKey}`);
    if (!resp.ok) return false;
    const data = await resp.json() as {
      balances?: { asset_type: string; asset_code?: string; asset_issuer?: string }[];
    };
    return (data.balances ?? []).some(
      b => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );
  } catch {
    return false;
  }
}

// Check whether a user can transfer USDC via the vault's SAC.
// Returns true when either the SAC already shows a non-zero balance (meaning the
// correct trustline exists and is funded) OR the correct issuer trustline is present
// but the account just has a zero balance.
export async function checkUsdcTrustline(publicKey: string): Promise<boolean> {
  console.log(`[checkUsdcTrustline] publicKey=${publicKey} sacContract=${ACTIVE_CONTRACTS.USDC}`);
  const sacBalance = await fetchTokenBalance(ACTIVE_CONTRACTS.USDC, publicKey);
  console.log(`[checkUsdcTrustline] SAC balance=${sacBalance}`);
  if (sacBalance > 0n) return true;
  const hasTrustline = await hasUsdcIssuerTrustline(publicKey);
  console.log(`[checkUsdcTrustline] Horizon trustline=${hasTrustline}`);
  return hasTrustline;
}

// Return the SAC USDC balance and whether the correct issuer trustline exists.
// Only the SAC balance matters for the vault — we never fall back to a different
// issuer's balance, as that would mislead the user into thinking a deposit will work.
export async function getUsdcStatus(
  publicKey: string
): Promise<{ hasTrustline: boolean; balance: bigint }> {
  console.log(`[getUsdcStatus] publicKey=${publicKey} sacContract=${ACTIVE_CONTRACTS.USDC}`);
  const sacBalance = await fetchTokenBalance(ACTIVE_CONTRACTS.USDC, publicKey);
  console.log(`[getUsdcStatus] SAC balance=${sacBalance}`);
  if (sacBalance > 0n) {
    return { hasTrustline: true, balance: sacBalance };
  }
  const hasTrustline = await hasUsdcIssuerTrustline(publicKey);
  return { hasTrustline, balance: 0n };
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
