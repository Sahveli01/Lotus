'use client';
import { useState, useEffect, ReactNode } from 'react';
import {
  Asset,
  TransactionBuilder,
  Operation,
  Horizon,
  BASE_FEE,
  Networks,
} from '@stellar/stellar-sdk';
import { useWallet } from '@/hooks/useWallet';
import { USDC_ISSUER, ACTIVE_NETWORK, ACTIVE_CONTRACTS, IS_TESTNET } from '@/constants';
import { checkUsdcTrustline } from '@/lib/stellar';

type CheckState = 'checking' | 'no-trustline' | 'has-trustline' | 'adding' | 'trustline-verified';

async function buildChangeTrustXdr(publicKey: string): Promise<string> {
  const server = new Horizon.Server(ACTIVE_NETWORK.HORIZON_URL);
  const account = await server.loadAccount(publicKey);
  const asset = new Asset('USDC', USDC_ISSUER);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: IS_TESTNET ? Networks.TESTNET : Networks.PUBLIC,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(30)
    .build();
  return tx.toXDR();
}

async function submitClassicTx(signedXdr: string): Promise<void> {
  const resp = await fetch(`${ACTIVE_NETWORK.HORIZON_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tx=${encodeURIComponent(signedXdr)}`,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as {
      extras?: { result_codes?: { transaction?: string } };
    };
    throw new Error(err?.extras?.result_codes?.transaction ?? `HTTP ${resp.status}`);
  }
}

interface TrustlineGuardProps {
  children: ReactNode;
}

export function TrustlineGuard({ children }: TrustlineGuardProps) {
  const { isConnected, publicKey, signTransaction } = useWallet();
  const [state, setState] = useState<CheckState>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConnected || !publicKey) {
      setState('checking');
      return;
    }
    setState('checking');
    checkUsdcTrustline(publicKey)
      .then(has => {
        console.log('[TrustlineGuard] trustline check result:', has);
        setState(has ? 'has-trustline' : 'no-trustline');
      })
      .catch(err => {
        console.error('[TrustlineGuard] trustline check failed:', err);
        // If the check throws, assume no trustline so the user can set one up
        setState('no-trustline');
      });
  }, [isConnected, publicKey]);

  // Not connected → let DepositForm handle the connect prompt
  if (!isConnected) return <>{children}</>;

  if (state === 'checking') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--gold)',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
        }}>
          Checking USDC trustline…
        </p>
      </div>
    );
  }

  if (state === 'has-trustline') return <>{children}</>;

  // Trustline just successfully added — show confirmation before revealing form
  if (state === 'trustline-verified') {
    return (
      <div style={{ padding: '4px 0' }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: '1.4rem',
            color: '#4ade80',
          }}>
            ✓
          </div>
        </div>

        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          fontWeight: 400,
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: '10px',
        }}>
          Trustline Set Up!
        </h3>

        <p style={{
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.7,
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          Your account now accepts USDC ({USDC_ISSUER.slice(0, 8)}…{USDC_ISSUER.slice(-6)}).
          {IS_TESTNET && ' You need testnet USDC before you can deposit.'}
        </p>

        {IS_TESTNET && (
          <div style={{
            background: 'var(--bg-deep)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '20px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              How to get testnet USDC
            </strong>
            <ol style={{ margin: 0, paddingLeft: '18px' }}>
              <li>Open{' '}
                <a
                  href="https://laboratory.stellar.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--gold)', textDecoration: 'none' }}
                >
                  Stellar Lab ↗
                </a>
                {' '}→ Fund Account (get XLM first)</li>
              <li>Use a testnet DEX or send USDC from another testnet account</li>
              <li>Asset code: <code style={{ fontFamily: 'monospace' }}>USDC</code>,{' '}
                issuer: <code style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {USDC_ISSUER.slice(0, 8)}…{USDC_ISSUER.slice(-6)}
                </code>
              </li>
            </ol>
          </div>
        )}

        <button
          onClick={() => setState('has-trustline')}
          className="btn-primary"
          style={{ width: '100%', padding: '13px' }}
        >
          Continue to Deposit →
        </button>
      </div>
    );
  }

  // No trustline — show setup screen
  const handleAddTrustline = async () => {
    if (!publicKey) return;
    setState('adding');
    setError('');
    try {
      const xdr = await buildChangeTrustXdr(publicKey);
      const signedXdr = await signTransaction(xdr);
      await submitClassicTx(signedXdr);

      // Poll Horizon briefly to confirm the trustline is live
      let verified = false;
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 2000));
        verified = await checkUsdcTrustline(publicKey);
        if (verified) break;
      }

      if (verified) {
        setState('trustline-verified');
      } else {
        setError('Transaction submitted but not yet confirmed. Please wait and refresh.');
        setState('no-trustline');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add trustline');
      setState('no-trustline');
    }
  };

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Icon */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(244,169,59,0.1)',
          border: '1px solid rgba(244,169,59,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          fontSize: '1.4rem',
        }}>
          ◈
        </div>
      </div>

      {/* Heading */}
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.2rem',
        fontWeight: 400,
        color: 'var(--text-primary)',
        textAlign: 'center',
        marginBottom: '10px',
      }}>
        USDC Trustline Required
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.7,
        textAlign: 'center',
        marginBottom: '8px',
      }}>
        Your Stellar account needs a USDC trustline before depositing.
        This is a one-time setup.
      </p>

      {/* Asset info */}
      <div style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '12px 14px',
        marginBottom: '20px',
        fontFamily: 'var(--font-body)',
        fontSize: '0.75rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Asset</span>
          <span style={{ color: 'var(--text-secondary)' }}>USDC</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Issuer</span>
          <span style={{ color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {USDC_ISSUER.slice(0, 8)}…{USDC_ISSUER.slice(-6)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>SAC</span>
          <span style={{ color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {ACTIVE_CONTRACTS.USDC.slice(0, 8)}…{ACTIVE_CONTRACTS.USDC.slice(-6)}
          </span>
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={handleAddTrustline}
        disabled={state === 'adding'}
        className="btn-primary"
        style={{ width: '100%', padding: '13px' }}
      >
        {state === 'adding' ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              border: '2px solid rgba(5,10,20,0.3)',
              borderTopColor: '#050a14',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Adding Trustline…
          </span>
        ) : 'Add USDC Trustline'}
      </button>

      {/* Error message */}
      {error && (
        <p style={{
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#f87171',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.5,
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
