'use client';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { UserStatsCard } from '@/components/dashboard/UserStatsCard';
import { EarningsCalculator } from '@/components/dashboard/EarningsCalculator';
import { RecentDraws } from '@/components/dashboard/RecentDraws';
import { CountdownTimer } from '@/components/pool/CountdownTimer';
import { useWallet } from '@/hooks/useWallet';
import { useLotus } from '@/hooks/useLotus';
import { usePrizePool } from '@/hooks/usePrizePool';

export default function DashboardPage() {
  const { isConnected, publicKey, connect } = useWallet();
  // useLotus() takes no params — it reads useWallet() internally
  const { prizePool, userPosition, isLoadingStats } = useLotus();
  const { draws } = usePrizePool(publicKey);

  const prizeDisplayUSDC = Number(prizePool.currentYield) / 1e7;

  // ── Not connected ───────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
        <Header />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '24px',
          textAlign: 'center',
          padding: '24px',
        }}>
          <div style={{ fontSize: '4rem', animation: 'float 4s ease-in-out infinite' }}>🪷</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '300',
            color: 'var(--text-primary)',
          }}>
            Connect your wallet
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            maxWidth: '400px',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.7,
          }}>
            Connect your Stellar wallet to view your position, track earnings, and manage deposits.
          </p>
          <button onClick={connect} className="btn-primary" style={{ fontSize: '1rem', padding: '16px 40px' }}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // ── Connected ───────────────────────────────────────────────────────────────
  return (
    <div className="noise-overlay" style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Header />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{
            color: 'var(--gold)',
            fontSize: '0.78rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '8px',
            fontFamily: 'var(--font-body)',
          }}>
            Dashboard
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '300',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            Your savings overview
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
          }}>
            Track your position and potential winnings
          </p>
        </div>

        {/* Row 1: user stats + next draw mini card */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>

          {/* User stats — wide */}
          <div style={{ flex: '2 1 300px', minWidth: 0 }}>
            {isLoadingStats ? (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
              }}>
                Loading position…
              </div>
            ) : (
              <UserStatsCard userPosition={userPosition} publicKey={publicKey} />
            )}
          </div>

          {/* Next draw + prize mini card */}
          <div style={{
            flex: '1 0 260px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px',
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}>
                Next Draw
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: '400',
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}>
                Prize Pool
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: '300',
                color: 'var(--gold-light)',
              }}>
                ${prizeDisplayUSDC < 0.01 ? '0.00' : prizeDisplayUSDC.toFixed(2)}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '6px', fontFamily: 'var(--font-body)' }}>
                  USDC
                </span>
              </div>
            </div>

            <CountdownTimer targetTimestamp={prizePool.nextDrawTimestamp} size="sm" />

            <Link href="/pool" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}>
                View Prize Pool →
              </button>
            </Link>
          </div>
        </div>

        {/* Row 2: earnings calculator + quick actions */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>

          {/* Earnings calculator */}
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <EarningsCalculator />
          </div>

          {/* Quick actions */}
          <div style={{
            flex: '0 0 280px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ marginBottom: '4px' }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}>
                Actions
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: '500',
                color: 'var(--text-primary)',
              }}>
                Quick actions
              </h3>
            </div>

            <Link href="/pool" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}>
                + Deposit USDC
              </button>
            </Link>

            <Link href="/pool?tab=withdraw" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}>
                Withdraw
              </button>
            </Link>

            <div className="divider" style={{ margin: '4px 0' }} />

            {/* Mini stats */}
            {[
              {
                label: 'Your tickets',
                value: String(Math.max(0, Math.floor(Number(userPosition.depositedAmount) / 1e7))),
              },
              { label: 'Round', value: `#${prizePool.roundNumber}` },
              { label: 'Total winners', value: String(prizePool.totalWinners) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-body)',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}

            <div className="divider" style={{ margin: '4px 0' }} />

            {/* Explorer link */}
            {publicKey && (
              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-body)',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--gold)';
                  e.currentTarget.style.borderColor = 'rgba(244,169,59,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                View on Stellar Explorer ↗
              </a>
            )}
          </div>
        </div>

        {/* Row 3: recent draws */}
        <RecentDraws draws={draws} userAddress={publicKey} />

      </div>
    </div>
  );
}
