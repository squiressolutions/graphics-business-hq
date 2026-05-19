import { useState } from 'react'

const CONTENT_TYPES = [
  'Case Study',
  'Homepage Copy',
  'About Page',
  'Service Page',
  'Blog Post',
  'Email Newsletter',
  'Press Release',
]

const TONES = [
  'Professional & Authoritative',
  'Warm & Conversational',
  'Bold & Punchy',
  'Creative & Expressive',
  'Minimalist & Direct',
]

const INITIAL = {
  businessName: '',
  contentType: CONTENT_TYPES[0],
  topic: '',
  targetAudience: '',
  tone: TONES[0],
  keyPoints: '',
}

export default function ContentWriter() {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

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
      const res = await fetch('/api/content-writer', {
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

  function copyContent() {
    const text = result?.content || result?.body || result?.text
      || (typeof result === 'string' ? result : JSON.stringify(result, null, 2))
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const outputText = result
    ? (result.content || result.body || result.text
        || (typeof result === 'string' ? result : JSON.stringify(result, null, 2)))
    : null

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Agent 05</div>
        <h1 className="page-title">CONTENT WRITER</h1>
        <p className="page-subtitle">
          Generate case studies, web copy, blog posts, and more — tailored to your brand voice.
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
              <label className="form-label" htmlFor="contentType">Content Type</label>
              <select id="contentType" name="contentType" className="form-select"
                value={form.contentType} onChange={handleChange}>
                {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="topic">Topic / Subject *</label>
              <input id="topic" name="topic" type="text" className="form-input"
                value={form.topic} onChange={handleChange} required
                placeholder="e.g. How we rebranded a law firm in 30 days" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="targetAudience">Target Audience</label>
              <input id="targetAudience" name="targetAudience" type="text" className="form-input"
                value={form.targetAudience} onChange={handleChange}
                placeholder="e.g. Small business owners, startup founders" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tone">Tone of Voice</label>
              <select id="tone" name="tone" className="form-select"
                value={form.tone} onChange={handleChange}>
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="keyPoints">Key Points to Cover</label>
              <textarea id="keyPoints" name="keyPoints" className="form-textarea" rows={4}
                value={form.keyPoints} onChange={handleChange}
                placeholder="List the main points, angles, or sections to include…" />
              <div className="form-hint">One point per line or separated by commas</div>
            </div>

            {error && <div className="inline-error">{error}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading
                ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Writing…</>
                : '◇ Generate Content'}
            </button>
          </form>
        </div>

        {/* Output pane */}
        <div>
          {!loading && !result && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 14, color: 'var(--border2)' }}>◇</div>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Your generated content will appear here. Fill in the form and click Generate.
              </p>
            </div>
          )}

          {loading && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 48 }}>
              <div className="loading-spinner loading-spinner--lg" />
              <p className="text-muted2" style={{ fontSize: 13 }}>
                Claude is writing your {form.contentType.toLowerCase()}…
              </p>
            </div>
          )}

          {result && !loading && (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-8">
                  <span className="badge badge-violet">{form.contentType}</span>
                  <span className="badge badge-muted">{form.tone.split(' ')[0]}</span>
                </div>
                <button
                  className={`btn btn-sm ${copied ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={copyContent}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              {result.title && (
                <div className="card" style={{ marginBottom: 12 }}>
                  <div className="card-label" style={{ marginBottom: 8 }}>Title</div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text)', lineHeight: 1.35 }}>
                    {result.title}
                  </h2>
                  {result.subtitle && (
                    <p className="text-muted2" style={{ fontSize: 14, marginTop: 8 }}>{result.subtitle}</p>
                  )}
                </div>
              )}

              {result.metaDescription && (
                <div className="card" style={{ marginBottom: 12 }}>
                  <div className="card-label" style={{ marginBottom: 8 }}>Meta Description</div>
                  <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.65 }}>{result.metaDescription}</p>
                </div>
              )}

              <div className="result-block">{outputText}</div>

              {result.callToAction && (
                <div className="card" style={{ marginTop: 12, borderLeft: '3px solid var(--accent2)' }}>
                  <div className="card-label" style={{ marginBottom: 8 }}>Call to Action</div>
                  <p style={{ fontSize: 14, color: 'var(--text)' }}>{result.callToAction}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
