import { useState } from 'react'
import jsPDF from 'jspdf'

const INITIAL = {
  clientName: '',
  projectType: 'Logo Design',
  budgetRange: 'Under $500',
  timeline: 'ASAP (1-2 weeks)',
  projectGoals: '',
  styleReferences: '',
}

export default function ClientBrief() {
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
      const res = await fetch('/api/client-brief', {
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

  function exportBriefPDF(result, form) {
    const doc = new jsPDF()
    const margin = 16
    const maxW = doc.internal.pageSize.getWidth() - margin * 2
    let y = 18

    doc.setFontSize(18); doc.setTextColor(123, 97, 255)
    doc.text('SQUIRES SOLUTIONS — PROJECT BRIEF', margin, y); y += 10
    doc.setFontSize(10); doc.setTextColor(80, 80, 80)
    doc.text(`Client: ${form.clientName}  |  Type: ${form.projectType}  |  Budget: ${form.budgetRange}  |  Timeline: ${form.timeline}`, margin, y); y += 10

    const sections = [
      { title: 'Project Title', body: result.projectTitle || '' },
      { title: 'Client Overview', body: result.clientOverview || '' },
      { title: 'Objectives', body: (result.objectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n') },
      { title: 'Deliverables', body: (result.deliverables || []).map(d => `• ${d}`).join('\n') },
      { title: 'Project Scope', body: result.projectScope || '' },
      { title: 'Out of Scope', body: (result.outOfScope || []).map(d => `• ${d}`).join('\n') },
      { title: 'Timeline', body: (result.milestones || []).map(m => `${m.name}: ${m.description}`).join('\n') },
      { title: 'Budget', body: result.budget || '' },
      { title: 'Revision Policy', body: result.revisionPolicy || '' },
    ].filter(s => s.body)

    sections.forEach(({ title, body }) => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFontSize(11); doc.setTextColor(40, 40, 40); doc.setFont('helvetica', 'bold')
      doc.text(title.toUpperCase(), margin, y); y += 6
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(body, maxW)
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(line, margin, y); y += 5
      })
      y += 5
    })

    doc.save(`brief-${(form.clientName || 'client').replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Agent 03</div>
        <h1 className="page-title">CLIENT BRIEF</h1>
        <p className="page-subtitle">
          Turn messy client intake into a professional, structured project brief in seconds.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="clientName">Client Name *</label>
              <input id="clientName" name="clientName" type="text" className="form-input"
                value={form.clientName} onChange={handleChange} required
                placeholder="e.g. Apex Studio" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="projectType">Project Type</label>
              <select id="projectType" name="projectType" className="form-select"
                value={form.projectType} onChange={handleChange}>
                {['Logo Design','Brand Identity','Social Media Kit','Website Design','Print Design','Motion Graphics','Full Rebrand','Custom'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="budgetRange">Budget Range</label>
              <select id="budgetRange" name="budgetRange" className="form-select"
                value={form.budgetRange} onChange={handleChange}>
                {['Under $500','$500–$1,500','$1,500–$5,000','$5,000–$15,000','$15,000+'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="timeline">Timeline</label>
              <select id="timeline" name="timeline" className="form-select"
                value={form.timeline} onChange={handleChange}>
                {['ASAP (1-2 weeks)','1 Month','2-3 Months','3-6 Months','Flexible'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="projectGoals">Project Goals</label>
            <textarea id="projectGoals" name="projectGoals" className="form-textarea" rows={4}
              value={form.projectGoals} onChange={handleChange}
              placeholder="What does the client want to achieve?" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="styleReferences">Style References / Inspiration</label>
            <textarea id="styleReferences" name="styleReferences" className="form-textarea" rows={3}
              value={form.styleReferences} onChange={handleChange}
              placeholder="URLs, competitors, adjectives, mood…" />
          </div>

          {error && <div className="inline-error">{error}</div>}

          <button type="submit" className="btn btn-cyan" disabled={loading} style={{ marginTop: 8 }}>
            {loading
              ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Generating Brief…</>
              : '◻ Generate Brief'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48 }}>
          <div className="loading-spinner loading-spinner--lg" />
          <p className="text-muted2">Claude is writing the project brief…</p>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Action bar */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => exportBriefPDF(result, form)}>↓ Export PDF</button>
          </div>

          {/* Header */}
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <span className="badge badge-cyan">Project Brief</span>
              <span className="badge badge-muted">{form.projectType}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.03em', color: 'var(--accent)', marginBottom: 12 }}>
              {result.projectTitle}
            </h2>
            <p className="text-muted2" style={{ lineHeight: 1.7 }}>{result.clientOverview}</p>
          </div>

          {/* Objectives & Deliverables */}
          <div className="grid-2">
            <div className="card">
              <div className="card-label" style={{ marginBottom: 14 }}>Objectives</div>
              <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(result.objectives || []).map((obj, i) => (
                  <li key={i} style={{ lineHeight: 1.6, color: 'var(--muted2)' }}>{obj}</li>
                ))}
              </ol>
            </div>
            <div className="card">
              <div className="card-label" style={{ marginBottom: 14 }}>Deliverables</div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(result.deliverables || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-8" style={{ lineHeight: 1.6, color: 'var(--muted2)' }}>
                    <span style={{ color: 'var(--accent)', marginTop: 2 }}>☐</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scope */}
          <div className="card">
            <div className="card-label" style={{ marginBottom: 14 }}>Project Scope</div>
            <p className="text-muted2" style={{ lineHeight: 1.7, marginBottom: 16 }}>{result.projectScope}</p>
            {result.outOfScope && result.outOfScope.length > 0 && (
              <div style={{ borderLeft: '3px solid var(--accent2)', paddingLeft: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent2)', marginBottom: 10, textTransform: 'uppercase' }}>Out of Scope</div>
                <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.outOfScope.map((item, i) => (
                    <li key={i} className="text-muted2" style={{ lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Timeline milestones */}
          {result.milestones && result.milestones.length > 0 && (
            <div className="card">
              <div className="card-label" style={{ marginBottom: 18 }}>Timeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {result.milestones.map((m, i) => (
                  <div key={i} className="flex gap-16" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', marginTop: 4, flexShrink: 0 }} />
                      {i < result.milestones.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: 'rgba(123,97,255,0.2)', minHeight: 28 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < result.milestones.length - 1 ? 20 : 0 }}>
                      <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{m.name}</p>
                      <p className="text-muted2" style={{ fontSize: 13, lineHeight: 1.55 }}>{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="card">
            <div className="card-label" style={{ marginBottom: 16 }}>Terms & Metrics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Budget</div>
                <span className="badge badge-green">{result.budget}</span>
              </div>
              {result.revisionPolicy && (
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>Revision Policy</div>
                  <p className="text-muted2" style={{ lineHeight: 1.6 }}>{result.revisionPolicy}</p>
                </div>
              )}
              {result.successMetrics && result.successMetrics.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>Success Metrics</div>
                  <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                    {result.successMetrics.map((metric, i) => (
                      <span key={i} className="badge badge-cyan">{metric}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
