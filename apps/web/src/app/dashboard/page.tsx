'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [harvestStatus, setHarvestStatus] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userData = localStorage.getItem('dma_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('dma_token');
    if (!token) return;

    const checkHarvest = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/brand-dna`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data && data.harvestStatus) {
          setHarvestStatus(data.harvestStatus);
        }
      })
      .catch(err => console.error('Error fetching brand-dna status:', err));
    };

    checkHarvest();
    
    // Poll every 3 seconds if pending/processing
    const interval = setInterval(() => {
      checkHarvest();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Handle mock Stripe checkout redirection parameter
  useEffect(() => {
    const mockSuccess = searchParams.get('stripe_mock_success');
    const paramUserId = searchParams.get('user_id');

    if (mockSuccess === 'true' && paramUserId) {
      handleUpgradeMock(paramUserId);
    }
  }, [searchParams]);

  const handleUpgradeMock = async (userId: string) => {
    setUpgradeLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/mock-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetPhase: 'phase_2' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Mock upgrade failed');

      // Update local storage and local state
      const updatedUser = { ...user, phase: data.phase, generationCredits: 9999 };
      localStorage.setItem('dma_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMessage('🎉 Account successfully upgraded to Phase 2 (Unlimited access)!');

      // Remove query parameters from URL
      router.replace('/dashboard');
    } catch (err: any) {
      console.error(err);
      setMessage('Failed to upgrade account via mock checkout');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleConsumeCredit = async () => {
    setCreditsLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('dma_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/consume-credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'CREDITS_EXHAUSTED') {
          throw new Error("You've used all your credits for this month. Upgrade to keep creating.");
        }
        throw new Error(data.error || 'Failed to consume credit');
      }

      if (data.unlimited) {
        setMessage('Credit usage bypassed: You have unlimited generation credits!');
      } else {
        const updatedUser = { ...user, generationCredits: data.remainingCredits };
        localStorage.setItem('dma_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage('Credit debited successfully! 1 generation credit spent.');
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleUpgradeClick = async () => {
    setUpgradeLoading(true);
    try {
      const token = localStorage.getItem('dma_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize checkout');

      // Redirect to Checkout page (which will mock success immediately)
      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      setMessage('Failed to initiate checkout session');
      setUpgradeLoading(false);
    }
  };

  if (!user) return null;

  const isPhase1 = user.phase === 'phase_1';

  return (
    <div>
      <h1 style={{
        fontFamily: 'var(--font-bricolage), sans-serif',
        fontSize: '2rem',
        color: 'var(--foreground)',
        marginBottom: '24px'
      }}>
        Dashboard
      </h1>

      {message && (
        <div style={{
          backgroundColor: message.includes('🎉') || message.includes('successfully') ? '#d1fae5' : '#fef3c7',
          color: message.includes('🎉') || message.includes('successfully') ? '#065f46' : '#92400e',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '0.95rem',
          fontWeight: 500,
          border: '1px solid currentColor'
        }}>
          {message}
        </div>
      )}

      {harvestStatus && (harvestStatus === 'processing' || harvestStatus === 'pending') && (
        <div style={{
          backgroundColor: 'var(--primary-subtle)',
          color: 'var(--primary)',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '0.95rem',
          fontWeight: 500,
          border: '1px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span className="pulse-dot" style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)'
          }}></span>
          <span>Still learning from your content — check back in a few minutes</span>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }
        .pulse-dot {
          animation: pulse 1.5s infinite ease-in-out;
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Profile Card */}
        <div style={{
          padding: '24px',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
            Account Details
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>Email</span>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--foreground)' }}>{user.email}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>Subscription Tier</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: isPhase1 ? 'var(--border)' : 'var(--primary-subtle)',
                  color: isPhase1 ? 'var(--foreground-muted)' : 'var(--primary-subtle-foreground)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {user.phase.toUpperCase().replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Card */}
        <div style={{
          padding: '24px',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              AI Generation Credits
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', marginBottom: '16px' }}>
              {isPhase1 ? 'Debited before every generation call.' : 'Unlimited access enabled.'}
            </p>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px' }}>
              {isPhase1 ? user.generationCredits : '∞'}
              <span style={{ fontSize: '1rem', color: 'var(--foreground-muted)', fontWeight: 500 }}>
                {isPhase1 ? ' / 10 remaining' : ' credits'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleConsumeCredit}
              disabled={creditsLoading}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                color: 'var(--foreground)'
              }}
            >
              {creditsLoading ? 'Processing...' : 'Simulate AI Generation (Spend 1 Credit)'}
            </button>

            {isPhase1 && (
              <button
                onClick={handleUpgradeClick}
                disabled={upgradeLoading}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(124, 58, 237, 0.15)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
              >
                {upgradeLoading ? 'Upgrading...' : 'Upgrade to Phase 2 (Stripe Checkout)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
