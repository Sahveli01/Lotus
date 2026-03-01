'use client';
import type { DrawResult } from '@/types';
import { formatUSDC } from '@/lib/stellar';

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
  draws: DrawResult[];
  userAddress?: string | null;
}

export function RecentDraws({ draws, userAddress }: Props) {
  if (draws.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '14px' }}>📜</div>
        <p style={{
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
        }}>
          No draws yet. Be the first winner!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '28px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          History
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
        }}>
          Recent Draws
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {draws.map((draw, i) => {
          const isUserWinner = !!userAddress &&
            draw.winner.toLowerCase() === userAddress.toLowerCase();

          return (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: isUserWinner ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isUserWinner ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`,
              borderRadius: '12px',
              transition: 'all 0.2s',
            }}>
              {/* Left: avatar + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: isUserWinner ? 'rgba(74,222,128,0.15)' : 'rgba(244,169,59,0.08)',
                  border: `1px solid ${isUserWinner ? 'rgba(74,222,128,0.3)' : 'rgba(244,169,59,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}>
                  {isUserWinner ? '🏆' : '🎯'}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: isUserWinner ? '#4ade80' : 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: '500',
                    marginBottom: '2px',
                  }}>
                    {isUserWinner ? 'You won!' : shortAddress(draw.winner)}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                  }}>
                    Round #{draw.roundNumber} · {timeAgo(draw.timestamp)}
                  </div>
                </div>
              </div>

              {/* Right: prize */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: '1rem',
                  color: isUserWinner ? '#4ade80' : 'var(--gold)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '500',
                }}>
                  ${formatUSDC(draw.prizeAmount)}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                }}>
                  USDC
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
