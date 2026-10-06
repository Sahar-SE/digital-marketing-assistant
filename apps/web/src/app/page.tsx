'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'firewall' | 'handshake' | 'canvas'>('firewall');

  return (
    <div style={{
      backgroundColor: '#F8FAFC',
      color: '#0F172A',
      minHeight: '100vh',
      fontFamily: 'var(--font-inter), sans-serif',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Glowing Ambient Blobs */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        top: '-100px',
        left: '-150px',
        borderRadius: '50%',
        backgroundColor: '#7C3AED',
        opacity: 0.06,
        filter: 'blur(120px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        top: '300px',
        right: '-200px',
        borderRadius: '50%',
        backgroundColor: '#EC4899',
        opacity: 0.05,
        filter: 'blur(140px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Header Navigation */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.8rem' }}>🧬</span>
          <span style={{
            fontFamily: 'var(--font-bricolage), sans-serif',
            fontWeight: 700,
            fontSize: '1.5rem',
            background: 'linear-gradient(to right, #7C3AED, #EC4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            DMA.ai
          </span>
        </div>

        <nav className="desktop-nav" style={{ display: 'flex', gap: '32px', fontSize: '0.9rem', fontWeight: 500 }}>
          <a href="#features" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="#workflow" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>Mind Meld</a>
          <a href="#firewall" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>Compliance</a>
          <a href="#canvas" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>Design Canvas</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/login" style={{
            color: '#475569',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            transition: 'background-color 0.2s'
          }}>
            Log In
          </Link>
          <Link href="/signup" style={{
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
            transition: 'opacity 0.2s'
          }}>
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        zIndex: 5,
        padding: '100px 20px 80px 20px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Top Info Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#EDE9FE',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          padding: '6px 14px',
          borderRadius: '30px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#6D28D9',
          marginBottom: '28px'
        }}>
          <span>✨</span> Autonomous Brand DNA Copilot Engine v1.2
        </div>

        {/* Display Title */}
        <h1 style={{
          fontFamily: 'var(--font-bricolage), sans-serif',
          fontSize: '4rem',
          fontWeight: 700,
          lineHeight: 1.15,
          color: '#0F172A',
          marginBottom: '20px',
          letterSpacing: '-0.02em'
        }}>
          Your Brand's DNA.<br />
          <span style={{
            background: 'linear-gradient(to right, #7C3AED, #EC4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Autonomous AI Marketing.
          </span>
        </h1>

        {/* Hero description */}
        <p style={{
          fontSize: '1.2rem',
          color: '#475569',
          lineHeight: 1.6,
          maxWidth: '700px',
          margin: '0 auto 40px auto'
        }}>
          DMA digests your brand identity, scraping websites and social profiles to generate audience-tailored, compliance-checked content campaigns and layered canvas visual designs. Zero manual prompt-crafting required.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/signup" style={{
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '1.05rem',
            fontWeight: 600,
            padding: '14px 28px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
            transition: 'transform 0.15s'
          }}>
            Get Started Free
          </Link>
          <a href="#demo" style={{
            color: '#475569',
            textDecoration: 'none',
            fontSize: '1.05rem',
            fontWeight: 600,
            padding: '14px 28px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            transition: 'background-color 0.2s'
          }}>
            Explore Workflow
          </a>
        </div>
      </section>

      {/* Main Core Features Grid Section */}
      <section id="features" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 40px',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '2.2rem', color: '#0F172A' }}>Engineered for High-Converting Workflows</h2>
          <p style={{ color: '#475569', fontSize: '1rem', marginTop: '8px' }}>Move from ingestion to production designs with built-in ethical safety gates.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
          
          {/* Card 1 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s'
          }} className="feature-card">
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🧬</div>
            <h3 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '12px' }}>Brand DNA Profile</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Onboard via guided questionnaires and scraping crawlers. Automatically models brand category, ethical positioning, and tone descriptors.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s'
          }} className="feature-card">
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🛡️</div>
            <h3 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '12px' }}>Ethical Firewall Audit</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Batched compliance scans auditing originality, bias, hallucination, tone, and data scrubbing. Locks publishing until all flags are resolved.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s'
          }} className="feature-card">
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🗓️</div>
            <h3 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '12px' }}>Campaign Simulator</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Plan multi-platform schedules concurrently. Drag-and-drop posts, trigger platform format translations, and audit entire campaigns in one shot.
            </p>
          </div>

        </div>
      </section>

      {/* Interactive Demonstration Section */}
      <section id="demo" style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        padding: '80px 20px',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '50px', alignItems: 'center' }}>
            
            {/* Left description */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2, color: '#0F172A', marginBottom: '24px' }}>
                Refine, Audit, and Design Visual Layouts.
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div 
                  onClick={() => setActiveTab('firewall')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: activeTab === 'firewall' ? '#EDE9FE' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <h4 style={{ fontWeight: 600, color: activeTab === 'firewall' ? '#5B21B6' : '#0F172A', margin: 0 }}>🛡️ Ethical Firewall Gate</h4>
                  <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '6px', margin: 0 }}>Scans draft versions across plagiarism, gender biases, data cleansing, and brand values before exporting.</p>
                </div>

                <div 
                  onClick={() => setActiveTab('handshake')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: activeTab === 'handshake' ? '#EDE9FE' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <h4 style={{ fontWeight: 600, color: activeTab === 'handshake' ? '#5B21B6' : '#0F172A', margin: 0 }}>🤝 Human-AI Handshake Loop</h4>
                  <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '6px', margin: 0 }}>Annotate any text range directly. Generates smart delta refinements instead of full document regenerations.</p>
                </div>

                <div 
                  onClick={() => setActiveTab('canvas')}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: activeTab === 'canvas' ? '#EDE9FE' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <h4 style={{ fontWeight: 600, color: activeTab === 'canvas' ? '#5B21B6' : '#0F172A', margin: 0 }}>🎨 Product Design Canvas</h4>
                  <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '6px', margin: 0 }}>Creates layout options with abstract graphic backgrounds, independent text layers, and custom typography z-index controls.</p>
                </div>
              </div>
            </div>

            {/* Right: Interactive Viewport Mock Visualizer */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
              padding: '24px',
              height: '380px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {activeTab === 'firewall' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>🛡️ Ethical Firewall Health Audit</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }}>1 Action Needed</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9B2C2C' }}>Plagiarism (Originality) Check</span>
                      <span style={{ fontSize: '0.8rem', color: '#C53030', fontWeight: 600 }}>⚠️ Flagged Copy Match</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                      <span style={{ fontSize: '0.8rem', color: '#166534' }}>Social Bias Scanner</span>
                      <span style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 600 }}>✓ Passed</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                      <span style={{ fontSize: '0.8rem', color: '#166534' }}>PII Data Scrubber</span>
                      <span style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 600 }}>✓ Passed</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>Publish is locked until flagged match is removed.</span>
                    <button disabled style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#E2E8F0', color: '#94A3B8', fontWeight: 600, fontSize: '0.8rem' }}>Publish Export</button>
                  </div>
                </div>
              )}

              {activeTab === 'handshake' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>🤝 Human-AI Refinement Workspace</span>
                    <span style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600 }}>Version 2 Active</span>
                  </div>

                  <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', lineHeight: 1.4, color: '#334155' }}>
                    Introduce EcoApparel's new linen pants program. 
                    <span style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)', borderBottom: '2px solid #7C3AED', padding: '0 2px', color: '#5B21B6' }}>[Day 1 post on Instagram targeting Eco Emma. Slide 1: Catchy headline. Slide 2: Core organic circular details.]</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600 }}>Instruction:</span>
                    <input readOnly type="text" value="Make organic circular details stand out" style={{ flex: 1, background: 'none', border: 'none', color: '#0F172A', fontSize: '0.75rem', outline: 'none' }} />
                    <button style={{ backgroundColor: '#7C3AED', border: 'none', color: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Refine</button>
                  </div>
                </div>
              )}

              {activeTab === 'canvas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>🎨 Product Design Canvas (Instagram Post)</span>
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>1080x1080 Viewport</span>
                  </div>

                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    {/* Mock Layers list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderRight: '1px solid #E2E8F0', paddingRight: '10px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>LAYERS</span>
                      <div style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: '#EDE9FE', border: '1px solid rgba(124, 58, 237, 0.2)', fontSize: '0.7rem', color: '#5B21B6', fontWeight: 600 }}>📝 Headline Text</div>
                      <div style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.7rem', color: '#475569' }}>📝 CTA Text</div>
                      <div style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', fontSize: '0.7rem', color: '#475569' }}>🖼️ BG Gradient</div>
                    </div>

                    {/* Canvas render viewport mock */}
                    <div style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '16px'
                    }}>
                      <div style={{
                        border: '1px dashed #FFFFFF',
                        padding: '4px 8px',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-bricolage)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}>
                        INTRODUCING LINEN
                      </div>
                      <div style={{
                        marginTop: '8px',
                        padding: '2px 6px',
                        backgroundColor: '#FFFFFF',
                        color: '#7C3AED',
                        fontSize: '0.6rem',
                        fontWeight: 700
                      }}>
                        SHOP COLLECTION
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* CTA Foot Section */}
      <section style={{
        padding: '100px 20px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 5
      }}>
        <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: '2.5rem', color: '#0F172A', marginBottom: '16px' }}>Ready to Scale Your Brand's Narrative?</h2>
        <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 32px auto' }}>Join Phase 2 and 3 tiers to unlock campaigns scheduling calendars and canvas layout editors.</p>
        <Link href="/signup" style={{
          backgroundColor: '#7C3AED',
          color: '#FFFFFF',
          textDecoration: 'none',
          fontSize: '1.1rem',
          fontWeight: 600,
          padding: '14px 32px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
          transition: 'transform 0.15s'
        }}>
          Create Your Account Now
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #E2E8F0',
        padding: '40px 20px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#64748B',
        position: 'relative',
        zIndex: 5
      }}>
        <p>© 2026 DMA.ai — Digital Marketing Assistant. All rights reserved. Built with Next.js 14 & Express.</p>
      </footer>
    </div>
  );
}
