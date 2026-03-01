/**
 * LOTUS Vault Soroban contract client
 * All on-chain interactions with the lotus-vault contract go through here.
 *
 * Contract API (lotus-vault v0.1.0):
 *   write:  deposit(user, amount), withdraw(user, amount), accrue_yield(admin, amount), execute_draw(participants)
 *   read:   get_deposit, get_prize_pool, get_total_deposits, get_next_draw,
 *           get_last_winner, get_last_prize, get_round_number, get_total_winners,
 *           get_win_chance, get_config
 */

import { nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { ACTIVE_CONTRACTS } from '@/constants';
import { buildContractInvoke, simulateContractCall, submitTransaction } from './stellar';
import type { PrizePool, UserPosition } from '@/types';

// ─── Typed stats struct for explicit-contractId API ──────────────────────────

export interface LotusStats {
  totalDeposits: bigint;
  prizePool: bigint;
  nextDraw: number;
  roundNumber: number;
  lastWinner: string | null;
  lastPrize: bigint;
  totalWinners: number;
}

const getContractId = (): string => {
  const id = ACTIVE_CONTRACTS.LOTUS_VAULT;
  if (!id) throw new Error('LOTUS_VAULT contract address not configured. Deploy first.');
  return id;
};

// ─── Read-only queries ────────────────────────────────────────────────────────

export async function fetchPrizePool(sourcePublicKey: string): Promise<PrizePool> {
  const contractId = getContractId();

  const [
    totalDeposits,
    prizePool,
    nextDraw,
    roundNumber,
    lastWinner,
    lastPrize,
    totalWinners,
  ] = await Promise.all([
    simulateContractCall(contractId, 'get_total_deposits', [], sourcePublicKey),
    simulateContractCall(contractId, 'get_prize_pool', [], sourcePublicKey),
    simulateContractCall(contractId, 'get_next_draw', [], sourcePublicKey),
    simulateContractCall(contractId, 'get_round_number', [], sourcePublicKey),
    simulateContractCall(contractId, 'get_last_winner', [], sourcePublicKey),
    simulateContractCall(contractId, 'get_last_prize', [], sourcePublicKey),
    simulateContractCall(contractId, 'get_total_winners', [], sourcePublicKey),
  ]);

  return {
    totalDeposits: BigInt(String(totalDeposits ?? 0)),
    currentYield: BigInt(String(prizePool ?? 0)),   // prize pool = current yield to be distributed
    nextDrawTimestamp: Number(nextDraw ?? 0),
    lastWinner: (lastWinner as string | null | undefined) ?? null,
    lastPrize: BigInt(String(lastPrize ?? 0)),
    totalWinners: Number(totalWinners ?? 0),
    roundNumber: Number(roundNumber ?? 1),
  };
}

export async function fetchUserPosition(
  userPublicKey: string
): Promise<UserPosition> {
  const contractId = getContractId();

  const [depositedAmount, winChanceRaw, totalDeposits] = await Promise.all([
    simulateContractCall(
      contractId,
      'get_deposit',
      [nativeToScVal(userPublicKey, { type: 'address' })],
      userPublicKey
    ),
    simulateContractCall(
      contractId,
      'get_win_chance',
      [nativeToScVal(userPublicKey, { type: 'address' })],
      userPublicKey
    ),
    simulateContractCall(contractId, 'get_total_deposits', [], userPublicKey),
  ]);

  const deposited = BigInt(String(depositedAmount ?? 0));
  // 1 ticket per USDC (7 decimals: 10_000_000 stroops = 1 USDC)
  const ticketCount = Number(deposited / BigInt(10_000_000));
  // win chance: raw value / 10^7 gives percentage; * 100 gives basis points
  const sharePercent = Math.round(Number(winChanceRaw ?? 0) / 1_000_000);

  return {
    depositedAmount: deposited,
    ticketCount,
    totalDeposited: BigInt(String(totalDeposits ?? 0)),
    sharePercent,
  };
}

// ─── Write transactions (return XDR to be signed by wallet) ──────────────────

export async function buildDepositTx(
  userPublicKey: string,
  amountUsdc: bigint
): Promise<string> {
  const tx = await buildContractInvoke(
    getContractId(),
    'deposit',
    [
      nativeToScVal(userPublicKey, { type: 'address' }),
      nativeToScVal(amountUsdc, { type: 'i128' }),
    ],
    userPublicKey
  );
  return tx.toXDR();
}

export async function buildWithdrawTx(
  userPublicKey: string,
  amountUsdc: bigint
): Promise<string> {
  const tx = await buildContractInvoke(
    getContractId(),
    'withdraw',
    [
      nativeToScVal(userPublicKey, { type: 'address' }),
      nativeToScVal(amountUsdc, { type: 'i128' }),
    ],
    userPublicKey
  );
  return tx.toXDR();
}

/**
 * execute_draw now requires explicit participant list.
 * Caller should provide all addresses that have non-zero deposits.
 */
export async function buildDrawTx(
  sourcePublicKey: string,
  participants: string[]
): Promise<string> {
  const participantVec = xdr.ScVal.scvVec(
    participants.map(p => nativeToScVal(p, { type: 'address' }))
  );

  const tx = await buildContractInvoke(
    getContractId(),
    'execute_draw',
    [participantVec],
    sourcePublicKey
  );
  return tx.toXDR();
}

// ─── Explicit contractId API (for hooks that inject contractId) ───────────────

/** Safe wrapper — returns null instead of throwing on scValToNative parse errors. */
async function safeSimulate(
  contractId: string,
  method: string,
  args: Parameters<typeof simulateContractCall>[2],
  callerAddress: string
): Promise<unknown> {
  try {
    return await simulateContractCall(contractId, method, args, callerAddress);
  } catch (e) {
    console.error(`[lotus-contract] ${method} failed:`, (e as Error).message);
    return null;
  }
}

export async function getLotusStats(
  contractId: string,
  callerAddress: string
): Promise<LotusStats> {
  const safe = (method: string, args: Parameters<typeof simulateContractCall>[2] = []) =>
    safeSimulate(contractId, method, args, callerAddress);

  const [totalDeposits, prizePool, nextDraw, roundNumber, lastWinner, lastPrize, totalWinners] =
    await Promise.all([
      safe('get_total_deposits'),
      safe('get_prize_pool'),
      safe('get_next_draw'),
      safe('get_round_number'),
      safe('get_last_winner'),
      safe('get_last_prize'),
      safe('get_total_winners'),
    ]);

  return {
    totalDeposits: BigInt(String(totalDeposits ?? 0)),
    prizePool: BigInt(String(prizePool ?? 0)),
    nextDraw: Number(nextDraw ?? 0),
    roundNumber: Number(roundNumber ?? 1),
    lastWinner: (lastWinner as string | null | undefined) ?? null,
    lastPrize: BigInt(String(lastPrize ?? 0)),
    totalWinners: Number(totalWinners ?? 0),
  };
}

export async function getLotusDeposit(
  contractId: string,
  userAddress: string,
  callerAddress: string
): Promise<bigint> {
  const result = await safeSimulate(
    contractId,
    'get_deposit',
    [nativeToScVal(userAddress, { type: 'address' })],
    callerAddress
  );
  return BigInt(String(result ?? 0));
}

export async function getWinChance(
  contractId: string,
  userAddress: string,
  callerAddress: string
): Promise<number> {
  const result = await safeSimulate(
    contractId,
    'get_win_chance',
    [nativeToScVal(userAddress, { type: 'address' })],
    callerAddress
  );
  // raw = deposit * 100 * 10^7 / total → divide by 10^7 to get percentage
  return Number(result ?? 0) / 10_000_000;
}

// Submit a signed XDR and return the tx hash
export async function submitSignedTx(signedXdr: string): Promise<string> {
  const { txHash } = await submitTransaction(signedXdr);
  return txHash;
}
