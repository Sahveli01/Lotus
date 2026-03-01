'use client';
import { useBlend } from '@/hooks/useBlend';
import type { UserPosition } from '@/types';
import { formatUSDC } from '@/lib/stellar';

interface Props {
  userPosition: UserPosition;
  publicKey: string | null;
}

export function UserStatsCard({ userPosition, publicKey }: Props) {
  const { usdcApy } = useBlend();

  const deposited = Number(userPosition.depositedAmount) / 1e7;
  const weeklyYield = deposited * (usdcApy / 100) / 52;
  const yearlyYield = deposited * (usdcApy / 100);

  const shortKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
    : null;

  const statBoxStyle: React.CSSProperties = {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(244,169,59,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Your Position
          </div>
          {shortKey && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              {shortKey}
            </div>
          )}
        </div>
        <div style={{
          width: '44px', height: '44px',
          borderRadius: '50%',
          background: 'rgba(244,169,59,0.1)',
          border: '1px solid rgba(244,169,59,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem',
        }}>
          🪷
        </div>
      </div>

      {/* Main deposit figure */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          Deposited
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.2rem, 5vw, 3rem)',
          fontWeight: '300',
          color: 'var(--gold-light)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {formatUSDC(userPosition.depositedAmount)}
          <span style={{
            fontSize: '1rem',
            color: 'var(--text-muted)',
            marginLeft: '8px',
            fontFamily: 'var(--font-body)',
          }}>
            USDC
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Win Chance', value: `${(userPosition.sharePercent ?? 0).toFixed(2)}%`, color: 'var(--rose)' },
          { label: 'Blend APY', value: `${usdcApy.toFixed(1)}%`, color: 'var(--gold)' },
          { label: 'Est. Weekly Yield', value: `$${weeklyYield.toFixed(4)}`, color: 'var(--text-primary)' },
          { label: 'Est. Yearly Yield', value: `$${yearlyYield.toFixed(2)}`, color: 'var(--text-primary)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={statBoxStyle}>
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              marginBottom: '5px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              {label}
            </div>
            <div style={{
              fontSize: '1.05rem',
              color,
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Insight callout */}
      {deposited > 0 && (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(232,160,180,0.04)',
          border: '1px solid rgba(232,160,180,0.12)',
          borderRadius: '12px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.6,
        }}>
          💡 At {usdcApy.toFixed(1)}% APY, your ${deposited.toFixed(2)} generates{' '}
          <span style={{ color: 'var(--rose)' }}>${weeklyYield.toFixed(4)} per week</span> in yield —
          all contributed to the prize pool.
        </div>
      )}
    </div>
  );
}
