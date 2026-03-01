'use client';
import { useState } from 'react';
import { parseUSDC, formatUSDC } from '@/lib/stellar';
import { useLotus } from '@/hooks/useLotus';
import { useWallet } from '@/hooks/useWallet';

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

export function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const { isConnected } = useWallet();
  const { withdraw, txStatus, userPosition, resetStatus } = useLotus();

  const deposited = userPosition.depositedAmount;
  const numAmount = parseFloat(amount) || 0;

  const handleMax = () => {
    if (deposited > 0n) setAmount((Number(deposited) / 1e7).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) return;
    resetStatus();
    await withdraw(parseUSDC(amount));
  };

  if (!isConnected || deposited === 0n) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
          {!isConnected ? 'Connect your wallet to withdraw' : 'You have no active deposit'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Deposited balance */}
      <div style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          Your deposit
        </span>
        <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
          {formatUSDC(deposited)} USDC
        </span>
      </div>

      {/* Amount input */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Amount to withdraw
          </label>
          <button
            type="button"
            onClick={handleMax}
            style={{
              fontSize: '0.78rem',
              color: 'var(--gold)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              padding: 0,
            }}
          >
            MAX
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
          }}>$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            max={Number(deposited) / 1e7}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
      </div>

      {/* Warning */}
      <div style={{
        background: 'rgba(232,160,180,0.05)',
        border: '1px solid rgba(232,160,180,0.15)',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '20px',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--rose-dim)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
          ⚠ Withdrawing forfeits your entry for the current round. Your principal is always returned in full.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={txStatus.status === 'pending' || numAmount <= 0}
        className="btn-secondary"
        style={{ width: '100%', padding: '13px' }}
      >
        {txStatus.status === 'pending' ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{
              width: '14px', height: '14px', borderRadius: '50%',
              border: '2px solid rgba(244,169,59,0.3)',
              borderTopColor: 'var(--gold)',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Withdrawing…
          </span>
        ) : 'Withdraw USDC'}
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
            Withdrawal successful!
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
