'use client';
import { useWalletContext } from '@/providers/WalletProvider';

export function useWallet() {
  const { walletState, connect, disconnect, signTransaction } = useWalletContext();

  return {
    isConnected: walletState.isConnected,
    publicKey: walletState.publicKey,
    usdcBalance: walletState.usdcBalance,
    xlmBalance: walletState.xlmBalance,
    walletName: walletState.walletName,
    connect,
    disconnect,
    signTransaction,
  };
}
