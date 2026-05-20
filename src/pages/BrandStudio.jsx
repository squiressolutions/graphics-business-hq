import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'

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

const LS_KEY = 'sq_brands'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveHistory(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function exportPDF(brand, formData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 18
  let y = 0

  // ── Header bar ──
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, W, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('SQUIRES SOLUTIONS', margin, 18)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Brand Identity Report', margin, 26)
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 32)
  y = 50

  // ── Brand name + tagline ──
  doc.setTextColor(10, 10, 10)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text(brand.brandName || formData.businessName, margin, y)
  y += 8
  if (brand.tagline) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text(`"${brand.tagline}"`, margin, y)
    y += 8
  }

  // divider
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, W - margin, y)
  y += 8

  // ── Brand Personality ──
  if (brand.brandPersonality) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(10, 10, 10)
    doc.text('BRAND PERSONALITY', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(brand.brandPersonality, W - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 4.5 + 8
  }

  // ── Brand Voice ──
  if (brand.brandVoice && brand.brandVoice.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(10, 10, 10)
    doc.text('BRAND VOICE', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text(brand.brandVoice.join('  ·  '), margin, y)
    y += 10
  }

  // ── Color Palette ──
  if (brand.colorPalette && brand.colorPalette.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(10, 10, 10)
    doc.text('COLOR PALETTE', margin, y)
    y += 7
    const swatchW = 28
    const swatchH = 14
    brand.colorPalette.forEach((color, i) => {
      const x = margin + i * (swatchW + 4)
      const hex = color.hex || '#cccccc'
      const r = parseInt(hex.slice(1, 3), 16) || 200
      const g = parseInt(hex.slice(3, 5), 16) || 200
      const b = parseInt(hex.slice(5, 7), 16) || 200
      doc.setFillColor(r, g, b)
      doc.roundedRect(x, y, swatchW, swatchH, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(hex.toUpperCase(), x, y + swatchH + 4)
      if (color.name) doc.text(color.name, x, y + swatchH + 8)
    })
    y += swatchH + 14
  }

  // ── Typography ──
  if (brand.typography) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(10, 10, 10)
    doc.text('TYPOGRAPHY', margin, y)
    y += 6
    const typo = brand.typography
    const rows = [
      ['Heading', typo.headingFont || typo.heading?.font || '—'],
      ['Body', typo.bodyFont || typo.body?.font || '—'],
      ['Accent', typo.accentFont || typo.accent?.font || '—'],
    ]
    rows.forEach(([role, font]) => {
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, y, W - margin * 2, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(role.toUpperCase(), margin + 3, y + 4.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(20, 20, 20)
      doc.text(font, margin + 30, y + 4.5)
      y += 9
    })
    y += 4
    if (typo.rationale) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      const lines = doc.splitTextToSize(typo.rationale, W - margin * 2)
      doc.text(lines, margin, y)
      y += lines.length * 4 + 6
    }
  }

  // ── Logo Concepts ──
  const concepts = brand.logoConceptIdeas || brand.logoConcepts || []
  if (concepts.length > 0) {
    // new page if needed
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(10, 10, 10)
    doc.text('LOGO CONCEPTS', margin, y)
    y += 7
    concepts.forEach((c, i) => {
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFillColor(248, 248, 248)
      doc.rect(margin, y, W - margin * 2, 5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(10, 10, 10)
      doc.text(`${i + 1}. ${c.name}`, margin + 2, y + 3.5)
      if (c.style) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.text(`[${c.style}]`, W - margin - doc.getTextWidth(`[${c.style}]`), y + 3.5)
      }
      y += 7
      if (c.description) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(60, 60, 60)
        const dLines = doc.splitTextToSize(c.description, W - margin * 2 - 4)
        doc.text(dLines, margin + 2, y)
        y += dLines.length * 4 + 2
      }
      if (c.symbolism) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(7.5)
        doc.setTextColor(120, 120, 120)
        const sLines = doc.splitTextToSize(c.symbolism, W - margin * 2 - 4)
        doc.text(sLines, margin + 2, y)
        y += sLines.length * 4 + 4
      }
    })
  }

  // ── Competitor Differentiation ──
  if (brand.competitorDifferentiation) {
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(10, 10, 10)
    doc.text('COMPETITOR DIFFERENTIATION', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(brand.competitorDifferentiation, W - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 4.5 + 8
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text('squiressolutions@gmail.com', margin, 290)
    doc.text(`Page ${p} of ${pageCount}`, W - margin - 20, 290)
  }

  const slug = (brand.brandName || formData.businessName || 'brand').replace(/\s+/g, '-').toLowerCase()
  doc.save(`${slug}-brand-identity.pdf`)
}

function buildEmailBody(brand, formData) {
  const name = brand.brandName || formData.businessName
  const tagline = brand.tagline ? `"${brand.tagline}"` : ''
  const palette = (brand.colorPalette || []).map(c => `${c.name} (${c.hex})`).join(', ')
  const typo = brand.typography
    ? `Heading: ${brand.typography.headingFont || brand.typography.heading?.font || '—'} | Body: ${brand.typography.bodyFont || brand.typography.body?.font || '—'}`
    : ''
  const concepts = (brand.logoConceptIdeas || brand.logoConcepts || []).map((c, i) => `${i + 1}. ${c.name} — ${c.description}`).join('\n')

  return encodeURIComponent(`Hi,

Here is the brand identity I've put together for ${name}.

${tagline ? `Tagline: ${tagline}\n` : ''}
COLOR PALETTE
${palette}

TYPOGRAPHY
${typo}

LOGO CONCEPTS
${concepts}

${brand.competitorDifferentiation ? `DIFFERENTIATION\n${brand.competitorDifferentiation}` : ''}

A full PDF brand identity document is attached. Let me know if you'd like any adjustments!

— Squires Solutions
squiressolutions@gmail.com`)
}

export default function BrandStudio() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('generate') // 'generate' | 'history'
  const [history, setHistory] = useState(loadHistory)
  const [clientEmail, setClientEmail] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)

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
      const data = await res.json()
      setResult(data)
      // Auto-save to history
      const entry = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        form: { ...form },
        result: data,
      }
      const updated = [entry, ...loadHistory()].slice(0, 50)
      saveHistory(updated)
      setHistory(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDelete(id) {
    const updated = history.filter(h => h.id !== id)
    saveHistory(updated)
    setHistory(updated)
  }

  function handleLoad(entry) {
    setForm(entry.form)
    setResult(entry.result)
    setActiveTab('generate')
  }

  function handleSendEmail() {
    if (!result) return
    const subject = encodeURIComponent(`Brand Identity — ${result.brandName || form.businessName}`)
    const body = buildEmailBody(result, form)
    const to = clientEmail ? encodeURIComponent(clientEmail) : ''
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
    setShowEmailModal(false)
    setClientEmail('')
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

      {/* Tab switcher */}
      <div className="pill-group" style={{ marginBottom: 24 }}>
        <button className={`pill ${activeTab === 'generate' ? 'selected' : ''}`} onClick={() => setActiveTab('generate')}>
          Generate
        </button>
        <button className={`pill ${activeTab === 'history' ? 'selected' : ''}`} onClick={() => setActiveTab('history')}>
          Saved Brands {history.length > 0 && <span className="badge badge-muted" style={{ marginLeft: 6 }}>{history.length}</span>}
        </button>
      </div>

      {/* ── Generate tab ── */}
      {activeTab === 'generate' && (
        <>
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
                <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 8 }}>
                  {loading
                    ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Generating…</>
                    : '◈ Generate Brand Identity'}
                </button>
              </form>
            </div>

            {/* Right pane */}
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

              {/* Action bar */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => exportPDF(result, form)}>
                  ↓ Export PDF
                </button>
                <button className="btn btn-secondary" onClick={() => setShowEmailModal(true)}>
                  ✉ Send to Client
                </button>
              </div>

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
                {result.brandVoice && result.brandVoice.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {result.brandVoice.map((v, i) => <span key={i} className="badge badge-muted">{v}</span>)}
                  </div>
                )}
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
                        {color.usage && <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', maxWidth: 64 }}>{color.usage}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.typography && (
                <div className="card">
                  <div className="card-label" style={{ marginBottom: 16 }}>Typography</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { role: 'Heading', font: result.typography.headingFont || result.typography.heading?.font, rationale: result.typography.heading?.rationale },
                      { role: 'Body', font: result.typography.bodyFont || result.typography.body?.font, rationale: result.typography.body?.rationale },
                      { role: 'Accent', font: result.typography.accentFont || result.typography.accent?.font, rationale: result.typography.accent?.rationale },
                    ].filter(r => r.font).map(({ role, font, rationale }) => (
                      <div key={role} className="flex items-center gap-12" style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
                        <span className="badge badge-muted" style={{ width: 64, justifyContent: 'center' }}>{role}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{font}</span>
                        {rationale && <span className="text-muted" style={{ fontSize: 12, flex: 1 }}>{rationale}</span>}
                      </div>
                    ))}
                    {result.typography.rationale && (
                      <p className="text-muted2" style={{ fontSize: 12, marginTop: 4 }}>{result.typography.rationale}</p>
                    )}
                  </div>
                </div>
              )}

              {(result.logoConceptIdeas || result.logoConcepts) && (
                <div className="card">
                  <div className="card-label" style={{ marginBottom: 16 }}>Logo Concepts</div>
                  <div className="grid-3">
                    {(result.logoConceptIdeas || result.logoConcepts).map((concept, i) => (
                      <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                        <div className="flex items-center gap-8" style={{ marginBottom: 10 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{concept.name}</span>
                          {concept.style && <span className="badge badge-violet" style={{ fontSize: 10 }}>{concept.style}</span>}
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

              {/* Action bar bottom */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 8 }}>
                <button className="btn btn-primary" onClick={() => exportPDF(result, form)}>
                  ↓ Export PDF
                </button>
                <button className="btn btn-secondary" onClick={() => setShowEmailModal(true)}>
                  ✉ Send to Client
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── History tab ── */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p className="text-muted" style={{ fontSize: 13 }}>No saved brand identities yet. Generate one to get started.</p>
            </div>
          )}
          {history.map(entry => (
            <div key={entry.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Color swatches preview */}
              <div style={{ display: 'flex', gap: 4 }}>
                {(entry.result.colorPalette || []).slice(0, 5).map((c, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c.hex, border: '1px solid var(--border)' }} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
                  {entry.result.brandName || entry.form.businessName}
                </div>
                {entry.result.tagline && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>"{entry.result.tagline}"</div>
                )}
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {entry.form.industry} · {entry.form.brandVibe} · {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}
                  onClick={() => handleLoad(entry)}>
                  Load
                </button>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}
                  onClick={() => exportPDF(entry.result, entry.form)}>
                  ↓ PDF
                </button>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px', color: 'var(--red)' }}
                  onClick={() => handleDelete(entry.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Send to Client modal ── */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 400, maxWidth: '90vw' }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Send Brand Identity to Client</div>
            <div className="form-group">
              <label className="form-label">Client Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                autoFocus
              />
              <p className="text-muted" style={{ fontSize: 11, marginTop: 6 }}>
                Opens your email client with the brand summary pre-filled. Attach the PDF separately.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSendEmail}>
                Open Email Client
              </button>
              <button className="btn btn-ghost" onClick={() => { setShowEmailModal(false); setClientEmail('') }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
