'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  loading?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: "Hi! I'm your AI marketing assistant 👋\n\nI can help with brand strategy, campaigns, personas, and content. Ask me anything!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const quickSuggestions = [
    'How do I create a campaign?',
    'What is Brand DNA?',
    'Help me with personas',
    'How do I use the canvas?',
  ];

  useEffect(() => {
    const token = localStorage.getItem('dma_token');
    const userData = localStorage.getItem('dma_user');
    
    if (!token || !userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/brand-dna`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 404) {
          router.push('/onboarding');
        }
      })
      .catch(err => {
        console.error('Failed to retrieve Brand DNA on layout init:', err);
      });
    }
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleLogout = () => {
    localStorage.removeItem('dma_token');
    localStorage.removeItem('dma_user');
    router.push('/login');
  };

  const sendMessage = async (question?: string) => {
    const text = (question || chatInput).trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', text };
    const loadingMsg: ChatMessage = { role: 'assistant', text: '', loading: true };

    setChatMessages(prev => [...prev, userMsg, loadingMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('dma_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/content/assist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ question: text })
        }
      );
      const data = await res.json();
      const answer = data.answer || 'Sorry, I could not process that. Please try again.';
      setChatMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: answer }]);
    } catch {
      setChatMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: 'Connection error. Please check the server is running.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Render simple markdown: **bold**, bullet •
  const renderMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <div key={i} style={{ marginBottom: line === '' ? '8px' : '2px', lineHeight: 1.5 }}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
          )}
        </div>
      );
    });
  };

  if (!user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-inter)' }}>Loading Session...</div>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'var(--font-inter), sans-serif'
    }}>
      {/* Top Mobile Bar (visible < 768px) */}
      <header className="mobile-header" style={{
        display: 'none',
        height: '56px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxSizing: 'border-box'
      }}>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'var(--foreground)',
            padding: '4px'
          }}
        >
          ☰
        </button>
        <span style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>Marketing Assistant</span>
        <div style={{ width: '32px' }} />
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Navigation Sidebar */}
        <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 0.25s ease-in-out',
          zIndex: 45,
          flexShrink: 0
        }}>
          <div>
            {/* Sidebar Branding */}
            <div className="sidebar-brand" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <span style={{
                fontFamily: 'var(--font-bricolage), sans-serif',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--primary)'
              }}>
                Marketing Assistant
              </span>
            </div>

            {/* Navigation Links */}
            <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { href: '/dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>, label: 'Dashboard' },
                { href: '/dashboard/brand-dna', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 10.5C4.5 10.5 7.5 4.5 12 4.5C16.5 4.5 19.5 10.5 19.5 10.5C19.5 10.5 16.5 16.5 12 16.5C7.5 16.5 4.5 10.5 4.5 10.5Z" /><path d="M12 4.5V16.5" /><circle cx="12" cy="10.5" r="2" /></svg>, label: 'Brand DNA' },
                { href: '/dashboard/editor', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>, label: 'Content Editor' },
                { href: '/dashboard/prompts', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>, label: 'Prompt Library' },
                { href: '/dashboard/personas', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'Segment Personas' },
                { href: '/dashboard/campaigns', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, label: 'Campaign Simulator' },
                { href: '/canvas', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, label: 'Design Canvas Studio' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  color: 'var(--foreground-muted)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  transition: 'background-color 0.15s, color 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary-subtle)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--foreground-muted)'; }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <span className="sidebar-text">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* User Section */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
            <div className="sidebar-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {(user?.email || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div className="sidebar-text" style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', textTransform: 'capitalize' }}>{(user?.phase || 'phase_1').replace('_', ' ')}</div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '7px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 500,
                color: 'var(--foreground-muted)',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile backdrop overlay */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              zIndex: 42,
              backdropFilter: 'blur(2px)'
            }}
          />
        )}

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflowY: 'auto'
        }}>
          <div style={{
            flex: 1,
            padding: 'clamp(16px, 3vw, 32px)',
            maxWidth: '960px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}>
            {children}
          </div>
        </div>

        {/* Right Side Panel — System Assistant (>= 1280px) */}
        <aside className="right-panel" style={{
          width: '320px',
          borderLeft: '1px solid var(--border)',
          backgroundColor: '#ffffff',
          display: 'none',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #7C3AED, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}>✨</div>
            <div>
              <div style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>AI Assistant</div>
              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>● Online</div>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.role === 'user' ? 'var(--primary)' : '#f1f5f9',
                  color: msg.role === 'user' ? '#ffffff' : 'var(--foreground)',
                  fontSize: '0.82rem',
                  lineHeight: 1.55,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                  {msg.loading ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '2px 0' }}>
                      {[0, 1, 2].map(d => (
                        <div key={d} style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          backgroundColor: 'var(--foreground-muted)',
                          animation: `dotBounce 1.2s ease-in-out ${d * 0.2}s infinite`
                        }} />
                      ))}
                    </div>
                  ) : (
                    renderMessage(msg.text)
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions (only shown before first user message) */}
          {chatMessages.filter(m => m.role === 'user').length === 0 && (
            <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickSuggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#f8fafc',
                    fontSize: '0.72rem',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'border-color 0.15s, background-color 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--primary-subtle)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = 'var(--foreground)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end'
          }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask me anything..."
              rows={1}
              disabled={chatLoading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-inter), sans-serif',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.4,
                backgroundColor: chatLoading ? '#f8fafc' : '#ffffff',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: chatLoading || !chatInput.trim() ? '#e2e8f0' : 'var(--primary)',
                color: chatLoading || !chatInput.trim() ? 'var(--foreground-muted)' : '#ffffff',
                cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0,
                transition: 'background-color 0.15s'
              }}
            >
              ↑
            </button>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        /* Desktop Layout (>= 1024px) */
        .sidebar {
          width: 220px;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }
        
        /* Tablet Layout (768px - 1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .sidebar {
            width: 56px;
          }
          .sidebar-text, .sidebar-brand {
            display: none !important;
          }
          .sidebar-profile {
            justify-content: center;
          }
        }

        /* Mobile Layout (< 768px) */
        @media (max-width: 767px) {
          .mobile-header {
            display: flex !important;
          }
          .sidebar {
            position: fixed;
            top: 56px;
            bottom: 0;
            left: 0;
            width: 260px;
            transform: translateX(-100%);
            overflow-y: auto;
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }

        /* Right Panel Layout (>= 1280px) */
        @media (min-width: 1280px) {
          .right-panel {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
