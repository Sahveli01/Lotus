// Network
export const NETWORK = {
  TESTNET: {
    RPC_URL: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
    HORIZON_URL: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    PASSPHRASE: 'Test SDF Network ; September 2015',
    FRIENDBOT_URL: 'https://friendbot.stellar.org',
  },
  MAINNET: {
    RPC_URL: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://mainnet.sorobanrpc.com',
    HORIZON_URL: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon.stellar.org',
    PASSPHRASE: 'Public Global Stellar Network ; September 2015',
  },
} as const;

// Hangi network kullanıldığı (başlangıçta testnet)
export const ACTIVE_NETWORK = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
  ? NETWORK.MAINNET
  : NETWORK.TESTNET;

// Testnet Contract Adresleri
export const CONTRACTS = {
  TESTNET: {
    USDC: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
    XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    BLEND_POOL_FACTORY: 'CB5UDFTJ6VFOK63ZHQASNODV4PP2HVGPYRF754LRGO7YRG5SFCAZWTDD',
    BLEND_BACKSTOP: 'CAYRY4MZ42MAT3VLTXCILUG7RUAPELZDCDSI2BWBYUJWIDDWW3HQV5LU',
    BLEND_USDC_POOL: process.env.NEXT_PUBLIC_BLEND_USDC_POOL || '',
    LOTUS_VAULT: process.env.NEXT_PUBLIC_LOTUS_VAULT_CONTRACT || '',
  },
  MAINNET: {
    USDC: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
    XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    BLEND_USDC_POOL: 'CDVQVKOY2YSDFBD7QCIMXPDGQSOHKN37OEOUHPPAS2AT2KSVWDKPUOAD',
    LOTUS_VAULT: '',
  },
} as const;

// LOTUS Protocol Sabitleri
export const LOTUS_CONFIG = {
  DRAW_INTERVAL_SECONDS: 7 * 24 * 60 * 60, // 7 gün (testnet'te 60 saniye)
  DRAW_INTERVAL_TESTNET: 60, // 1 dakika testnet demo için
  MIN_DEPOSIT_USDC: 1, // minimum 1 USDC
  USDC_DECIMALS: 7, // Stellar'da USDC 7 decimal
  XLM_DECIMALS: 7,
  PROTOCOL_FEE_BPS: 50, // %0.5 fee (opsiyonel)
} as const;

export const IS_TESTNET = process.env.NEXT_PUBLIC_NETWORK !== 'mainnet';
export const ACTIVE_CONTRACTS = IS_TESTNET ? CONTRACTS.TESTNET : CONTRACTS.MAINNET;

// USDC classic asset issuer — switches with network so trustline checks always
// compare against the correct issuer. Mixing these causes silent auth failures.
export const USDC_ISSUER = IS_TESTNET
  ? 'GCKIUOTK3NWD33ONH7TQERCSLECXLWQMA377HSJR4E2MV7KPQFAQLOLN' // testnet USDC
  : 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'; // Circle mainnet USDC
