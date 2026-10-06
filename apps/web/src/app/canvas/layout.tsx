import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Visual Design Studio | Digital Marketing Assistant',
  description: 'AI-First Brand Design Canvas & Visual Asset Synthesizer',
};

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#090D16',
      color: '#F8FAFC',
      fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0
    }}>
      {children}
    </div>
  );
}
