'use client';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import type { PrizePool, UserPosition, TransactionStatus } from '@/types';
import { ACTIVE_CONTRACTS, LOTUS_CONFIG } from '@/constants';
import {
  getLotusStats,
  getLotusDeposit,
  getWinChance,
  buildDepositTx,
  buildWithdrawTx,
  buildDrawTx,
  submitSignedTx,
} from '@/lib/lotus-contract';

// Fallback caller for unauthenticated reads
const READ_ONLY_KEY = 'GDWEQP2WFAIJMWBZUUISEZ5UR5ZFII7HLFWACQRGJTX7NWI2SUZEKQP6';

const DEFAULT_PRIZE_POOL: PrizePool = {
  totalDeposits: 0n,
  currentYield: 0n,
  nextDrawTimestamp: 0,
  lastWinner: null,
  lastPrize: 0n,
  totalWinners: 0,
  roundNumber: 1,
};

const DEFAULT_POSITION: UserPosition = {
  depositedAmount: 0n,
  ticketCount: 0,
  totalDeposited: 0n,
  sharePercent: 0,
};

export function useLotus() {
  const { publicKey, signTransaction } = useWallet();
  const contractId = ACTIVE_CONTRACTS.LOTUS_VAULT;

  const [prizePool, setPrizePool] = useState<PrizePool>(DEFAULT_PRIZE_POOL);
  const [userPosition, setUserPosition] = useState<UserPosition>(DEFAULT_POSITION);
  const [txStatus, setTxStatus] = useState<TransactionStatus>({ status: 'idle' });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // ── Load on-chain state ──────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    if (!contractId) return;
    setIsLoadingStats(true);
    try {
      const caller = publicKey ?? READ_ONLY_KEY;
      const stats = await getLotusStats(contractId, caller);

      setPrizePool({
        totalDeposits: stats.totalDeposits,
        currentYield: stats.prizePool,
        nextDrawTimestamp: stats.nextDraw,
        lastWinner: stats.lastWinner,
        lastPrize: stats.lastPrize,
        totalWinners: stats.totalWinners,
        roundNumber: stats.roundNumber,
      });

      if (publicKey) {
        const [depositAmount, winChance] = await Promise.all([
          getLotusDeposit(contractId, publicKey, publicKey),
          getWinChance(contractId, publicKey, publicKey),
        ]);
        setUserPosition({
          depositedAmount: depositAmount,
          ticketCount: Number(depositAmount / BigInt(10 ** LOTUS_CONFIG.USDC_DECIMALS)),
          totalDeposited: depositAmount,
          sharePercent: winChance,
        });
      } else {
        setUserPosition(DEFAULT_POSITION);
      }
    } catch (err) {
      console.error('[useLotus] loadStats failed:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [contractId, publicKey]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30_000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // ── Write operations ─────────────────────────────────────────────────────

  const deposit = useCallback(async (amount: bigint): Promise<string> => {
    if (!publicKey || !contractId) throw new Error('Wallet not connected');
    setTxStatus({ status: 'pending' });
    try {
      // The vault calls token::Client::transfer(user → vault) internally.
      // Soroban auth covers the token transfer inside the same transaction —
      // no separate SEP-41 `approve` call is needed.
      const depositXdr = await buildDepositTx(publicKey, amount);
      const signedDeposit = await signTransaction(depositXdr);
      const txHash = await submitSignedTx(signedDeposit);

      setTxStatus({ status: 'success', txHash });
      await loadStats();
      return txHash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTrustline = msg.includes('#13') || msg.toLowerCase().includes('trustline');
      setTxStatus({
        status: 'error',
        error: isTrustline
          ? 'No USDC trustline on this account. In Freighter: go to Assets → Add Asset → search USDC.'
          : msg,
      });
      throw err;
    }
  }, [publicKey, contractId, signTransaction, loadStats]);

  const withdraw = useCallback(async (amount: bigint): Promise<string> => {
    if (!publicKey || !contractId) throw new Error('Wallet not connected');
    setTxStatus({ status: 'pending' });
    try {
      const withdrawXdr = await buildWithdrawTx(publicKey, amount);
      const signedWithdraw = await signTransaction(withdrawXdr);
      const txHash = await submitSignedTx(signedWithdraw);

      setTxStatus({ status: 'success', txHash });
      await loadStats();
      return txHash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTrustline = msg.includes('#13') || msg.toLowerCase().includes('trustline');
      setTxStatus({
        status: 'error',
        error: isTrustline
          ? 'No USDC trustline on this account. In Freighter: go to Assets → Add Asset → search USDC.'
          : msg,
      });
      throw err;
    }
  }, [publicKey, contractId, signTransaction, loadStats]);

  const executeDraw = useCallback(async (participants: string[]): Promise<string> => {
    if (!publicKey || !contractId) throw new Error('Wallet not connected');
    setTxStatus({ status: 'pending' });
    try {
      const drawXdr = await buildDrawTx(publicKey, participants);
      const signedDraw = await signTransaction(drawXdr);
      const txHash = await submitSignedTx(signedDraw);

      setTxStatus({ status: 'success', txHash });
      await loadStats();
      return txHash;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      setTxStatus({ status: 'error', error });
      throw err;
    }
  }, [publicKey, contractId, signTransaction, loadStats]);

  const resetStatus = useCallback(() => {
    setTxStatus({ status: 'idle' });
  }, []);

  return {
    prizePool,
    userPosition,
    txStatus,
    isLoadingStats,
    deposit,
    withdraw,
    executeDraw,
    resetStatus,
    refresh: loadStats,
  };
}
