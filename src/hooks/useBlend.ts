'use client';
import { useState, useEffect } from 'react';
import { fetchBlendSupplyApr, fetchBlendPosition, getBlendPoolStats } from '@/lib/blend';
import type { BlendPosition } from '@/types';

// ─── Combined stats hook ──────────────────────────────────────────────────────

interface BlendStats {
  usdcApy: number;
  totalValueLocked: number;
  isLoading: boolean;
}

export function useBlend(): BlendStats {
  const [stats, setStats] = useState<BlendStats>({
    usdcApy: 0,
    totalValueLocked: 0,
    isLoading: true,
  });

  useEffect(() => {
    getBlendPoolStats()
      .then(pool => setStats({
        usdcApy: pool.usdcSupplyApy,
        totalValueLocked: Number(pool.totalSupplied) / 1e7,
        isLoading: false,
      }))
      .catch(() => setStats(prev => ({ ...prev, isLoading: false, usdcApy: 0 })));
  }, []);

  return stats;
}

export function useBlendApr() {
  const [apr, setApr] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlendSupplyApr()
      .then(setApr)
      .finally(() => setLoading(false));
  }, []);

  return { apr, loading };
}

export function useBlendPosition(publicKey: string | null) {
  const [position, setPosition] = useState<BlendPosition | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    fetchBlendPosition(publicKey)
      .then(setPosition)
      .finally(() => setLoading(false));
  }, [publicKey]);

  return { position, loading };
}
