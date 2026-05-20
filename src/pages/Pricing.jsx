import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TIERS = [
  {
    name: 'Starter',
    price: '497',
    originalPrice: '650',
    period: 'per project',
    badge: null,
    badgeClass: null,
    description: 'Perfect for solo founders and micro-businesses needing a quick brand refresh.',
    features: [
      { text: 'Logo design (2 concepts)', included: true },
      { text: 'Brand color palette', included: true },
      { text: 'Typography selection', included: true },
      { text: '2 revision rounds', included: true },
      { text: 'Social media kit', included: false },
      { text: 'Brand guidelines PDF', included: false },
      { text: 'Source files', included: false },
    ],
    btnClass: 'btn-ghost',
    btnLabel: 'Get Started',
  },
  {
    name: 'Studio',
    price: '1,197',
    originalPrice: '1,500',
    period: 'per project',
    badge: 'Most Popular',
    description: 'Full brand identity for growing businesses ready to make a mark.',
    features: [
      { text: 'Logo design (3 concepts)', included: true },
      { text: 'Brand color palette', included: true },
      { text: 'Typography selection', included: true },
      { text: '4 revision rounds', included: true },
      { text: 'Social media kit', included: true },
      { text: 'Brand guidelines PDF', included: true },
      { text: 'Source files', included: false },
    ],
    btnClass: 'btn-primary',
    btnLabel: 'Start Project',
  },
  {
    name: 'Agency',
    price: '3,697',
    originalPrice: '5,200',
    period: 'per project',
    badge: null,
    description: 'Comprehensive creative partnership for established brands going premium.',
    features: [
      { text: 'Logo design (5 concepts)', included: true },
      { text: 'Brand color palette', included: true },
      { text: 'Typography selection', included: true },
      { text: 'Unlimited revisions', included: true },
      { text: 'Social media kit', included: true },
      { text: 'Brand guidelines PDF', included: true },
      { text: 'Source files', included: true },
    ],
    btnClass: 'btn-secondary',
    btnLabel: 'Contact Us',
  },
]

const INITIAL = {
  projectType: 'Logo Design',
  complexity: 'Standard',
  revisions: '2',
  deliverables: '',
  clientBudget: '',
  notes: '',
}

export default function Pricing() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('tiers') // 'tiers' | 'proposal'

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
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      setResult(await res.json())
      setActiveTab('proposal')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Agent 06</div>
        <h1 className="page-title">PRICING</h1>
        <p className="page-subtitle">
          Standard service tiers, or use the AI agent to generate a custom proposal for any project.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="pill-group" style={{ marginBottom: 24 }}>
        <button
          className={`pill ${activeTab === 'tiers' ? 'selected' : ''}`}
          onClick={() => setActiveTab('tiers')}
        >
          Service Tiers
        </button>
        <button
          className={`pill ${activeTab === 'proposal' ? 'selected' : ''}`}
          onClick={() => setActiveTab('proposal')}
        >
          Custom Proposal
        </button>
      </div>

      {/* ---- Tiers tab ---- */}
      {activeTab === 'tiers' && (
        <div>
          <div className="grid-3" style={{ alignItems: 'start' }}>
            {TIERS.map(tier => (
              <div
                key={tier.name}
                className={`pricing-card${tier.badge ? ' featured' : ''}`}
                style={{ position: 'relative' }}
              >
                {tier.badge && (
                  <div className="pricing-card-badge">{tier.badge}</div>
                )}
                <div>
                  <div className="pricing-tier-name">{tier.name}</div>
                  <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{tier.description}</p>
                </div>
                <div>
                  {tier.originalPrice && (
                    <div style={{ fontSize: 15, color: 'var(--red)', textDecoration: 'line-through', marginBottom: 2 }}>
                      ${tier.originalPrice}
                    </div>
                  )}
                  <div className="pricing-price"><sup>$</sup>{tier.price}</div>
                  <div className="pricing-period">{tier.period}</div>
                </div>
                <ul className="pricing-features">
                  {tier.features.map((f, i) => (
                    <li key={i} className="pricing-feature">
                      {f.included
                        ? <span className="pricing-feature-check">✓</span>
                        : <span className="pricing-feature-cross">✕</span>}
                      <span style={{ color: f.included ? 'var(--text)' : 'var(--muted)' }}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn ${tier.btnClass} w-full`}
                  onClick={() => tier.btnLabel === 'Contact Us'
                    ? window.location.href = 'mailto:squiressolutions@gmail.com?subject=Agency Package Inquiry'
                    : window.open('/portal', '_blank')
                  }
                >
                  {tier.btnLabel}
                </button>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <div className="card-title">Add-On Services</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Price</th>
                  <th>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { service: 'Brand Strategy Session (2hr)', price: '$299', delivery: 'Scheduled' },
                  { service: 'Social Media Kit', price: '$399', delivery: '3–5 days' },
                  { service: 'Motion Logo Animation', price: '$599', delivery: '5–7 days' },
                  { service: 'Website Mockup (5 pages)', price: '$1,299', delivery: '1–2 weeks' },
                  { service: 'Brand Photography Direction', price: '$499', delivery: '1 week' },
                  { service: 'Print / Packaging Design', price: 'From $799', delivery: '1–2 weeks' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td>{row.service}</td>
                    <td><span className="badge badge-violet">{row.price}</span></td>
                    <td className="text-muted">{row.delivery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Proposal tab ---- */}
      {activeTab === 'proposal' && (
        <div>
          <div className="two-pane">
            {/* Generator form */}
            <div className="card">
              <div className="card-label" style={{ marginBottom: 16 }}>Generate Custom Proposal</div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="projectType">Project Type</label>
                  <select id="projectType" name="projectType" className="form-select"
                    value={form.projectType} onChange={handleChange}>
                    {['Logo Design','Brand Identity','Social Media Kit','Website Design','Print Design','Motion Graphics','Full Rebrand','Custom'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="complexity">Project Complexity</label>
                  <select id="complexity" name="complexity" className="form-select"
                    value={form.complexity} onChange={handleChange}>
                    {['Simple','Standard','Complex','Enterprise'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="revisions">Revision Rounds</label>
                  <select id="revisions" name="revisions" className="form-select"
                    value={form.revisions} onChange={handleChange}>
                    {['1','2','3','5','Unlimited'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="deliverables">Deliverables</label>
                  <textarea id="deliverables" name="deliverables" className="form-textarea" rows={3}
                    value={form.deliverables} onChange={handleChange}
                    placeholder="e.g. Logo files (SVG, PNG), brand guidelines, social kit…" />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="clientBudget">Client Budget (optional)</label>
                  <input id="clientBudget" name="clientBudget" type="text" className="form-input"
                    value={form.clientBudget} onChange={handleChange}
                    placeholder="e.g. $2,000–$5,000" />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="notes">Additional Notes</label>
                  <textarea id="notes" name="notes" className="form-textarea" rows={3}
                    value={form.notes} onChange={handleChange}
                    placeholder="Tight deadline, specific requirements, rush fees…" />
                </div>

                {error && <div className="inline-error">{error}</div>}

                <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 8 }}>
                  {loading
                    ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Generating…</>
                    : '◎ Generate Proposal'}
                </button>
              </form>
            </div>

            {/* Proposal output */}
            <div>
              {!loading && !result && (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 14, color: 'var(--border2)' }}>◎</div>
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    Your custom proposal will appear here. Fill in the form and click Generate.
                  </p>
                </div>
              )}

              {loading && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 48 }}>
                  <div className="loading-spinner loading-spinner--lg" />
                  <p className="text-muted2" style={{ fontSize: 13 }}>
                    Claude is building your custom proposal…
                  </p>
                </div>
              )}

              {result && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                    <div className="card-label" style={{ marginBottom: 8 }}>Recommended Price</div>
                    <div className="card-value" style={{ color: 'var(--accent)' }}>
                      {result.recommendedPrice || result.price || '—'}
                    </div>
                    {result.priceRationale && (
                      <p className="text-muted2" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
                        {result.priceRationale}
                      </p>
                    )}
                  </div>

                  {result.proposalText && (
                    <div className="result-block">{result.proposalText}</div>
                  )}

                  {result.lineItems && result.lineItems.length > 0 && (
                    <div className="card">
                      <div className="card-label" style={{ marginBottom: 14 }}>Line Items</div>
                      <table className="data-table">
                        <thead>
                          <tr><th>Item</th><th>Price</th></tr>
                        </thead>
                        <tbody>
                          {result.lineItems.map((item, i) => (
                            <tr key={i}>
                              <td>{item.description || item.item}</td>
                              <td><span className="badge badge-green">{item.price}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {result.terms && (
                    <div className="card">
                      <div className="card-label" style={{ marginBottom: 10 }}>Terms</div>
                      <p className="text-muted2" style={{ fontSize: 13, lineHeight: 1.7 }}>{result.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
