'use client';
import type { DrawResult } from '@/types';
import { formatUSDC } from '@/lib/stellar';

interface Props {
  draws?: DrawResult[];
}

export function WinHistory({ draws = [] }: Props) {
  if (draws.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="mb-4 text-lg font-semibold">Win History</h2>
        <p className="text-sm text-zinc-500">No draws yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="mb-4 text-lg font-semibold">Win History</h2>
      <div className="space-y-3">
        {draws.map((draw) => (
          <div
            key={draw.txHash}
            className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-900"
          >
            <div>
              <p className="text-sm font-medium">
                Round #{draw.roundNumber}
              </p>
              <p className="text-xs text-zinc-500">
                {draw.winner.slice(0, 6)}...{draw.winner.slice(-6)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-600">
                +{formatUSDC(draw.prizeAmount)} USDC
              </p>
              <p className="text-xs text-zinc-500">
                {new Date(draw.timestamp * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
