export interface UserPosition {
  depositedAmount: bigint;      // USDC, 7 decimals
  ticketCount: number;          // kaç bilet
  totalDeposited: bigint;       // kümülatif
  sharePercent: number;         // pool'daki yüzdesi
}

export interface PrizePool {
  totalDeposits: bigint;        // toplam havuz (USDC)
  currentYield: bigint;         // birikmiş yield (USDC)
  nextDrawTimestamp: number;    // unix timestamp
  lastWinner: string | null;    // son kazanan adres
  lastPrize: bigint;            // son ödül miktarı
  totalWinners: number;         // toplam çekiliş sayısı
  roundNumber: number;          // kaçıncı round
}

export interface DrawResult {
  winner: string;
  prizeAmount: bigint;
  timestamp: number;
  roundNumber: number;
  txHash: string;
}

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  usdcBalance: bigint;
  xlmBalance: bigint;
  walletName: string | null;
}

export interface BlendPosition {
  supplied: bigint;
  collateral: bigint;
  liabilities: bigint;
  blendApr: number;
}

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
}

export interface TicketInfo {
  address: string;
  tickets: number;
  depositAmount: bigint;
}
