'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchPrizePool, fetchUserPosition } from '@/lib/lotus-contract';
import { ACTIVE_CONTRACTS } from '@/constants';
import type { PrizePool, UserPosition, DrawResult } from '@/types';

// ─── Countdown hook ───────────────────────────────────────────────────────────

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
}

export function useCountdown(targetTimestamp: number): CountdownTime {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0, hours: 0, minutes: 0, seconds: 0,
    isExpired: false, totalSeconds: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = targetTimestamp - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400),
        hours: Math.floor((diff % 86400) / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        isExpired: false,
        totalSeconds: diff,
      });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetTimestamp]);

  return timeLeft;
}

// Fallback public key for read-only queries (any valid stellar address works)
const READ_ONLY_KEY = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';

export function usePrizePool(publicKey?: string | null) {
  const [prizePool, setPrizePool] = useState<PrizePool | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [draws] = useState<DrawResult[]>([]);  // populated when on-chain history query is available
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractDeployed = Boolean(ACTIVE_CONTRACTS.LOTUS_VAULT);

  const refresh = useCallback(async () => {
    if (!contractDeployed) return;
    setLoading(true);
    setError(null);
    try {
      const sourceKey = publicKey ?? READ_ONLY_KEY;
      const pool = await fetchPrizePool(sourceKey);
      setPrizePool(pool);

      if (publicKey) {
        const pos = await fetchUserPosition(publicKey);
        setUserPosition(pos);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [publicKey, contractDeployed]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [refresh]);

  return { prizePool, userPosition, draws, loading, error, refresh };
}
