'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useBlend } from '@/hooks/useBlend';

// ── Lotus SVG ──────────────────────────────────────────────────────────────

function LotusHero() {
  return (
    <svg
      width="260"
      height="260"
      viewBox="0 0 280 280"
      fill="none"
      style={{ filter: 'drop-shadow(0 0 40px rgba(244,169,59,0.3))' }}
    >
      {/* Outer petals */}
      {([0, 45, 90, 135, 180, 225, 270, 315] as number[]).map((angle, i) => (
        <g key={i} style={{ transformOrigin: '140px 140px', transform: `rotate(${angle}deg)` }}>
          <ellipse cx="140" cy="80" rx="18" ry="50"
            fill={`rgba(244,169,59,${0.07 + i * 0.005})`}
            stroke="rgba(244,169,59,0.25)" strokeWidth="0.5" />
        </g>
      ))}
      {/* Mid petals */}
      {([22, 67, 112, 157, 202, 247, 292, 337] as number[]).map((angle, i) => (
        <g key={i} style={{ transformOrigin: '140px 140px', transform: `rotate(${angle}deg)` }}>
          <ellipse cx="140" cy="95" rx="14" ry="38"
            fill={`rgba(232,160,180,${0.10 + i * 0.005})`}
            stroke="rgba(232,160,180,0.2)" strokeWidth="0.5" />
        </g>
      ))}
      {/* Inner petals */}
      {([0, 60, 120, 180, 240, 300] as number[]).map((angle, i) => (
        <g key={i} style={{ transformOrigin: '140px 140px', transform: `rotate(${angle}deg)` }}>
          <ellipse cx="140" cy="110" rx="10" ry="26"
            fill="rgba(252,208,116,0.18)"
            stroke="rgba(252,208,116,0.35)" strokeWidth="0.8" />
        </g>
      ))}
      {/* Center */}
      <circle cx="140" cy="140" r="22" fill="rgba(244,169,59,0.18)" stroke="rgba(244,169,59,0.5)" strokeWidth="1.5" />
      <circle cx="140" cy="140" r="10" fill="rgba(244,169,59,0.55)" />
      <circle cx="140" cy="140" r="4" fill="#fcd074" />
      {/* Ripples */}
      <circle cx="140" cy="140" r="50" fill="none" stroke="rgba(244,169,59,0.07)" strokeWidth="1" />
      <circle cx="140" cy="140" r="75" fill="none" stroke="rgba(244,169,59,0.04)" strokeWidth="1" />
      <circle cx="140" cy="140" r="100" fill="none" stroke="rgba(244,169,59,0.02)" strokeWidth="1" />
    </svg>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────

function Counter({ end, prefix = '', suffix = '', duration = 2000 }: {
  end: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || end === 0) return;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return (
    <div ref={ref} className="stat-number">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

// ── How it works step ──────────────────────────────────────────────────────

function Step({ number, title, desc, icon }: {
  number: string; title: string; desc: string; icon: string;
}) {
  return (
    <div className="card" style={{ padding: '32px', textAlign: 'center', flex: '1 1 200px', minWidth: '200px', maxWidth: '260px' }}>
      <div style={{
        width: '52px', height: '52px',
        borderRadius: '50%',
        background: 'rgba(244,169,59,0.08)',
        border: '1px solid rgba(244,169,59,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: '1.4rem',
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.7rem',
        color: 'var(--gold)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        Step {number}
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.35rem',
        fontWeight: '500',
        color: 'var(--text-primary)',
        marginBottom: '10px',
        lineHeight: '1.2',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.65',
        fontFamily: 'var(--font-body)',
      }}>
        {desc}
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { usdcApy } = useBlend();

  return (
    <main className="noise-overlay" style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Header />

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', top: '18%', left: '8%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(244,169,59,0.055) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '18%', right: '8%',
          width: '320px', height: '320px',
          background: 'radial-gradient(circle, rgba(232,160,180,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="animate-float" style={{ marginBottom: '36px' }}>
          <LotusHero />
        </div>

        {/* Live badge */}
        <div className="animate-fade-in-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: 'rgba(244,169,59,0.07)',
          border: '1px solid rgba(244,169,59,0.18)',
          borderRadius: '100px',
          padding: '6px 16px',
          marginBottom: '24px',
          fontSize: '0.78rem',
          color: 'var(--gold)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.06em',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          Live on Stellar Testnet
        </div>

        <h1
          className="animate-fade-in-up-delay gradient-gold"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: '300',
            letterSpacing: '-0.02em',
            lineHeight: '1.05',
            marginBottom: '24px',
            maxWidth: '880px',
          }}
        >
          Save without risk.<br />
          Win without trying.
        </h1>

        <p
          className="animate-fade-in-up-delay-2"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            maxWidth: '540px',
            lineHeight: '1.75',
            marginBottom: '48px',
            fontFamily: 'var(--font-body)',
            fontWeight: '300',
          }}
        >
          Deposit USDC, earn yield through Blend Protocol, and enter weekly prize draws.
          Your principal is{' '}
          <span style={{ color: 'var(--gold)', fontWeight: '500' }}>always guaranteed</span>.
        </p>

        <div
          className="animate-fade-in-up-delay-2"
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Link href="/pool">
            <button className="btn-primary" style={{ fontSize: '1rem', padding: '16px 44px' }}>
              Start Saving →
            </button>
          </Link>
          <a href="#how-it-works">
            <button className="btn-secondary" style={{ fontSize: '1rem', padding: '16px 44px' }}>
              How It Works
            </button>
          </a>
        </div>

        {/* Trust badges */}
        <div style={{
          marginTop: '60px',
          display: 'flex', gap: '28px', flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {['Built on Stellar', 'Powered by Blend', 'Non-custodial', 'Open Source'].map(badge => (
            <div key={badge} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.78rem', color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
            }}>
              <span style={{ color: 'var(--gold)', fontSize: '0.65rem' }}>◆</span>
              {badge}
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ margin: '0 48px' }} />

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <section id="stats" style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{
            color: 'var(--gold)', fontSize: '0.75rem',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: '12px', fontFamily: 'var(--font-body)',
          }}>
            Protocol Stats
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '400',
            color: 'var(--text-primary)',
          }}>
            Numbers don&apos;t lie
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {([
            { label: 'Total Value Deposited', end: 0, prefix: '$', suffix: '' },
            { label: 'Prize Pool (This Week)', end: 0, prefix: '$', suffix: '' },
            { label: 'Blend Supply APY', end: usdcApy, prefix: '', suffix: '%' },
            { label: 'Winners So Far', end: 0, prefix: '', suffix: '' },
          ] as { label: string; end: number; prefix: string; suffix: string }[]).map(({ label, end, prefix, suffix }) => (
            <div key={label} className="card" style={{ padding: '32px 36px', textAlign: 'center', flex: '1 1 180px' }}>
              <Counter end={end} prefix={prefix} suffix={suffix} />
              <div style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginTop: '10px',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.02em',
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ margin: '0 48px' }} />

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{
            color: 'var(--gold)', fontSize: '0.75rem',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: '12px', fontFamily: 'var(--font-body)',
          }}>
            Simple by design
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '400',
            color: 'var(--text-primary)',
          }}>
            How LOTUS works
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Step number="01" icon="💰" title="Deposit USDC"
            desc="Connect your Freighter wallet and deposit any amount of USDC. Even $1 gets you a ticket." />
          <Step number="02" icon="🌱" title="Earn Yield"
            desc="Your USDC earns interest through Blend Protocol — Stellar's leading lending market." />
          <Step number="03" icon="🎰" title="Weekly Draw"
            desc="Every week, one depositor wins the entire prize pool. More deposited = more tickets." />
          <Step number="04" icon="✅" title="Always Safe"
            desc="Win or lose, your principal is safe. Withdraw anytime, no lock-up periods." />
        </div>

        {/* Flow diagram */}
        <div style={{
          marginTop: '56px',
          padding: '36px',
          background: 'rgba(244,169,59,0.025)',
          border: '1px solid rgba(244,169,59,0.1)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          fontFamily: 'var(--font-body)',
        }}>
          {([
            { label: 'You deposit', value: '100 USDC', color: 'var(--gold)' },
            '→',
            { label: 'Blend earns', value: '~$0.16/week', color: 'var(--rose)' },
            '→',
            { label: 'Prize pool', value: 'Grows weekly', color: 'var(--gold-light)' },
            '→',
            { label: 'You could win', value: 'Everything!', color: '#4ade80' },
          ] as ({ label: string; value: string; color: string } | string)[]).map((item, i) =>
            typeof item === 'string' ? (
              <span key={i} style={{ color: 'var(--text-muted)', fontSize: '1.4rem' }}>{item}</span>
            ) : (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '500', color: item.color }}>
                  {item.value}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <div className="divider" style={{ margin: '0 48px' }} />

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 48px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(244,169,59,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="animate-float" style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '2.8rem' }}>🪷</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
          fontWeight: '300',
          color: 'var(--text-primary)',
          marginBottom: '18px',
          lineHeight: '1.1',
          position: 'relative',
        }}>
          Your savings deserve<br />
          <span className="gradient-gold">a chance to bloom.</span>
        </h2>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          marginBottom: '40px',
          fontFamily: 'var(--font-body)',
          fontWeight: '300',
          position: 'relative',
        }}>
          Join the first no-loss savings protocol on Stellar.
        </p>
        <Link href="/pool" style={{ position: 'relative' }}>
          <button className="btn-primary animate-pulse-glow" style={{ fontSize: '1.05rem', padding: '18px 52px' }}>
            Start Saving Now
          </button>
        </Link>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(244,169,59,0.1)',
        padding: '36px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--gold)' }}>LOTUS</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
            © 2026 · Built on Stellar
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            {
              label: 'Contract',
              href: `https://stellar.expert/explorer/testnet/contract/CDSMKU7LVWNDTEM3QNK2WGQNP5TEXRMRQCBTUQUHZ6EY77GU6EX4OWMU`,
            },
            { label: 'GitHub', href: '#' },
            { label: 'Docs', href: '#' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}
