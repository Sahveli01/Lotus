'use client';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { StellarWalletsKit, Networks, KitEventType } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { WalletState } from '@/types';
import { IS_TESTNET } from '@/constants';
import { getUsdcStatus } from '@/lib/stellar';

interface WalletContextType {
  walletState: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

const defaultWalletState: WalletState = {
  isConnected: false,
  publicKey: null,
  usdcBalance: 0n,
  xlmBalance: 0n,
  walletName: null,
};

const WalletContext = createContext<WalletContextType>({
  walletState: defaultWalletState,
  connect: async () => {},
  disconnect: () => {},
  signTransaction: async () => '',
});

export const useWalletContext = () => useContext(WalletContext);

// Initialise the static kit once at module load
let kitInitialised = false;
function ensureKit() {
  if (kitInitialised) return;
  StellarWalletsKit.init({
    network: IS_TESTNET ? Networks.TESTNET : Networks.PUBLIC,
    selectedWalletId: FREIGHTER_ID,
    modules: [
      new FreighterModule(),
      new AlbedoModule(),
      new xBullModule(),
    ],
  });
  kitInitialised = true;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>(defaultWalletState);

  // Listen for kit state updates (handles reconnect on page refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    ensureKit();
    const off = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      const address = event.payload.address;
      if (address) {
        setWalletState(prev => ({ ...prev, isConnected: true, publicKey: address }));
        getUsdcStatus(address)
          .then(({ balance }) => setWalletState(prev => ({ ...prev, usdcBalance: balance })))
          .catch(() => {});
      } else {
        setWalletState(defaultWalletState);
      }
    });
    return off;
  }, []);

  const connect = useCallback(async () => {
    ensureKit();
    const { address } = await StellarWalletsKit.authModal();
    const { balance: usdcBalance } = await getUsdcStatus(address).catch(() => ({ hasTrustline: false, balance: 0n }));
    setWalletState(prev => ({
      ...prev,
      isConnected: true,
      publicKey: address,
      usdcBalance,
      walletName: StellarWalletsKit.selectedModule?.productName ?? null,
    }));
  }, []);

  const disconnect = useCallback(async () => {
    await StellarWalletsKit.disconnect();
    setWalletState(defaultWalletState);
  }, []);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!walletState.publicKey) throw new Error('Wallet not connected');
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: IS_TESTNET
        ? 'Test SDF Network ; September 2015'
        : 'Public Global Stellar Network ; September 2015',
      address: walletState.publicKey,
    });
    return signedTxXdr;
  }, [walletState.publicKey]);

  return (
    <WalletContext.Provider value={{ walletState, connect, disconnect, signTransaction }}>
      {children}
    </WalletContext.Provider>
  );
}
