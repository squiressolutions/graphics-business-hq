import { useState } from 'react';

const BUDGET_OPTIONS = ['$300–$500', '$500–$1K', '$1K–$3K', '$3K–$10K', '$10K+'];
const GOAL_OPTIONS = ['Lead Generation', 'Brand Awareness', 'Direct Bookings', 'Portfolio Views', 'Retargeting'];
const PLATFORM_OPTIONS = ['Meta Only', 'Google Only', 'Both Meta + Google', 'TikTok Only', 'All Platforms'];

const WEEK_COLORS = {
  0: { bg: 'rgba(123,97,255,0.12)', border: 'rgba(123,97,255,0.35)', label: '#7B61FF' },
  1: { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.3)', label: '#ec4899' },
  2: { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', label: '#06b6d4' },
  3: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: '#22c55e' },
};

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button className="btn" onClick={handleCopy} style={{ fontSize: '0.78rem', padding: '4px 12px' }}>
      {copied ? 'Copied!' : label}
    </button>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 16px',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: '20px',
    }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{title}</span>
    </div>
  );
}

function SetupSteps({ steps }) {
  if (!steps?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'rgba(123,97,255,0.18)',
            border: '1.5px solid #7B61FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.78rem',
            color: '#7B61FF',
            flexShrink: 0,
            marginTop: '1px',
          }}>
            {i + 1}
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.78)', fontSize: '0.88rem', lineHeight: 1.6 }}>{step}</p>
        </div>
      ))}
    </div>
  );
}

export default function CampaignBuilder() {
  const [formData, setFormData] = useState({
    businessName: '',
    serviceToAdvertise: '',
    targetAudience: '',
    monthlyBudget: '',
    primaryGoal: '',
    platforms: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">AGENT 08</p>
        <h1 className="page-title">CAMPAIGN BUILDER</h1>
        <p className="page-subtitle">A complete paid ads playbook for Meta and Google — ready to execute today.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input
                className="form-input"
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Your studio or business name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Service to Advertise *</label>
              <input
                className="form-input"
                type="text"
                name="serviceToAdvertise"
                value={formData.serviceToAdvertise}
                onChange={handleChange}
                placeholder="e.g. Brand Identity Packages, Logo Design, Social Media Graphics"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <input
                className="form-input"
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                placeholder="e.g. Small business owners, restaurant owners, local service businesses"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Budget</label>
              <select
                className="form-select"
                name="monthlyBudget"
                value={formData.monthlyBudget}
                onChange={handleChange}
              >
                <option value="">Select budget</option>
                {BUDGET_OPTIONS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Primary Goal</label>
              <select
                className="form-select"
                name="primaryGoal"
                value={formData.primaryGoal}
                onChange={handleChange}
              >
                <option value="">Select goal</option>
                {GOAL_OPTIONS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Platforms</label>
              <select
                className="form-select"
                name="platforms"
                value={formData.platforms}
                onChange={handleChange}
              >
                <option value="">Select platforms</option>
                {PLATFORM_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px', minWidth: '200px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="loading-spinner" />
                Building Campaign...
              </span>
            ) : (
              'Build My Campaign'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(255,80,80,0.35)', background: 'rgba(255,80,80,0.07)' }}>
          <p style={{ color: '#ff6b6b', margin: 0 }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* 1. Campaign Overview */}
          {result.campaignStrategy && (
            <div className="card">
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: '#7B61FF', fontWeight: 700, textTransform: 'uppercase' }}>
                  Campaign Overview
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '16px' }}>
                {result.campaignStrategy.overview}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                {result.campaignStrategy.objective && (
                  <span className="badge badge-violet">{result.campaignStrategy.objective}</span>
                )}
                {result.campaignStrategy.kpis?.map((kpi, i) => (
                  <span key={i} style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22c55e',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>{kpi}</span>
                ))}
              </div>

              {result.campaignStrategy.budgetAllocation?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Budget Allocation
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {result.campaignStrategy.budgetAllocation.map((alloc, i) => (
                      <div key={i} style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'rgba(123,97,255,0.1)',
                        border: '1px solid rgba(123,97,255,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '120px',
                      }}>
                        <span style={{ fontWeight: 700, color: '#7B61FF', fontSize: '1.05rem' }}>{alloc.percentage}</span>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{alloc.platform}</span>
                        {alloc.amount && (
                          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{alloc.amount}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Meta Ads Setup */}
          {result.meta && (
            <div className="card">
              <SectionHeader icon="🔵" title="Meta Ads Setup" />

              {result.meta.campaignStructure && (
                <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: '20px' }}>
                  {result.meta.campaignStructure}
                </p>
              )}

              {result.meta.audiences?.length > 0 && (
                <div style={{ marginBottom: '22px' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Audiences
                  </p>
                  <div className="grid-3">
                    {result.meta.audiences.map((aud, i) => (
                      <div key={i} className="card" style={{ padding: '16px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', marginBottom: '6px' }}>{aud.name}</p>
                        <span className="badge badge-violet" style={{ marginBottom: '8px', display: 'inline-block' }}>{aud.type}</span>
                        <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, marginBottom: '8px' }}>{aud.targeting}</p>
                        {aud.sizeEstimate && (
                          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>{aud.sizeEstimate}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.meta.creativeSpecs?.length > 0 && (
                <div style={{ marginBottom: '22px' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Creative Specs
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {result.meta.creativeSpecs.map((spec, i) => (
                      <div key={i} style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        minWidth: '160px',
                      }}>
                        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: '4px' }}>{spec.format}</p>
                        <p style={{ fontSize: '0.78rem', color: '#7B61FF', marginBottom: '4px' }}>{spec.dimensions}</p>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{spec.copySpecs}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(result.meta.bidStrategy || result.meta.dailyBudget) && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {result.meta.bidStrategy && (
                    <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.2)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>Bid Strategy</span>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{result.meta.bidStrategy}</span>
                    </div>
                  )}
                  {result.meta.dailyBudget && (
                    <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.2)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>Daily Budget</span>
                      <span style={{ fontWeight: 700, color: '#7B61FF', fontSize: '0.9rem' }}>{result.meta.dailyBudget}</span>
                    </div>
                  )}
                </div>
              )}

              {result.meta.setupSteps?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Setup Steps
                  </p>
                  <SetupSteps steps={result.meta.setupSteps} />
                </div>
              )}
            </div>
          )}

          {/* 3. Google Ads Setup */}
          {result.google && (
            <div className="card">
              <SectionHeader icon="🟡" title="Google Ads Setup" />

              {(result.google.campaignType || result.google.bidStrategy || result.google.dailyBudget) && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {result.google.campaignType && (
                    <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>Campaign Type</span>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{result.google.campaignType}</span>
                    </div>
                  )}
                  {result.google.bidStrategy && (
                    <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>Bid Strategy</span>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{result.google.bidStrategy}</span>
                    </div>
                  )}
                  {result.google.dailyBudget && (
                    <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>Daily Budget</span>
                      <span style={{ fontWeight: 700, color: '#eab308', fontSize: '0.9rem' }}>{result.google.dailyBudget}</span>
                    </div>
                  )}
                </div>
              )}

              {result.google.adGroups?.length > 0 && (
                <div style={{ marginBottom: '22px' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Ad Groups
                  </p>
                  <div className="grid-3">
                    {result.google.adGroups.map((group, i) => (
                      <div key={i} className="card" style={{ padding: '16px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', marginBottom: '10px' }}>{group.name}</p>
                        {group.keywords?.length > 0 && (
                          <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {group.keywords.map((kw, j) => (
                              <span key={j} style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'rgba(34,197,94,0.1)',
                                border: '1px solid rgba(34,197,94,0.25)',
                                color: '#22c55e',
                              }}>{kw}</span>
                            ))}
                          </div>
                        )}
                        {group.headlines?.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Headlines</p>
                            {group.headlines.map((h, j) => (
                              <p key={j} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: '2px 0' }}>• {h}</p>
                            ))}
                          </div>
                        )}
                        {group.descriptions?.length > 0 && (
                          <div>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Descriptions</p>
                            {group.descriptions.map((d, j) => (
                              <p key={j} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '2px 0' }}>• {d}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.google.keywords && (
                <div style={{ marginBottom: '22px' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Keywords
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e', marginBottom: '8px' }}>Target Keywords</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {result.google.keywords.target?.map((kw, i) => (
                          <span key={i} style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            color: '#22c55e',
                            fontSize: '0.82rem',
                          }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(239,68,68,0.85)', marginBottom: '8px' }}>Negative Keywords</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {result.google.keywords.negative?.map((kw, i) => (
                          <span key={i} style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239,68,68,0.07)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: 'rgba(239,68,68,0.75)',
                            fontSize: '0.82rem',
                          }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.google.setupSteps?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Setup Steps
                  </p>
                  <SetupSteps steps={result.google.setupSteps} />
                </div>
              )}
            </div>
          )}

          {/* 4. Creative Ideas */}
          {result.creativeIdeas?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
                Creative Ideas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {result.creativeIdeas.map((idea, i) => (
                  <div key={i} className="card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                      <span className="badge badge-violet">{idea.platform}</span>
                      <span className="badge badge-muted">{idea.format}</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '6px' }}>{idea.hook}</p>
                    <p style={{ fontStyle: 'italic', color: '#06b6d4', fontSize: '0.88rem', marginBottom: '8px', lineHeight: 1.6 }}>
                      {idea.visualConcept}
                    </p>
                    <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: '10px' }}>
                      {idea.copySnippet}
                    </p>
                    {idea.cta && (
                      <div style={{
                        display: 'inline-block',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: '#7B61FF',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.03em',
                      }}>
                        {idea.cta}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. UTM Parameters */}
          {result.utmParameters && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                UTM Parameters
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Full UTM String
                  </p>
                  <CopyButton text={result.utmParameters.fullString} label="Copy URL" />
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#22c55e',
                  wordBreak: 'break-all',
                  lineHeight: 1.6,
                }}>
                  {result.utmParameters.fullString}
                </div>
              </div>

              {result.utmParameters.breakdown?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Parameter Breakdown
                  </p>
                  <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {result.utmParameters.breakdown.map((row, i) => (
                      <div key={i} style={{
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr',
                        gap: '0',
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        borderBottom: i < result.utmParameters.breakdown.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}>
                        <div style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#7B61FF', fontWeight: 600 }}>
                          {row.param}
                        </div>
                        <div style={{ padding: '10px 14px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. Launch Timeline */}
          {result.timeline?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
                Launch Timeline
              </h3>
              <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {result.timeline.map((week, i) => {
                  const colors = WEEK_COLORS[i] || WEEK_COLORS[0];
                  return (
                    <div key={i} style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                    }}>
                      <p style={{ fontWeight: 800, fontSize: '0.85rem', color: colors.label, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                        {week.label || `Week ${i + 1}`}
                      </p>
                      <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0 }}>
                        {week.tasks}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
