'use client';
import { useWallet } from '@/hooks/useWallet';

export function WalletButton() {
  const { isConnected, publicKey, walletName, connect, disconnect } = useWallet();

  const truncate = (key: string) => `${key.slice(0, 4)}...${key.slice(-4)}`;

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">
          {walletName} · {truncate(publicKey)}
        </span>
        <button
          onClick={disconnect}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
    >
      Connect Wallet
    </button>
  );
}
