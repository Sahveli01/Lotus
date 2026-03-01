import {
  rpc as StellarRpc,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  scValToNative,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { ACTIVE_NETWORK, IS_TESTNET, USDC_ISSUER } from '@/constants';

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

// Check if a Stellar account has the required USDC classic trustline.
// This MUST be called before deposit because Soroban simulation does not enforce
// classic-asset trustline requirements — only on-chain execution does (Error #13).
// Returns false on any network error (safe: TrustlineGuard will show setup UI).
export async function checkUsdcTrustline(publicKey: string): Promise<boolean> {
  try {
    const resp = await fetch(`${ACTIVE_NETWORK.HORIZON_URL}/accounts/${publicKey}`);
    if (!resp.ok) return false;
    const data = await resp.json() as {
      balances?: { asset_type: string; asset_code?: string; asset_issuer?: string }[];
    };
    return (data.balances ?? []).some(
      b => b.asset_type !== 'native' && b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );
  } catch {
    return false;
  }
}

// Read USDC trustline state AND balance from Horizon in a single request.
// Much more reliable than Soroban simulation for classic-asset balances:
// simulation can silently fail (seq mismatch, SAC state issues) and return 0n
// even when the account actually holds USDC.
export async function getUsdcStatus(
  publicKey: string
): Promise<{ hasTrustline: boolean; balance: bigint }> {
  try {
    const resp = await fetch(`${ACTIVE_NETWORK.HORIZON_URL}/accounts/${publicKey}`);
    if (!resp.ok) return { hasTrustline: false, balance: 0n };
    const data = await resp.json() as {
      balances?: {
        asset_type: string;
        asset_code?: string;
        asset_issuer?: string;
        balance?: string;
      }[];
    };
    const entry = (data.balances ?? []).find(
      b => b.asset_type !== 'native' && b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );
    if (!entry) return { hasTrustline: false, balance: 0n };
    // Horizon returns balance as e.g. "10.0000000" — convert to 7-decimal bigint
    const [whole, fraction = ''] = (entry.balance ?? '0').split('.');
    const paddedFraction = fraction.padEnd(7, '0').slice(0, 7);
    const balance = BigInt(whole) * 10_000_000n + BigInt(paddedFraction);
    return { hasTrustline: true, balance };
  } catch {
    return { hasTrustline: false, balance: 0n };
  }
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
