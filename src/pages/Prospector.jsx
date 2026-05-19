import { useState } from 'react';

const SERVICE_OPTIONS = [
  'Logo Design',
  'Brand Identity',
  'Social Media Graphics',
  'Website Design',
  'Motion Graphics',
  'Full-Service Branding',
  'Print Design',
];

const BUDGET_OPTIONS = [
  '$500–$2K',
  '$2K–$5K',
  '$5K–$15K',
  '$15K+',
  'Any Budget',
];

const DAY_LABELS = ['Day 3', 'Day 7', 'Day 14'];

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

function AccordionItem({ objection, response }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: '1px solid rgba(123,97,255,0.2)',
        borderRadius: '10px',
        marginBottom: '10px',
        overflow: 'hidden',
        background: 'rgba(123,97,255,0.04)',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
          gap: '12px',
        }}
      >
        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontSize: '0.92rem' }}>
          {objection}
        </span>
        <span style={{ color: '#7B61FF', fontSize: '1.1rem', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', color: 'rgba(255,255,255,0.82)', fontSize: '0.9rem', lineHeight: 1.65 }}>
          {response}
        </div>
      )}
    </div>
  );
}

export default function Prospector() {
  const [formData, setFormData] = useState({
    service: '',
    targetIndustry: '',
    location: '',
    budgetRange: '',
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
      const res = await fetch('/api/prospector', {
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
        <p className="page-eyebrow">AGENT 07</p>
        <h1 className="page-title">PROSPECTOR</h1>
        <p className="page-subtitle">Find your ideal clients and generate ready-to-send outreach in one shot.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Your Service *</label>
              <select
                className="form-select"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
              >
                <option value="">Select a service</option>
                {SERVICE_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Industry *</label>
              <input
                className="form-input"
                type="text"
                name="targetIndustry"
                value={formData.targetIndustry}
                onChange={handleChange}
                placeholder="e.g. Restaurants, Real Estate Agents, Med Spas, Law Firms"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location / Market</label>
              <input
                className="form-input"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Miami, FL or Leave blank for remote"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Client Budget Range</label>
              <select
                className="form-select"
                name="budgetRange"
                value={formData.budgetRange}
                onChange={handleChange}
              >
                <option value="">Any Budget</option>
                {BUDGET_OPTIONS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px', minWidth: '180px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="loading-spinner" />
                Prospecting...
              </span>
            ) : (
              'Find My Clients'
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

          {/* 1. ICP Card */}
          {result.icp && (
            <div className="card">
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: '#7B61FF', fontWeight: 700, textTransform: 'uppercase' }}>
                  Ideal Client Profile
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>
                {result.icp.title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: '20px' }}>
                {result.icp.description}
              </p>

              <div className="grid-2" style={{ gap: '20px' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Pain Points
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.icp.painPoints?.map((pt, i) => (
                      <span key={i} className="badge badge-muted">{pt}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Buying Triggers
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.icp.buyingTriggers?.map((bt, i) => (
                      <span key={i} className="badge badge-violet">{bt}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: '#7B61FF', fontWeight: 700, fontSize: '1rem' }}>
                  Avg Project Value: {result.icp.avgProjectValue}
                </span>
              </div>
            </div>
          )}

          {/* 2. Prospect Types */}
          {result.prospectTypes?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
                Prospect Types
              </h3>
              <div className="grid-2">
                {result.prospectTypes.map((pt, i) => (
                  <div key={i} className="card" style={{ padding: '18px' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.97rem', color: '#fff', marginBottom: '6px' }}>
                      {pt.businessType}
                    </p>
                    <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: '10px' }}>
                      {pt.whyTheyNeedDesign}
                    </p>
                    <span className="badge badge-violet" style={{ marginBottom: '8px', display: 'inline-block' }}>
                      {pt.estimatedBudget}
                    </span>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: 0 }}>
                      📍 {pt.whereToFindThem}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Cold Email */}
          {result.coldEmail && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                Cold Email
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Pick your subject line
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.coldEmail.subjectLines?.map((line, i) => (
                    <div
                      key={i}
                      onClick={() => navigator.clipboard.writeText(line)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(123,97,255,0.08)',
                        border: '1px solid rgba(123,97,255,0.2)',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        color: 'rgba(255,255,255,0.82)',
                        transition: 'background 0.15s',
                      }}
                      title="Click to copy"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Email Body
                  </p>
                  <CopyButton text={result.coldEmail.body} label="Copy Body" />
                </div>
                <div className="result-block" style={{ whiteSpace: 'pre-wrap' }}>
                  {result.coldEmail.body}
                </div>
              </div>

              {result.coldEmail.ps && (
                <p style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', fontSize: '0.87rem', margin: 0 }}>
                  {result.coldEmail.ps}
                </p>
              )}
            </div>
          )}

          {/* 4. LinkedIn Outreach */}
          {result.linkedinOutreach && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                LinkedIn Outreach
              </h3>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Connection Request
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-muted">
                      {result.linkedinOutreach.connectionRequest?.length || 0} chars
                    </span>
                    <CopyButton text={result.linkedinOutreach.connectionRequest} />
                  </div>
                </div>
                <div className="result-block">
                  {result.linkedinOutreach.connectionRequest}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Follow-up Message
                  </p>
                  <CopyButton text={result.linkedinOutreach.followUpMessage} />
                </div>
                <div className="result-block">
                  {result.linkedinOutreach.followUpMessage}
                </div>
              </div>

              {result.linkedinOutreach.valuePostIdea && (
                <div style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(123,97,255,0.08)',
                  border: '1px solid rgba(123,97,255,0.2)',
                }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7B61FF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    💡 Content Idea
                  </p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {result.linkedinOutreach.valuePostIdea}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. Follow-up Sequence */}
          {result.followUpSequence?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
                Follow-up Sequence
              </h3>
              <div className="grid-3">
                {result.followUpSequence.map((seq, i) => (
                  <div key={i} className="card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className="badge badge-violet">{DAY_LABELS[i] || `Day ${seq.day}`}</span>
                      <CopyButton text={`${seq.subject}\n\n${seq.body}`} />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '8px' }}>
                      {seq.subject}
                    </p>
                    <div className="result-block" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                      {seq.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Objection Handling */}
          {result.objectionHandling?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                Objection Handling
              </h3>
              {result.objectionHandling.map((item, i) => (
                <AccordionItem key={i} objection={item.objection} response={item.response} />
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
