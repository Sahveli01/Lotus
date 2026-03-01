'use client';
import { useState } from 'react';
import { parseUSDC, formatUSDC } from '@/lib/stellar';
import { useLotus } from '@/hooks/useLotus';
import { useWallet } from '@/hooks/useWallet';
import { LOTUS_CONFIG } from '@/constants';

const QUICK_AMOUNTS = [10, 50, 100, 500];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-deep)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '12px 14px 12px 28px',
  color: 'var(--text-primary)',
  fontSize: '1.1rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 0.2s',
};

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const { isConnected, usdcBalance, connect } = useWallet();
  const { deposit, txStatus, prizePool, resetStatus } = useLotus();

  const numAmount = parseFloat(amount) || 0;

  let amountBigInt = 0n;
  try {
    if (amount.trim() && numAmount > 0) amountBigInt = parseUSDC(amount);
  } catch { /* ignore */ }

  // Bug fix: the old condition `usdcBalance > 0n &&` made the check always false when
  // balance is 0, allowing users with no USDC to submit (which fails on-chain).
  const hasInsufficientBalance = amountBigInt > 0n && amountBigInt > usdcBalance;

  // Estimated win chance if this deposit is added to the pool
  const estimatedWinChance =
    prizePool.totalDeposits > 0n && amountBigInt > 0n
      ? Number((amountBigInt * 10_000n) / (prizePool.totalDeposits + amountBigInt)) / 100
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount < LOTUS_CONFIG.MIN_DEPOSIT_USDC) return;
    resetStatus();
    await deposit(parseUSDC(amount));
  };

  if (!isConnected) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <p style={{
          color: 'var(--text-secondary)',
          marginBottom: '20px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}>
          Connect your wallet to start saving with no loss
        </p>
        <button onClick={connect} className="btn-primary" style={{ padding: '12px 28px' }}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* No USDC notice */}
      {isConnected && usdcBalance === 0n && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          background: 'rgba(251,191,36,0.05)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: '10px',
        }}>
          <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: 0 }}>
            Your wallet shows 0 USDC for this vault. The vault uses USDC issued by{' '}
            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>GBBD47…LFLA5</span>.
            {' '}Use the <strong style={{ color: 'var(--text-secondary)' }}>Add Trustline</strong> button above to set up the correct trustline,
            then fund via{' '}
            <a
              href="https://laboratory.stellar.org/#account-creator?network=test"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--gold)', textDecoration: 'none' }}
            >
              Stellar Lab
            </a>{' '}
            with issuer <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5</span>.
          </p>
        </div>
      )}

      {/* Balance row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          Amount (USDC)
        </label>
        {usdcBalance > 0n && (
          <span
            onClick={() => setAmount((Number(usdcBalance) / 1e7).toFixed(2))}
            style={{ fontSize: '0.78rem', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            Balance: {formatUSDC(usdcBalance)} ↑
          </span>
        )}
      </div>

      {/* Amount input */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <span style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
        }}>$</span>
        <input
          type="number"
          min={LOTUS_CONFIG.MIN_DEPOSIT_USDC}
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Quick amounts */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {QUICK_AMOUNTS.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(String(q))}
            style={{
              flex: 1,
              padding: '6px 0',
              background: amount === String(q) ? 'rgba(244,169,59,0.15)' : 'transparent',
              border: `1px solid ${amount === String(q) ? 'var(--border-hover)' : 'var(--border)'}`,
              borderRadius: '8px',
              color: amount === String(q) ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ${q}
          </button>
        ))}
      </div>

      {/* Win chance preview */}
      {estimatedWinChance > 0 && (
        <div style={{
          background: 'rgba(244,169,59,0.05)',
          border: '1px solid rgba(244,169,59,0.15)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Estimated win chance
          </span>
          <span style={{
            fontSize: '1rem',
            color: 'var(--gold)',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
          }}>
            {estimatedWinChance.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Insufficient balance */}
      {hasInsufficientBalance && (
        <p style={{ color: '#f87171', fontSize: '0.78rem', fontFamily: 'var(--font-body)', marginBottom: '12px', marginTop: '-8px' }}>
          Amount exceeds your USDC balance ({(Number(usdcBalance) / 1e7).toFixed(2)} USDC)
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={txStatus.status === 'pending' || numAmount < LOTUS_CONFIG.MIN_DEPOSIT_USDC || hasInsufficientBalance}
        className="btn-primary"
        style={{ width: '100%', padding: '13px' }}
      >
        {txStatus.status === 'pending' ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{
              width: '14px', height: '14px', borderRadius: '50%',
              border: '2px solid rgba(5,10,20,0.3)',
              borderTopColor: '#050a14',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Depositing…
          </span>
        ) : 'Deposit USDC'}
      </button>

      {/* Success */}
      {txStatus.status === 'success' && txStatus.txHash && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(74,222,128,0.07)',
          border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: '10px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#4ade80', fontSize: '0.85rem', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
            Deposit successful!
          </p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txStatus.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--gold)', fontSize: '0.75rem', fontFamily: 'var(--font-body)', textDecoration: 'none' }}
          >
            View on explorer ↗
          </a>
        </div>
      )}

      {/* Error */}
      {txStatus.status === 'error' && (
        <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.8rem', color: '#f87171', fontFamily: 'var(--font-body)' }}>
          {txStatus.error}
        </p>
      )}
    </form>
  );
}
