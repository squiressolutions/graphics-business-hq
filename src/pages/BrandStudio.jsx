import { useState } from 'react'

const BRAND_VIBES = [
  'Minimal & Clean',
  'Bold & Edgy',
  'Luxury & Premium',
  'Playful & Fun',
  'Tech & Modern',
  'Earthy & Organic',
  'Corporate & Professional',
]

const INITIAL = {
  businessName: '',
  industry: '',
  targetAudience: '',
  brandVibe: BRAND_VIBES[0],
  competitors: '',
}

export default function BrandStudio() {
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
      const res = await fetch('/api/brand-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      setResult(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Agent 01</div>
        <h1 className="page-title">BRAND STUDIO</h1>
        <p className="page-subtitle">
          Feed the agent a business. Get a complete brand identity — palette, typography, logo concepts — back in seconds.
        </p>
      </div>

      <div className="two-pane">
        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="businessName">Business Name *</label>
              <input id="businessName" name="businessName" type="text" className="form-input"
                value={form.businessName} onChange={handleChange} required
                placeholder="e.g. Luminary Studio" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="industry">Industry</label>
              <input id="industry" name="industry" type="text" className="form-input"
                value={form.industry} onChange={handleChange}
                placeholder="e.g. Fashion, SaaS, Food & Beverage" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="targetAudience">Target Audience</label>
              <input id="targetAudience" name="targetAudience" type="text" className="form-input"
                value={form.targetAudience} onChange={handleChange}
                placeholder="e.g. Women 25–40 into sustainable fashion" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="brandVibe">Brand Vibe</label>
              <select id="brandVibe" name="brandVibe" className="form-select"
                value={form.brandVibe} onChange={handleChange}>
                {BRAND_VIBES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="competitors">Competitors</label>
              <input id="competitors" name="competitors" type="text" className="form-input"
                value={form.competitors} onChange={handleChange}
                placeholder="e.g. Nike, Adidas, Lululemon" />
            </div>

            {error && <div className="inline-error">{error}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ marginTop: 8 }}>
              {loading
                ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Generating…</>
                : '◈ Generate Brand Identity'}
            </button>
          </form>
        </div>

        {/* Right pane: tips or result preview */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-label">What you'll get</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Brand concept & tagline', 'Color palette with hex codes', 'Typography recommendations', 'Logo concepts (3 directions)', 'Competitor differentiation'].map(item => (
                <div key={item} className="flex items-center gap-8" style={{ fontSize: 13 }}>
                  <span className="text-green">✓</span>
                  <span className="text-muted2">{item}</span>
                </div>
              ))}
            </div>
          </div>
          {!result && !loading && (
            <div className="inline-notice">
              Fill in the form and click Generate to build a full brand identity with Claude AI.
            </div>
          )}
          {loading && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 }}>
              <div className="loading-spinner loading-spinner--lg" />
              <p className="text-muted2" style={{ fontSize: 13 }}>Claude is building your brand identity…</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">{result.brandName || form.businessName}</div>
              <span className="badge badge-violet">Brand Concept</span>
            </div>
            {result.tagline && (
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--accent3)', marginBottom: 12 }}>
                "{result.tagline}"
              </p>
            )}
            {result.brandPersonality && <p className="text-muted2" style={{ lineHeight: 1.7 }}>{result.brandPersonality}</p>}
          </div>

          {result.colorPalette && result.colorPalette.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ marginBottom: 16 }}>Color Palette</div>
              <div className="color-swatch-row">
                {result.colorPalette.map((color, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div className="color-swatch" style={{ background: color.hex }} title={color.hex} />
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{color.hex}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted2)' }}>{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.typography && (
            <div className="card">
              <div className="card-label" style={{ marginBottom: 16 }}>Typography</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[{ role: 'Heading', data: result.typography.heading }, { role: 'Body', data: result.typography.body }, { role: 'Accent', data: result.typography.accent }]
                  .filter(r => r.data)
                  .map(({ role, data }) => (
                    <div key={role} className="flex items-center gap-12" style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
                      <span className="badge badge-muted" style={{ width: 64, justifyContent: 'center' }}>{role}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{data.font}</span>
                      <span className="text-muted" style={{ fontSize: 12, flex: 1 }}>{data.rationale}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {result.logoConcepts && result.logoConcepts.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ marginBottom: 16 }}>Logo Concepts</div>
              <div className="grid-3">
                {result.logoConcepts.map((concept, i) => (
                  <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                    <div className="flex items-center gap-8" style={{ marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{concept.name}</span>
                      <span className="badge badge-violet" style={{ fontSize: 10 }}>{concept.style}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 8 }}>{concept.description}</p>
                    {concept.symbolism && <p style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>{concept.symbolism}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.competitorDifferentiation && (
            <div className="result-block">
              <div className="card-label" style={{ marginBottom: 10 }}>Competitor Differentiation</div>
              <p>{result.competitorDifferentiation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
