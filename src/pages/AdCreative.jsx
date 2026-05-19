import { useState } from 'react'

const INITIAL = {
  businessName: '',
  serviceProduct: '',
  targetAudience: '',
  monthlyBudget: 'Under $500',
  platform: 'Meta (FB/IG)',
  campaignGoal: 'Brand Awareness',
}

const ANGLE_BADGES = ['badge-violet', 'badge-pink', 'badge-cyan', 'badge-orange', 'badge-green']

export default function AdCreative() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/ad-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setResult(await res.json())
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Agent 04</div>
        <h1 className="page-title">AD CREATIVE</h1>
        <p className="page-subtitle">
          Concept, copy, and targeting strategy for your next paid campaign — across any platform.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="businessName">Business Name *</label>
              <input id="businessName" name="businessName" type="text" className="form-input"
                value={form.businessName} onChange={handleChange} required
                placeholder="e.g. Apex Studio" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="serviceProduct">Service / Product *</label>
              <input id="serviceProduct" name="serviceProduct" type="text" className="form-input"
                value={form.serviceProduct} onChange={handleChange} required
                placeholder="e.g. Brand Identity Package" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="targetAudience">Target Audience</label>
            <input id="targetAudience" name="targetAudience" type="text" className="form-input"
              value={form.targetAudience} onChange={handleChange}
              placeholder="e.g. Small business owners, 28–45, interested in branding" />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="monthlyBudget">Monthly Budget</label>
              <select id="monthlyBudget" name="monthlyBudget" className="form-select"
                value={form.monthlyBudget} onChange={handleChange}>
                {['Under $500','$500–$2K','$2K–$5K','$5K–$15K','$15K+'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="platform">Platform</label>
              <select id="platform" name="platform" className="form-select"
                value={form.platform} onChange={handleChange}>
                {['Meta (FB/IG)','TikTok','Google','LinkedIn','All Platforms'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="campaignGoal">Campaign Goal</label>
              <select id="campaignGoal" name="campaignGoal" className="form-select"
                value={form.campaignGoal} onChange={handleChange}>
                {['Brand Awareness','Lead Generation','Direct Sales','Retargeting','App Installs'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="inline-error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading
              ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Generating…</>
              : '◆ Generate Ad Creative'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48 }}>
          <div className="loading-spinner loading-spinner--lg" />
          <p className="text-muted2">Claude is concepting your campaign for {form.platform}…</p>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Campaign concept */}
          <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="card-label" style={{ marginBottom: 10 }}>Campaign Concept</div>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text)', fontWeight: 500 }}>
              {result.campaignConcept}
            </p>
          </div>

          {/* Ad variants */}
          {result.adVariants && result.adVariants.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.03em', marginBottom: 14 }}>
                Ad Variants
              </div>
              <div className="grid-3">
                {result.adVariants.map((variant, i) => (
                  <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Variant {i + 1}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.35 }}>
                      {variant.headline}
                    </h3>
                    <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 13, lineHeight: 1.65, color: 'var(--muted2)' }}>
                      {variant.primaryText}
                    </div>
                    {variant.visualConcept && (
                      <p style={{ fontStyle: 'italic', color: 'var(--accent3)', fontSize: 12, lineHeight: 1.55 }}>
                        {variant.visualConcept}
                      </p>
                    )}
                    <div style={{ display: 'inline-flex', alignSelf: 'flex-start' }}>
                      <span className="badge badge-violet">{variant.cta}</span>
                    </div>
                    {variant.targetingNotes && (
                      <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                        Targeting: {variant.targetingNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy angles */}
          {result.copyAngles && result.copyAngles.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ marginBottom: 14 }}>Copy Angles</div>
              <div className="pill-group">
                {result.copyAngles.map((angle, i) => (
                  <span key={i} className={`badge ${ANGLE_BADGES[i % ANGLE_BADGES.length]}`} style={{ fontSize: 12, padding: '5px 14px' }}>
                    {angle}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
