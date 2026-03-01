'use client';
import { useState, useEffect } from 'react';

interface Props {
  targetTimestamp: number; // unix seconds
  size?: 'sm' | 'md';
}

function padTwo(n: number) {
  return String(n).padStart(2, '0');
}

function TimeUnit({
  value,
  label,
  size = 'md',
}: {
  value: string;
  label: string;
  size?: 'sm' | 'md';
}) {
  const isSm = size === 'sm';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border)',
        borderRadius: isSm ? '8px' : '10px',
        padding: isSm ? '8px 10px' : '12px 16px',
        minWidth: isSm ? '44px' : '64px',
        fontFamily: 'var(--font-display)',
        fontSize: isSm ? '1.4rem' : '2rem',
        fontWeight: '300',
        color: 'var(--gold-light)',
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}>
        {value}
      </div>
      <p style={{
        marginTop: isSm ? '4px' : '6px',
        fontSize: isSm ? '0.62rem' : '0.7rem',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        {label}
      </p>
    </div>
  );
}

export function CountdownTimer({ targetTimestamp, size = 'md' }: Props) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = targetTimestamp - Math.floor(Date.now() / 1000);
      setRemaining(Math.max(0, diff));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  if (remaining === 0) {
    return (
      <p style={{
        color: 'var(--rose)',
        fontFamily: 'var(--font-body)',
        fontSize: size === 'sm' ? '0.85rem' : '0.95rem',
        textAlign: 'center',
      }}>
        Draw pending…
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: size === 'sm' ? '6px' : '8px', justifyContent: 'center' }}>
      {days > 0 && <TimeUnit value={String(days)} label="days" size={size} />}
      <TimeUnit value={padTwo(hours)} label="hrs" size={size} />
      <TimeUnit value={padTwo(minutes)} label="min" size={size} />
      <TimeUnit value={padTwo(seconds)} label="sec" size={size} />
    </div>
  );
}
