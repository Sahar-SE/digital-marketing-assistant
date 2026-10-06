'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardCanvasRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/canvas');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
      color: 'var(--foreground-muted)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--primary-subtle)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Redirecting to Fullscreen Canvas Studio...</p>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
