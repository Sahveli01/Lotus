'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';

function LotusIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 35C20 35 8 28 8 18C8 13 13 8 20 8C27 8 32 13 32 18C32 28 20 35 20 35Z"
        fill="rgba(244,169,59,0.2)" stroke="#f4a93b" strokeWidth="1.5" />
      <path d="M20 35C20 35 4 24 4 14C4 9 9 5 14 7C17 8 20 11 20 11C20 11 23 8 26 7C31 5 36 9 36 14C36 24 20 35 20 35Z"
        fill="rgba(232,160,180,0.15)" stroke="rgba(232,160,180,0.6)" strokeWidth="1" />
      <circle cx="20" cy="20" r="3" fill="var(--gold)" opacity="0.8" />
    </svg>
  );
}

const navLinkBase: React.CSSProperties = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-body)',
  fontWeight: '400',
  transition: 'color 0.2s',
};

function NavA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={navLinkBase}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      {children}
    </a>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={navLinkBase}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const { isConnected, publicKey, usdcBalance, connect, disconnect } = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await connect();
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  const shortAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  const usdcDisplay = usdcBalance > 0n
    ? `${(Number(usdcBalance) / 1e7).toFixed(2)} USDC`
    : null;

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(5, 10, 20, 0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(244, 169, 59, 0.1)' : '1px solid transparent',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <LotusIcon size={28} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: '500',
          color: 'var(--gold-light)',
          letterSpacing: '0.05em',
        }}>
          LOTUS
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <NavA href="#how-it-works">How It Works</NavA>
        <NavA href="#stats">Stats</NavA>
        <NavLink href="/pool">Prize Pool</NavLink>
        <NavLink href="/dashboard">Dashboard</NavLink>
      </nav>

      {/* Wallet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isConnected && shortAddress ? (
          <>
            {usdcDisplay && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                {usdcDisplay}
              </span>
            )}
            <button
              onClick={disconnect}
              style={{
                background: 'rgba(244, 169, 59, 0.1)',
                border: '1px solid var(--border-hover)',
                borderRadius: '10px',
                padding: '8px 16px',
                color: 'var(--gold)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              {shortAddress}
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.9rem' }}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </header>
  );
}
