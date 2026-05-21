import { useState, useEffect, useMemo, useRef } from 'react'

const STATUS_CONFIG = {
  new:        { label: 'New',         cls: 'badge-pink',   dot: '#EDD86A' },
  reviewing:  { label: 'Reviewing',   cls: 'badge-cyan',   dot: '#5B9BD5' },
  inprogress: { label: 'In Progress', cls: 'badge-orange', dot: '#F59E0B' },
  completed:  { label: 'Completed',   cls: 'badge-green',  dot: '#3DD68C' },
  archived:   { label: 'Archived',    cls: 'badge-muted',  dot: '#6888A8' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ClientRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [updating, setUpdating] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/client-intake')
      if (res.ok) setRequests(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/client-intake/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRequests(prev => prev.map(r => r.id === id ? updated : r))
      }
    } finally {
      setUpdating(null)
    }
  }

  async function deleteRequest(id) {
    try {
      const res = await fetch(`/api/client-intake/${id}`, { method: 'DELETE' })
      if (res.ok) setRequests(prev => prev.filter(r => r.id !== id))
    } catch {}
  }

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return requests
    return requests.filter(r => r.status === filterStatus)
  }, [requests, filterStatus])

  const newCount = requests.filter(r => r.status === 'new').length

  const stats = useMemo(() => ({
    total: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    inprogress: requests.filter(r => r.status === 'inprogress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }), [requests])

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Business</div>
        <h1 className="page-title">
          CLIENT REQUESTS
          {newCount > 0 && (
            <span className="badge badge-pink" style={{ marginLeft: 14, verticalAlign: 'middle', fontSize: 14 }}>
              {newCount} new
            </span>
          )}
        </h1>
        <p className="page-subtitle">
          Incoming project requests from your client portal. Share your portal link:{' '}
          <code style={{ background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: 'var(--accent)' }}>
            /portal
          </code>
        </p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card stat-card-accent">
          <div className="card-label">Total</div>
          <div className="card-value">{stats.total}</div>
          <div className="card-muted">all time</div>
        </div>
        <div className="stat-card stat-card-pink">
          <div className="card-label">New</div>
          <div className="card-value">{stats.new}</div>
          <div className="card-muted">awaiting review</div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="card-label">In Progress</div>
          <div className="card-value">{stats.inprogress}</div>
          <div className="card-muted">active projects</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="card-label">Completed</div>
          <div className="card-value">{stats.completed}</div>
          <div className="card-muted">closed</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="pill-group" style={{ marginBottom: 20 }}>
        {[
          { key: 'all', label: `All (${requests.length})` },
          ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({
            key: k,
            label: `${v.label} (${requests.filter(r => r.status === k).length})`,
          })),
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`pill ${filterStatus === key ? 'selected' : ''}`}
            onClick={() => setFilterStatus(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && (
          <div className="loading-row" style={{ padding: '32px 24px' }}>
            <div className="loading-spinner" /> Loading requests…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, color: 'var(--border2)', marginBottom: 12 }}>📥</div>
            <p className="text-muted" style={{ fontSize: 13 }}>
              {requests.length === 0
                ? 'No requests yet. Share your portal link with potential clients.'
                : 'No requests match this filter.'}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && filtered.map(req => (
          <div key={req.id} className={`request-row ${expanded === req.id ? 'expanded' : ''}`}>
            {/* Summary row */}
            <div
              className="request-row-summary"
              onClick={() => setExpanded(expanded === req.id ? null : req.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <span
                  className="status-dot"
                  style={{ background: STATUS_CONFIG[req.status]?.dot || '#aaa', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {req.name || 'Unknown'}
                    {req.business ? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {req.business}</span> : null}
                    {req.type === 'consultation' && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#3DD68C',
                        background: 'rgba(61,214,140,0.12)', border: '1px solid rgba(61,214,140,0.3)',
                        borderRadius: 99, padding: '1px 9px', letterSpacing: '0.04em',
                      }}>
                        Consultation
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.type === 'consultation'
                      ? (req.topic || 'Free consultation request')
                      : (req.services || []).join(', ') || 'No services listed'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {req.budget && (
                  <span className="badge badge-violet" style={{ fontSize: 11 }}>{req.budget}</span>
                )}
                <span className={`badge ${STATUS_CONFIG[req.status]?.cls || 'badge-muted'}`}>
                  {STATUS_CONFIG[req.status]?.label || req.status}
                </span>
                <span className="req-date" style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(req.submittedAt)}</span>
                <span style={{ color: 'var(--muted)', fontSize: 14 }}>{expanded === req.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Expanded details */}
            {expanded === req.id && (
              <div className="request-row-detail">
                <div className="request-detail-grid">
                  <div>
                    <div className="card-label" style={{ marginBottom: 12 }}>Contact Info</div>
                    <DetailLine label="Name" value={req.name} />
                    <DetailLine label="Email" value={
                      req.email ? <a href={`mailto:${req.email}`} style={{ color: 'var(--accent)' }}>{req.email}</a> : '—'
                    } />
                    <DetailLine label="Phone" value={req.phone} />
                    <DetailLine label="Business" value={req.business} />
                    <DetailLine label="Website" value={
                      req.website
                        ? <a href={req.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent3)' }}>{req.website}</a>
                        : '—'
                    } />
                    <DetailLine label="Found via" value={req.hearAbout} />
                    <DetailLine label="Ref #" value={<code style={{ fontSize: 11, color: 'var(--muted2)' }}>{req.refNum}</code>} />
                  </div>

                  <div>
                    <div className="card-label" style={{ marginBottom: 12 }}>Project Info</div>
                    <div style={{ marginBottom: 10 }}>
                      <div className="portal-review-row-label" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Services</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(req.services || []).map(s => (
                          <span key={s} className="badge badge-violet">{s}</span>
                        ))}
                      </div>
                    </div>
                    {req.type !== 'consultation' && <DetailLine label="Budget" value={req.budget} />}
                    {req.type !== 'consultation' && <DetailLine label="Timeline" value={req.timeline} />}
                    {req.preferredTime && <DetailLine label="Preferred Time" value={req.preferredTime} />}
                    {req.inspiration && <DetailLine label="References" value={req.inspiration} />}
                  </div>
                </div>

                {req.topic && (
                  <div style={{ marginTop: 16 }}>
                    <div className="card-label" style={{ marginBottom: 8 }}>What they want to discuss</div>
                    <div style={{
                      background: 'rgba(61,214,140,0.06)', border: '1px solid rgba(61,214,140,0.2)',
                      borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                      fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap',
                    }}>
                      {req.topic}
                    </div>
                  </div>
                )}

                {req.description && (
                  <div style={{ marginTop: 16 }}>
                    <div className="card-label" style={{ marginBottom: 8 }}>Project Description</div>
                    <div style={{
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                      fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap',
                    }}>
                      {req.description}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Update Status:
                  </div>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      className={`btn btn-sm ${req.status === key ? 'btn-primary' : 'btn-ghost'}`}
                      disabled={updating === req.id}
                      onClick={() => updateStatus(req.id, key)}
                    >
                      {cfg.label}
                    </button>
                  ))}
                  {req.email && (
                    <a
                      href={req.type === 'consultation'
                        ? `mailto:${req.email}?subject=Your Free Consultation — Squires Solutions&body=Hi ${req.name},%0D%0A%0D%0AThanks for booking a free consultation with Squires Solutions! I'd love to connect and talk through your project.%0D%0A%0D%0A${req.preferredTime ? `You mentioned you're available: ${req.preferredTime}%0D%0A%0D%0A` : ''}Let me know a time that works best and we'll get it scheduled.%0D%0A%0D%0A`
                        : `mailto:${req.email}?subject=Re: Your Project Request — Squires Solutions&body=Hi ${req.name},%0D%0A%0D%0AThanks for reaching out to Squires Solutions! I've reviewed your request for ${(req.services || []).join(', ')} and I'd love to discuss next steps.%0D%0A%0D%0A`}
                      className="btn btn-cyan btn-sm"
                      style={{ marginLeft: 'auto' }}
                    >
                      ✉ Reply
                    </a>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--red)' }}
                    onClick={() => deleteRequest(req.id)}
                  >
                    Delete
                  </button>
                </div>

                {/* File Delivery */}
                <DeliverFiles submissionId={req.id} clientName={req.name} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Admin: Deliver Files to Client ─────────────────────────────────────────
// TODO: When auth is implemented, filter deliveries by client session/token
function DeliverFiles({ submissionId, clientName }) {
  const [file, setFile]       = useState(null)
  const [notes, setNotes]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [delivered, setDelivered] = useState([])
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    // Load existing deliveries for this submission
    fetch(`/api/portal/deliveries?refNum=__admin_${submissionId}`)
      .then(r => r.json())
      .then(d => setDelivered(d.files || []))
      .catch(() => {})
  }, [submissionId])

  async function deliver(e) {
    e.preventDefault()
    if (!file) return setError('Select a file first.')
    setUploading(true); setError(null); setSuccess(false)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('submissionId', submissionId)
    fd.append('notes', notes)
    try {
      const res  = await fetch('/api/portal/deliver', { method:'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed.')
      setDelivered(prev => [...prev, data])
      setFile(null); setNotes(''); setSuccess(true)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { setError(err.message) }
    finally { setUploading(false) }
  }

  function fmtSize(b) { return b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB` }

  return (
    <div style={{ marginTop:20, paddingTop:16, borderTop:'1px dashed var(--border2)' }}>
      <div style={{ fontSize:11, color:'var(--muted)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:12 }}>
        📎 Deliver Files to {clientName || 'Client'}
      </div>

      {/* Existing deliveries */}
      {delivered.length > 0 && (
        <div style={{ marginBottom:12 }}>
          {delivered.map(d => (
            <div key={d.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
              <span style={{ color:'var(--muted2)', flex:1 }}>{d.originalName}</span>
              <span style={{ color:'var(--muted)', fontSize:11 }}>{fmtSize(d.size)}</span>
              <a href={d.url} download style={{ color:'var(--accent)', fontSize:11, textDecoration:'none', fontWeight:600 }}>↓ Download</a>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={deliver} style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'flex-end' }}>
        <div style={{ flex:'1 1 200px' }}>
          <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.pdf"
            style={{ fontSize:12, color:'var(--muted2)', width:'100%' }}
            onChange={e => setFile(e.target.files?.[0] || null)} />
          <div style={{ fontSize:10, color:'var(--muted)', marginTop:3 }}>PNG, JPEG, PDF · max 20MB</div>
        </div>
        <input type="text" value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="Notes for client (optional)"
          style={{ flex:'1 1 180px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 10px', fontSize:12, color:'var(--text)' }} />
        <button type="submit" className="btn btn-cyan btn-sm" disabled={uploading}>
          {uploading ? 'Sending…' : '↑ Deliver File'}
        </button>
      </form>
      {error   && <div style={{ fontSize:11, color:'var(--red)', marginTop:6 }}>{error}</div>}
      {success && <div style={{ fontSize:11, color:'var(--green)', marginTop:6 }}>✓ File delivered! Client can download from their portal.</div>}
    </div>
  )
}

function DetailLine({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: 'var(--muted)', minWidth: 70, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}
