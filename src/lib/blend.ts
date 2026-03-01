/**
 * Blend Capital SDK integration
 * Handles reading pool stats and positions from Blend Protocol
 */

import { PoolV2, PoolV1 } from '@blend-capital/blend-sdk';
import { ACTIVE_NETWORK, ACTIVE_CONTRACTS, IS_TESTNET } from '@/constants';
import type { BlendPosition } from '@/types';

// Blend pool address for current network
export const getBlendPoolAddress = (): string => {
  if (IS_TESTNET) {
    return ACTIVE_CONTRACTS.BLEND_USDC_POOL;
  }
  return ACTIVE_CONTRACTS.BLEND_USDC_POOL;
};

/**
 * Fetch the current supply APR from the Blend USDC pool.
 * Returns a number like 0.045 for 4.5%.
 */
export async function fetchBlendSupplyApr(): Promise<number> {
  // TODO: Integrate @blend-capital/blend-sdk pool data fetch
  // const pool = await Pool.load(rpc, getBlendPoolAddress());
  // const reserve = pool.reserves.get(ACTIVE_CONTRACTS.USDC);
  // return reserve?.supplyApr ?? 0;
  return 0.045; // placeholder: 4.5%
}

/**
 * Fetch a user's Blend position (supplied, collateral, liabilities).
 */
export async function fetchBlendPosition(
  _userPublicKey: string
): Promise<BlendPosition> {
  // TODO: Integrate blend-sdk UserPositions.load()
  return {
    supplied: 0n,
    collateral: 0n,
    liabilities: 0n,
    blendApr: 0.045,
  };
}

/**
 * Build a "supply" transaction to deposit USDC into Blend.
 * Returns the unsigned XDR string to be signed by the wallet.
 */
export async function buildBlendSupplyTx(
  _userPublicKey: string,
  _amountUsdc: bigint
): Promise<string> {
  // TODO: Use blend-sdk to build supply operation
  throw new Error('buildBlendSupplyTx not yet implemented');
}

/**
 * Build a "withdraw" transaction to pull USDC back from Blend.
 */
export async function buildBlendWithdrawTx(
  _userPublicKey: string,
  _amountUsdc: bigint
): Promise<string> {
  // TODO: Use blend-sdk to build withdraw operation
  throw new Error('buildBlendWithdrawTx not yet implemented');
}

// ─── Pool stats + pure helpers ────────────────────────────────────────────────

export interface BlendPoolStats {
  usdcSupplyApy: number;
  totalSupplied: bigint;
  utilization: number;
}

/**
 * Fetch current supply APY from the Blend USDC pool using the Blend SDK.
 * Requires NEXT_PUBLIC_BLEND_USDC_POOL to be set to the actual Blend pool contract ID
 * (not the USDC token address). Returns zeros if the pool cannot be loaded.
 */
export async function getBlendPoolStats(): Promise<BlendPoolStats> {
  const poolId = ACTIVE_CONTRACTS.BLEND_USDC_POOL;
  if (!poolId) return { usdcSupplyApy: 0, totalSupplied: 0n, utilization: 0 };

  const network = {
    rpc: ACTIVE_NETWORK.RPC_URL,
    passphrase: ACTIVE_NETWORK.PASSPHRASE,
  };

  try {
    // Try V2 first, fall back to V1
    let pool;
    try {
      pool = await PoolV2.load(network, poolId);
    } catch {
      pool = await PoolV1.load(network, poolId);
    }

    const reserve = pool.reserves.get(ACTIVE_CONTRACTS.USDC);
    if (!reserve) return { usdcSupplyApy: 0, totalSupplied: 0n, utilization: 0 };

    return {
      usdcSupplyApy: reserve.estSupplyApy * 100,  // decimal fraction → percentage
      totalSupplied: reserve.totalSupply(),
      utilization: reserve.getUtilizationFloat(),
    };
  } catch {
    return { usdcSupplyApy: 0, totalSupplied: 0n, utilization: 0 };
  }
}

/**
 * Estimate weekly yield for a given principal and APY.
 * @param totalDeposits  Pool principal in stroops (7 decimals)
 * @param apyPercent     Annual percentage yield, e.g. 8.5 for 8.5%
 */
export function calculateWeeklyYield(
  totalDeposits: bigint,
  apyPercent: number,
  decimals = 7
): bigint {
  if (totalDeposits === 0n) return 0n;
  const apyBps = BigInt(Math.floor(apyPercent * 100));
  return (totalDeposits * apyBps) / (10_000n * 52n);
}

/**
 * Calculate a user's win probability as a percentage.
 * @returns percentage 0–100, e.g. 33.5
 */
export function calculateWinChance(
  userDeposit: bigint,
  totalDeposits: bigint
): number {
  if (totalDeposits === 0n) return 0;
  return Number((userDeposit * 10_000n) / totalDeposits) / 100;
}
