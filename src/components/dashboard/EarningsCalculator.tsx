'use client';
import { useState } from 'react';
import { useBlend } from '@/hooks/useBlend';

interface Row {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals: number;
}

export function EarningsCalculator() {
  const { usdcApy } = useBlend();
  const [amount, setAmount] = useState('1000');

  const deposited = parseFloat(amount) || 0;
  const weeklyYield = deposited * (usdcApy / 100) / 52;
  const monthlyYield = deposited * (usdcApy / 100) / 12;
  const yearlyYield = deposited * (usdcApy / 100);

  // Mock total pool size — win chance vs total pool
  const totalEstimatedPool = 10_000;
  const winChance = deposited > 0
    ? Math.min(100, (deposited / (totalEstimatedPool + deposited)) * 100)
    : 0;

  const rows: Row[] = [
    { label: 'Weekly yield to prize pool', value: weeklyYield, prefix: '$', decimals: 4 },
    { label: 'Monthly yield to prize pool', value: monthlyYield, prefix: '$', decimals: 3 },
    { label: 'Annual yield to prize pool', value: yearlyYield, prefix: '$', decimals: 2 },
    { label: 'Est. win chance per draw', value: winChance, suffix: '%', decimals: 3 },
  ];

  const sliderPct = Math.min(100, (deposited / 10_000) * 100);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '32px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Yield Calculator
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
        }}>
          What could you win?
        </h3>
      </div>

      {/* Amount input */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          display: 'block',
          marginBottom: '8px',
        }}>
          Deposit amount (USDC)
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '4px 4px 4px 16px',
        }}>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginRight: '4px' }}>$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.3rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: '300',
            }}
          />
          <span style={{
            padding: '10px 14px',
            background: 'rgba(244,169,59,0.1)',
            borderRadius: '8px',
            color: 'var(--gold)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-body)',
            flexShrink: 0,
          }}>
            USDC
          </span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min="10"
          max="10000"
          step="10"
          value={Math.min(10_000, deposited)}
          onChange={e => setAmount(e.target.value)}
          style={{
            width: '100%',
            marginTop: '12px',
            height: '4px',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
            background: `linear-gradient(to right, var(--gold) 0%, var(--gold) ${sliderPct}%, rgba(255,255,255,0.1) ${sliderPct}%, rgba(255,255,255,0.1) 100%)`,
          } as React.CSSProperties}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          marginTop: '4px',
        }}>
          <span>$10</span>
          <span>$10,000</span>
        </div>
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.map(({ label, value, prefix = '', suffix = '', decimals }) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
          }}>
            <span style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              {label}
            </span>
            <span style={{
              fontSize: '1rem',
              color: 'var(--gold)',
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
            }}>
              {prefix}{value.toFixed(decimals)}{suffix}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '16px',
        padding: '10px 14px',
        background: 'rgba(244,169,59,0.04)',
        borderRadius: '10px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.6,
      }}>
        Based on {usdcApy.toFixed(1)}% Blend USDC APY. Win chance assumes $10K total TVL.
        Yields flow entirely to the prize pool — your principal is untouched.
      </div>
    </div>
  );
}
