'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingData {
  brandName: string;
  productCategory: string;
  audienceDescription: string;
  toneDescriptors: string;
  styleReferences: string;
  ethicalPositioning: string;
  websiteUrl: string;
  socialUrls: string[];
  competitorLinks: string[];
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    brandName: '',
    productCategory: '',
    audienceDescription: '',
    toneDescriptors: '',
    styleReferences: '',
    ethicalPositioning: '',
    websiteUrl: '',
    socialUrls: [''],
    competitorLinks: [''],
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear validation error when user types
    setValidationError(null);
  }, [step, formData]);

  const stepLabels = [
    'Brand Identity',
    'Product Type',
    'Primary Audience',
    'Brand Tone',
    'Brand Admiration',
    'Biggest Challenge',
    'Resource Harvest'
  ];

  // Helper to get contextual examples based on selected productCategory
  const getContextualExample = (field: keyof OnboardingData) => {
    const category = formData.productCategory.toLowerCase();
    
    if (category.includes('saas') || category.includes('software') || category.includes('tech')) {
      switch (field) {
        case 'audienceDescription':
          return 'e.g., Software developers and engineering managers who need to automate deployments';
        case 'toneDescriptors':
          return 'e.g., sleek, direct, visionary (comma separated)';
        case 'styleReferences':
          return 'e.g., Vercel, Linear, Stripe (comma separated)';
        case 'ethicalPositioning':
          return 'e.g., Explaining technical features without hype or exaggerated metrics';
      }
    } else if (category.includes('fitness') || category.includes('health') || category.includes('wellness')) {
      switch (field) {
        case 'audienceDescription':
          return 'e.g., Overworked professionals who struggle to find 30 minutes to exercise daily';
        case 'toneDescriptors':
          return 'e.g., energetic, supportive, encouraging (comma separated)';
        case 'styleReferences':
          return 'e.g., Nike Run Club, Strava, Peloton (comma separated)';
        case 'ethicalPositioning':
          return 'e.g., Promising sustainable habits rather than overnight flat-belly shortcuts';
      }
    } else if (category.includes('retail') || category.includes('commerce') || category.includes('clothing') || category.includes('store')) {
      switch (field) {
        case 'audienceDescription':
          return 'e.g., Eco-conscious gen-z shoppers seeking ethical street fashion';
        case 'toneDescriptors':
          return 'e.g., bold, authentic, rebellious (comma separated)';
        case 'styleReferences':
          return 'e.g., Patagonia, Reformation, Gymshark (comma separated)';
        case 'ethicalPositioning':
          return 'e.g., Complete transparency about fabric sourcing and sustainable factories';
      }
    }
    
    // Default fallback examples
    switch (field) {
      case 'audienceDescription':
        return 'e.g., Young professionals aged 25-35 looking for a better workspace solution';
      case 'toneDescriptors':
        return 'e.g., friendly, professional, bold (comma separated)';
      case 'styleReferences':
        return 'e.g., Apple, Airbnb (comma separated)';
      case 'ethicalPositioning':
        return 'e.g., Keeping communication honest without clickbait titles';
      default:
        return '';
    }
  };

  const validateCurrentStep = () => {
    if (step === 1 && !formData.brandName.trim()) {
      setValidationError('Brand Name is required so we can identify your company.');
      return false;
    }
    if (step === 2 && !formData.productCategory.trim()) {
      setValidationError('Product Type is required so we can tailor suggestions.');
      return false;
    }
    if (step === 3 && !formData.audienceDescription.trim()) {
      setValidationError('Primary Audience is required to help target your content.');
      return false;
    }
    if (step === 4 && !formData.toneDescriptors.trim()) {
      setValidationError('Brand Tone is required so your copy fits your style.');
      return false;
    }
    if (step === 5 && !formData.styleReferences.trim()) {
      setValidationError('Brand Admiration is required so we understand your visual/copy standards.');
      return false;
    }
    if (step === 6 && !formData.ethicalPositioning.trim()) {
      setValidationError('Biggest Challenge is required so the AI learns what writing pitfalls to avoid.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleAddSocial = () => {
    if (formData.socialUrls.length < 5) {
      setFormData(prev => ({ ...prev, socialUrls: [...prev.socialUrls, ''] }));
    }
  };

  const handleSocialChange = (index: number, value: string) => {
    const updated = [...formData.socialUrls];
    updated[index] = value;
    setFormData(prev => ({ ...prev, socialUrls: updated }));
  };

  const handleAddCompetitor = () => {
    if (formData.competitorLinks.length < 3) {
      setFormData(prev => ({ ...prev, competitorLinks: [...prev.competitorLinks, ''] }));
    }
  };

  const handleCompetitorChange = (index: number, value: string) => {
    const updated = [...formData.competitorLinks];
    updated[index] = value;
    setFormData(prev => ({ ...prev, competitorLinks: updated }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError('File exceeds the maximum size limit of 10MB.');
      return;
    }

    // Validate type: PDF, DOCX, TXT, images
    const validExtensions = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidType) {
      setFileError('Unsupported file format. Please upload PDF, DOCX, TXT, or images (PNG/JPG).');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('dma_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // 1. Submit Brand DNA
      const dnaResponse = await fetch(`${apiUrl}/api/brand-dna`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          brandName: formData.brandName,
          productCategory: formData.productCategory,
          audienceDescription: formData.audienceDescription,
          toneDescriptors: formData.toneDescriptors.split(',').map(s => s.trim()).filter(Boolean),
          styleReferences: formData.styleReferences.split(',').map(s => s.trim()).filter(Boolean),
          ethicalPositioning: formData.ethicalPositioning
        })
      });

      const dnaData = await dnaResponse.json();
      if (!dnaResponse.ok) {
        throw new Error(dnaData.error || 'Failed to save Brand DNA');
      }

      // 2. Submit Harvest Job (Optional Step 7 inputs)
      const hasHarvestInput = formData.websiteUrl || formData.socialUrls.some(Boolean) || formData.competitorLinks.some(Boolean);
      if (hasHarvestInput) {
        await fetch(`${apiUrl}/api/brand-dna/harvest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            websiteUrl: formData.websiteUrl,
            socialUrls: formData.socialUrls.filter(Boolean),
            competitorLinks: formData.competitorLinks.filter(Boolean)
          })
        });
      }

      // Update local storage user profile phase or properties if needed
      const storedUser = localStorage.getItem('dma_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem('dma_user', JSON.stringify({
          ...parsed,
          hasBrandDNA: true
        }));
      }

      // Redirect to Dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setValidationError(err.message || 'An error occurred during onboarding submit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#fbfbfe',
      fontFamily: 'var(--font-inter), sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 8px 30px rgba(124, 58, 237, 0.04)'
      }}>
        {/* Progress Bar & Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{
              fontFamily: 'var(--font-bricolage), sans-serif',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--primary)'
            }}>
              Step {step} of 7 — {stepLabels[step - 1]}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', fontWeight: 500 }}>
              {Math.round(((step - 1) / 6) * 100)}% Complete
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--primary-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${(step / 7) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Wizard Form Panels */}
        <form onSubmit={handleSubmit} style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div>
            {validationError && (
              <div style={{
                backgroundColor: '#fffbeb',
                color: '#b45309',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                marginBottom: '24px',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Step 1: Brand Name */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: 0, color: 'var(--foreground)' }}>
                  What is your brand name?
                </h2>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', margin: 0 }}>
                  This will be used to customize your copy generations and templates.
                </p>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="e.g., ApexFit, AuraSaaS, EcoThread"
                  required
                  autoFocus
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1.05rem',
                    marginTop: '8px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Step 2: Product Category */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: 0, color: 'var(--foreground)' }}>
                  What is your product category?
                </h2>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', margin: 0 }}>
                  Specify the type of products or services you offer (e.g., "B2B Email Marketing SaaS", "Sustainable Fashion Retailer", "Online Yoga Platform").
                </p>
                <input
                  type="text"
                  value={formData.productCategory}
                  onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                  placeholder="e.g., Gym Management SaaS, Hemp Streetwear Store"
                  required
                  autoFocus
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1.05rem',
                    marginTop: '8px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Step 3: Audience Description */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: 0, color: 'var(--foreground)' }}>
                  Who is your primary audience?
                </h2>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', margin: 0 }}>
                  Describe your ideal customer. Be specific about their needs, interests, or demographics.
                </p>
                <textarea
                  value={formData.audienceDescription}
                  onChange={(e) => setFormData({ ...formData, audienceDescription: e.target.value })}
                  placeholder={getContextualExample('audienceDescription')}
                  required
                  autoFocus
                  rows={4}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem',
                    marginTop: '8px',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5
                  }}
                />
              </div>
            )}

            {/* Step 4: Tone Descriptors */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: 0, color: 'var(--foreground)' }}>
                  What is your brand's tone of voice?
                </h2>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', margin: 0 }}>
                  Provide 2-4 keywords that describe how your brand speaks to customers, separated by commas.
                </p>
                <input
                  type="text"
                  value={formData.toneDescriptors}
                  onChange={(e) => setFormData({ ...formData, toneDescriptors: e.target.value })}
                  placeholder={getContextualExample('toneDescriptors')}
                  required
                  autoFocus
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1.05rem',
                    marginTop: '8px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Step 5: Style References */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: 0, color: 'var(--foreground)' }}>
                  Which brands do you admire?
                </h2>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', margin: 0 }}>
                  List 2-3 companies whose style, messaging, or aesthetic you admire, separated by commas. We use this as references.
                </p>
                <input
                  type="text"
                  value={formData.styleReferences}
                  onChange={(e) => setFormData({ ...formData, styleReferences: e.target.value })}
                  placeholder={getContextualExample('styleReferences')}
                  required
                  autoFocus
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1.05rem',
                    marginTop: '8px',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Step 6: Biggest Challenge */}
            {step === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: 0, color: 'var(--foreground)' }}>
                  What is your biggest marketing challenge?
                </h2>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', margin: 0 }}>
                  Detail what you find hardest to get right in copy (e.g. avoiding clickbait, simplifying tech, sounding authentic, creating hooks).
                </p>
                <textarea
                  value={formData.ethicalPositioning}
                  onChange={(e) => setFormData({ ...formData, ethicalPositioning: e.target.value })}
                  placeholder={getContextualExample('ethicalPositioning')}
                  required
                  autoFocus
                  rows={4}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '1rem',
                    marginTop: '8px',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5
                  }}
                />
              </div>
            )}

            {/* Step 7: Resource Harvest */}
            {step === 7 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontSize: '1.75rem', margin: 0, color: 'var(--foreground)' }}>
                    Share existing resources (Optional)
                  </h2>
                  <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', marginTop: '6px', marginBottom: '16px' }}>
                    Share your website and social links. The assistant will parse them to learn your brand patterns automatically.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Website URL</label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://mybrand.com"
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Social Media URLs (Max 5)</label>
                    {formData.socialUrls.length < 5 && (
                      <button type="button" onClick={handleAddSocial} style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        + Add another
                      </button>
                    )}
                  </div>
                  {formData.socialUrls.map((url, i) => (
                    <input
                      key={i}
                      type="url"
                      value={url}
                      onChange={(e) => handleSocialChange(i, e.target.value)}
                      placeholder={`https://instagram.com/mybrand`}
                      style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Competitor Links (Max 3)</label>
                    {formData.competitorLinks.length < 3 && (
                      <button type="button" onClick={handleAddCompetitor} style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        + Add competitor
                      </button>
                    )}
                  </div>
                  {formData.competitorLinks.map((url, i) => (
                    <input
                      key={i}
                      type="url"
                      value={url}
                      onChange={(e) => handleCompetitorChange(i, e.target.value)}
                      placeholder="https://competitor.com"
                      style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>Upload Brand Assets / Guidelines (Max 10MB)</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt,image/*"
                    style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)' }}
                  />
                  {fileError && (
                    <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 500 }}>{fileError}</span>
                  )}
                  {file && !fileError && (
                    <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 500 }}>✓ {file.name} ready for parsing</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
            ) : <div />}

            {step < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(124, 58, 237, 0.1)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
              >
                Next Step →
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading || !!fileError}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(124, 58, 237, 0.15)'
                  }}
                  onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
                  onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                >
                  {loading ? 'Analyzing Voice...' : 'Analyze Voice & Finish'}
                </button>
              </div>
            )}
          </div>

        </form>
      </div>
    </main>
  );
}
