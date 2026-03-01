'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { PrizePoolCard } from '@/components/pool/PrizePool';
import { DepositForm } from '@/components/deposit/DepositForm';
import { WithdrawForm } from '@/components/deposit/WithdrawForm';
import { TrustlineGuard } from '@/components/deposit/TrustlineGuard';

type Tab = 'deposit' | 'withdraw';

function PoolPageInner() {
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get('tab') as Tab | null) ?? 'deposit';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  return (
    <div className="noise-overlay" style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Header />

      <main style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '100px 24px 80px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '28px',
        alignItems: 'flex-start',
      }}>
        {/* Left: Prize pool */}
        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--gold)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Weekly Prize Draw
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: '300',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}>
              No-Loss Savings Pool
            </h1>
            <p style={{
              marginTop: '10px',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.7,
              maxWidth: '480px',
            }}>
              Deposit USDC and earn a chance to win the weekly yield prize.
              Your principal is always safe — withdraw any time.
            </p>
          </div>

          <PrizePoolCard />
        </div>

        {/* Right: Deposit / Withdraw */}
        <div style={{ flex: '0 0 400px', minWidth: '320px' }}>
          <div className="card" style={{ padding: '28px' }}>
            {/* Tab switcher */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-deep)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '28px',
            }}>
              {(['deposit', 'withdraw'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    background: activeTab === tab ? 'rgba(244,169,59,0.14)' : 'transparent',
                    color: activeTab === tab ? 'var(--gold)' : 'var(--text-muted)',
                  }}
                >
                  {tab === 'deposit' ? 'Deposit' : 'Withdraw'}
                </button>
              ))}
            </div>

            {activeTab === 'deposit' ? (
              <TrustlineGuard>
                <DepositForm />
              </TrustlineGuard>
            ) : <WithdrawForm />}
          </div>

          {/* Info card */}
          <div style={{
            marginTop: '16px',
            padding: '16px 20px',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}>
            <p style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.7,
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>How it works:</span>
              {' '}Your USDC earns yield on Blend. Every week, one depositor wins the
              accumulated yield as a prize. Everyone else keeps their full principal.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PoolPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg-deep)', minHeight: '100vh' }} />}>
      <PoolPageInner />
    </Suspense>
  );
}
