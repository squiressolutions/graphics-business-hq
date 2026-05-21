import { useState, useEffect } from 'react'
import { FileText, Image, Download, Trash2, RefreshCw } from 'lucide-react'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtSize(bytes) {
  if (!bytes) return '—'
  return bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`
}

function FileIcon({ mimetype }) {
  if (mimetype === 'application/pdf') return <FileText size={18} color="#E55A5A" />
  return <Image size={18} color="#5B9BD5" />
}

export default function Uploads() {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/portal/uploads')
      if (res.ok) setUploads(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totalFiles = uploads.reduce((s, u) => s + (u.files?.length || 0), 0)
  const totalSize  = uploads.reduce((s, u) => s + (u.files || []).reduce((ss, f) => ss + (f.size || 0), 0), 0)

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Business</div>
        <h1 className="page-title">CLIENT UPLOADS</h1>
        <p className="page-subtitle">
          Files submitted by clients through the portal Files tab. Download or review reference materials here.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card stat-card-accent">
          <div className="card-label">Submissions</div>
          <div className="card-value">{loading ? '—' : uploads.length}</div>
          <div className="card-muted">total upload batches</div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="card-label">Files</div>
          <div className="card-value">{loading ? '—' : totalFiles}</div>
          <div className="card-muted">individual files</div>
        </div>
        <div className="stat-card stat-card-pink">
          <div className="card-label">Total Size</div>
          <div className="card-value" style={{ fontSize: 22, paddingTop: 4 }}>{loading ? '—' : fmtSize(totalSize)}</div>
          <div className="card-muted">stored on server</div>
        </div>
      </div>

      {/* Notice */}
      <div style={{ background: 'rgba(212,160,23,0.07)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--muted2)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>⚠</span>
        Files are stored on the Render server filesystem. Download important files promptly — they may be cleared on the next deploy. To persist files permanently, connect an S3 or Supabase storage bucket.
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '14px 20px' }}>
          <div className="card-title">Uploaded Files</div>
          <button className="btn btn-ghost btn-sm" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading && (
          <div className="loading-row" style={{ padding: '32px 24px' }}>
            <div className="loading-spinner" /> Loading uploads…
          </div>
        )}

        {!loading && uploads.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, color: 'var(--border2)', marginBottom: 12 }}>📁</div>
            <p className="text-muted" style={{ fontSize: 13 }}>No uploads yet. Files sent through the client portal will appear here.</p>
          </div>
        )}

        {!loading && uploads.map(upload => (
          <div key={upload.id} style={{ borderBottom: '1px solid var(--border)' }}>
            {/* Summary row */}
            <div
              onClick={() => setExpanded(expanded === upload.id ? null : upload.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px', cursor: 'pointer',
                background: expanded === upload.id ? 'rgba(212,160,23,0.04)' : 'transparent',
              }}
            >
              {/* File count bubble */}
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: 'var(--bg3)',
                border: '1px solid var(--border2)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent)',
                flexShrink: 0,
              }}>
                {upload.files?.length || 0}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                  {upload.clientName || 'Unknown Client'}
                  {upload.clientEmail && (
                    <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 8, fontSize: 12 }}>
                      {upload.clientEmail}
                    </span>
                  )}
                </div>
                {upload.description && (
                  <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {upload.description}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {fmtSize((upload.files || []).reduce((s, f) => s + (f.size || 0), 0))}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {fmtDate(upload.uploadedAt)}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                  {expanded === upload.id ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded file list */}
            {expanded === upload.id && (
              <div style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                {/* Meta */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14, fontSize: 12 }}>
                  {upload.clientName  && <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Name: </span><span style={{ color: 'var(--text)' }}>{upload.clientName}</span></div>}
                  {upload.clientEmail && <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Email: </span><a href={`mailto:${upload.clientEmail}`} style={{ color: 'var(--accent)' }}>{upload.clientEmail}</a></div>}
                  {upload.description && <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Description: </span><span style={{ color: 'var(--muted2)' }}>{upload.description}</span></div>}
                  <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Submitted: </span><span style={{ color: 'var(--text)' }}>{fmtDate(upload.uploadedAt)}</span></div>
                </div>

                {/* Files */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(upload.files || []).map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 14px',
                    }}>
                      <FileIcon mimetype={f.mimetype} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.originalName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {f.mimetype} · {fmtSize(f.size)}
                        </div>
                      </div>
                      <a
                        href={f.url}
                        download={f.originalName}
                        className="btn btn-cyan btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Download size={13} /> Download
                      </a>
                    </div>
                  ))}
                </div>

                {upload.clientEmail && (
                  <div style={{ marginTop: 12 }}>
                    <a
                      href={`mailto:${upload.clientEmail}?subject=Re: Your uploaded files — Squires Solutions`}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      ✉ Reply to Client
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
