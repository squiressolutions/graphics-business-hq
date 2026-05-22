import { useState, useEffect } from 'react'
import { RefreshCw, TrendingUp, Eye, MousePointer, DollarSign, Plus, X } from 'lucide-react'

function fmt$(val) { return val ? `$${parseFloat(val).toFixed(2)}` : '$0.00' }
function fmtNum(val) { return val ? parseInt(val).toLocaleString() : '0' }
function fmtPct(val) { return val ? `${parseFloat(val).toFixed(2)}%` : '0%' }

const STATUS_COLOR = {
  ACTIVE:   { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  PAUSED:   { bg: 'rgba(212,160,23,0.12)', color: 'var(--accent)' },
  ARCHIVED: { bg: 'rgba(100,100,100,0.12)', color: 'var(--muted)' },
}

const OBJECTIVES = [
  'OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT',
  'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION', 'OUTCOME_SALES',
]

export default function MetaAds() {
  const [insights, setInsights]       = useState(null)
  const [campaigns, setCampaigns]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [creating, setCreating]       = useState(false)
  const [form, setForm]               = useState({ name: '', objective: 'OUTCOME_TRAFFIC', daily_budget: '' })
  const [createMsg, setCreateMsg]     = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [ins, camps] = await Promise.all([
        fetch('/api/meta/insights').then(r => r.json()),
        fetch('/api/meta/campaigns').then(r => r.json()),
      ])
      if (ins.error) throw new Error(ins.error)
      if (camps.error) throw new Error(camps.error)
      setInsights(ins)
      setCampaigns(camps)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createCampaign(e) {
    e.preventDefault()
    setCreating(true)
    setCreateMsg(null)
    try {
      const res = await fetch('/api/meta/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCreateMsg({ type: 'success', text: `Campaign created (ID: ${data.id}) — live in Ads Manager as a draft.` })
      setForm({ name: '', objective: 'OUTCOME_TRAFFIC', daily_budget: '' })
      load()
    } catch (e) {
      setCreateMsg({ type: 'error', text: e.message })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Business</div>
        <h1 className="page-title">META ADS</h1>
        <p className="page-subtitle">Campaign performance and ad management — last 30 days.</p>
      </div>

      {/* Stats */}
      <div className="stats-row stats-row--3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="stat-card stat-card-accent">
          <div className="card-label">Spend</div>
          <div className="card-value" style={{ fontSize: 22, paddingTop: 4 }}>
            {loading ? '—' : fmt$(insights?.spend)}
          </div>
          <div className="card-muted">last 30 days</div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="card-label">Impressions</div>
          <div className="card-value">{loading ? '—' : fmtNum(insights?.impressions)}</div>
          <div className="card-muted">total views</div>
        </div>
        <div className="stat-card stat-card-pink">
          <div className="card-label">Clicks</div>
          <div className="card-value">{loading ? '—' : fmtNum(insights?.clicks)}</div>
          <div className="card-muted">link clicks</div>
        </div>
        <div className="stat-card">
          <div className="card-label">CTR</div>
          <div className="card-value" style={{ fontSize: 22, paddingTop: 4 }}>{loading ? '—' : fmtPct(insights?.ctr)}</div>
          <div className="card-muted">click-through rate</div>
        </div>
        <div className="stat-card">
          <div className="card-label">CPM</div>
          <div className="card-value" style={{ fontSize: 22, paddingTop: 4 }}>{loading ? '—' : fmt$(insights?.cpm)}</div>
          <div className="card-muted">cost per 1k views</div>
        </div>
        <div className="stat-card">
          <div className="card-label">Reach</div>
          <div className="card-value">{loading ? '—' : fmtNum(insights?.reach)}</div>
          <div className="card-muted">unique accounts</div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(229,90,90,0.1)', border: '1px solid rgba(229,90,90,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#E55A5A' }}>
          Meta API error: {error}
        </div>
      )}

      {/* Campaigns */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div className="card-header" style={{ padding: '14px 20px' }}>
          <div className="card-title">Campaigns</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} /> New Campaign
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Create Draft Campaign</div>
              <button onClick={() => { setShowCreate(false); setCreateMsg(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={createCampaign} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Campaign Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Brand Awareness May"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Objective</label>
                <select
                  value={form.objective}
                  onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)' }}
                >
                  {OBJECTIVES.map(o => <option key={o} value={o}>{o.replace('OUTCOME_', '')}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Daily Budget ($)</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.daily_budget}
                  onChange={e => setForm(f => ({ ...f, daily_budget: e.target.value }))}
                  placeholder="e.g. 25"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {creating ? 'Creating…' : 'Create Draft'}
                </button>
              </div>
            </form>
            {createMsg && (
              <div style={{ marginTop: 12, fontSize: 13, padding: '10px 14px', borderRadius: 8,
                background: createMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(229,90,90,0.1)',
                color: createMsg.type === 'success' ? '#22c55e' : '#E55A5A',
                border: `1px solid ${createMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(229,90,90,0.3)'}`,
              }}>
                {createMsg.text}
              </div>
            )}
          </div>
        )}

        {loading && <div className="loading-row" style={{ padding: '32px 24px' }}><div className="loading-spinner" /> Loading campaigns…</div>}

        {!loading && campaigns.length === 0 && !error && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, color: 'var(--border2)', marginBottom: 12 }}><TrendingUp size={36} /></div>
            <p className="text-muted" style={{ fontSize: 13 }}>No campaigns found. Create one above to get started.</p>
          </div>
        )}

        {!loading && campaigns.map(c => {
          const ins = c.insights?.data?.[0] || {}
          const statusStyle = STATUS_COLOR[c.status] || STATUS_COLOR.PAUSED
          return (
            <div key={c.id} style={{ borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.objective?.replace('OUTCOME_', '')}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, ...statusStyle }}>
                {c.status}
              </span>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Spend</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmt$(ins.spend)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Impressions</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fmtNum(ins.impressions)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Clicks</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fmtNum(ins.clicks)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>CTR</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fmtPct(ins.ctr)}</div>
                </div>
                {c.daily_budget && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Daily Budget</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fmt$(c.daily_budget / 100)}</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
