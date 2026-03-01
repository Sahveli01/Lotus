'use client';
import { formatUSDC } from '@/lib/stellar';
import { usePrizePool } from '@/hooks/usePrizePool';
import { useWallet } from '@/hooks/useWallet';

export function UserPosition() {
  const { publicKey } = useWallet();
  const { userPosition, loading } = usePrizePool(publicKey);

  if (!publicKey) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Connect wallet to see your position</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Loading position...</p>
      </div>
    );
  }

  if (!userPosition) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="mb-4 text-lg font-semibold">Your Position</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500">Deposited</p>
          <p className="text-lg font-bold">{formatUSDC(userPosition.depositedAmount)} USDC</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Tickets</p>
          <p className="text-lg font-bold">{userPosition.ticketCount}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Pool Share</p>
          <p className="text-lg font-bold">{userPosition.sharePercent.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Win Chance</p>
          <p className="text-lg font-bold text-emerald-600">{userPosition.sharePercent.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}
