'use client';
import { formatUSDC } from '@/lib/stellar';
import { useLotus } from '@/hooks/useLotus';
import { useBlend } from '@/hooks/useBlend';
import { CountdownTimer } from './CountdownTimer';

export function PrizePoolCard() {
  const { prizePool, userPosition, isLoadingStats } = useLotus();
  const { usdcApy } = useBlend();

  const hasDeposit = userPosition.depositedAmount > 0n;

  return (
    <div>
      {/* Hero: prize amount */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(244,169,59,0.07) 0%, rgba(232,160,180,0.04) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '36px 32px',
        marginBottom: '16px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(244,169,59,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Round badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(244,169,59,0.1)',
          border: '1px solid rgba(244,169,59,0.2)',
          borderRadius: '20px',
          padding: '4px 14px',
          marginBottom: '20px',
        }}>
          <span style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: 'var(--gold)',
            display: 'inline-block',
          }} />
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--gold)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Round #{prizePool.roundNumber}
          </span>
        </div>

        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Current Prize
        </p>

        <div className="stat-number" style={{ marginBottom: '6px' }}>
          {isLoadingStats ? '—' : formatUSDC(prizePool.currentYield)}
          <span style={{
            fontSize: '1.6rem',
            fontWeight: 300,
            marginLeft: '10px',
            color: 'var(--text-secondary)',
          }}>
            USDC
          </span>
        </div>

        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
        }}>
          yield from{' '}
          <span style={{ color: 'var(--text-secondary)' }}>
            {formatUSDC(prizePool.totalDeposits)} USDC
          </span>{' '}
          deposited
        </p>
      </div>

      {/* Countdown */}
      <div className="card" style={{ padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
        <p style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '18px',
        }}>
          Next Draw In
        </p>
        <CountdownTimer targetTimestamp={prizePool.nextDrawTimestamp} />
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {[
          { label: 'Blend APY', value: `${usdcApy.toFixed(1)}%` },
          { label: 'Total Deposits', value: `$${formatUSDC(prizePool.totalDeposits)}` },
          { label: 'Winners', value: String(prizePool.totalWinners) },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <p style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              {label}
            </p>
            <p style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 500,
            }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* User position */}
      {hasDeposit && (
        <div style={{
          background: 'rgba(244,169,59,0.05)',
          border: '1px solid rgba(244,169,59,0.15)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
              Your deposit
            </p>
            <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
              {formatUSDC(userPosition.depositedAmount)} USDC
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
              Win chance
            </p>
            <p style={{ color: 'var(--rose)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
              {userPosition.sharePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Last winner */}
      {prizePool.lastWinner && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Last winner:{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              {prizePool.lastWinner.slice(0, 6)}…{prizePool.lastWinner.slice(-6)}
            </span>
            {' · '}
            <span style={{ color: 'var(--gold)' }}>
              {formatUSDC(prizePool.lastPrize)} USDC
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
