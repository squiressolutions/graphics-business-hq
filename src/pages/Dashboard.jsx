import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Palette, Share2, ClipboardList, Megaphone, PenTool, Tag, Target, BarChart2 } from 'lucide-react'

const AGENTS = [
  {
    name: 'Brand Studio',
    route: '/brand-studio',
    description: 'Create brand identities, palettes, and logo concepts.',
    badge: 'Branding',
    badgeClass: 'badge-violet',
    Icon: Palette,
  },
  {
    name: 'Social Content',
    route: '/social-content',
    description: 'Generate posts, captions, and content calendars.',
    badge: 'Social',
    badgeClass: 'badge-pink',
    Icon: Share2,
  },
  {
    name: 'Client Brief',
    route: '/client-brief',
    description: 'Turn client intake into detailed project briefs.',
    badge: 'Strategy',
    badgeClass: 'badge-cyan',
    Icon: ClipboardList,
  },
  {
    name: 'Ad Creative',
    route: '/ad-creative',
    description: 'Concept Meta, TikTok, and Google ad campaigns.',
    badge: 'Advertising',
    badgeClass: 'badge-pink',
    Icon: Megaphone,
  },
  {
    name: 'Content Writer',
    route: '/content-writer',
    description: 'Write case studies, web copy, and service pages.',
    badge: 'Copywriting',
    badgeClass: 'badge-violet',
    Icon: PenTool,
  },
  {
    name: 'Pricing',
    route: '/pricing',
    description: 'Price projects and generate formal proposals.',
    badge: 'Business',
    badgeClass: 'badge-cyan',
    Icon: Tag,
  },
  {
    name: 'Prospector',
    route: '/prospector',
    description: 'Find ideal clients and generate outreach sequences.',
    badge: 'Sales',
    badgeClass: 'badge-orange',
    Icon: Target,
  },
  {
    name: 'Campaign Builder',
    route: '/campaign',
    description: 'Build full ad campaigns with copy, creatives, and strategy.',
    badge: 'Marketing',
    badgeClass: 'badge-pink',
    Icon: BarChart2,
  },
]

function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [autopilot, setAutopilot] = useState({ enabled: false })
  const [autopilotToggling, setAutopilotToggling] = useState(false)
  const [expandedJob, setExpandedJob] = useState(null)

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.ok ? r.json() : [])
      .then(data => setJobs((data || []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setJobsLoading(false))

    fetch('/api/autopilot')
      .then(r => r.ok ? r.json() : { enabled: false })
      .then(setAutopilot)
      .catch(() => {})
  }, [])

  async function toggleAutopilot() {
    if (autopilotToggling) return
    setAutopilotToggling(true)
    try {
      const res = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !autopilot.enabled }),
      })
      if (res.ok) setAutopilot(await res.json())
    } finally {
      setAutopilotToggling(false)
    }
  }

  const statusDotClass = {
    running: 'status-dot--running',
    done:    'status-dot--done',
    error:   'status-dot--error',
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Command Center</div>
        <h1 className="page-title">SQUIRES SOLUTIONS</h1>
        <p className="page-subtitle">
          8 AI agents running your graphics operation. Pick an agent or enable autopilot below.
        </p>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card stat-card-accent">
          <div className="card-label">Total Jobs</div>
          <div className="card-value">{jobsLoading ? '—' : jobs.length}</div>
          <div className="card-muted">this session</div>
        </div>
        <div className="stat-card stat-card-pink">
          <div className="card-label">Active Agents</div>
          <div className="card-value">8</div>
          <div className="card-muted">ready to run</div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="card-label">Autopilot</div>
          <div className="card-value" style={{ fontSize: 20, paddingTop: 6 }}>
            {autopilot.enabled ? 'ON' : 'OFF'}
          </div>
          <div className="card-muted">content scheduling</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="card-label">Completed</div>
          <div className="card-value">
            {jobsLoading ? '—' : jobs.filter(j => j.status === 'done').length}
          </div>
          <div className="card-muted">successful runs</div>
        </div>
      </div>

      {/* Agent grid */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Agents</div>
          <span className="badge badge-muted">8 active</span>
        </div>
        <div className="action-grid">
          {AGENTS.map(agent => (
            <Link key={agent.route} to={agent.route} className="action-card">
              <div className="action-card-icon">
                <agent.Icon size={22} strokeWidth={1.5} />
              </div>
              <div className="action-card-title">{agent.name}</div>
              <div className="action-card-desc">{agent.description}</div>
              <div style={{ marginTop: 12 }}>
                <span className={`badge ${agent.badgeClass}`}>{agent.badge}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent jobs */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Recent Jobs</div>
        </div>
        {jobsLoading && <div className="loading-row"><div className="loading-spinner" /> Loading jobs…</div>}
        {!jobsLoading && jobs.length === 0 && (
          <p className="text-muted" style={{ padding: '8px 0' }}>No jobs yet. Run an agent to get started.</p>
        )}
        {!jobsLoading && jobs.length > 0 && jobs.map(job => {
          const isExp = expandedJob === job.id
          let parsedOutput = null
          if (isExp && job.output) {
            try {
              const m = job.output.match(/```(?:json)?\s*([\s\S]*?)```/) || job.output.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
              if (m) parsedOutput = JSON.parse(m[1] || m[0])
            } catch {}
          }
          return (
            <div key={job.id}>
              <div
                className="job-row"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setExpandedJob(isExp ? null : job.id)}
              >
                <span className={`status-dot ${statusDotClass[job.status] || ''}`} />
                <span className="job-row-label">{job.agentName || job.agent}</span>
                <span className="job-row-time">{formatTime(job.startedAt)}</span>
                <div className="job-row-status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${job.status === 'done' ? 'badge-green' : job.status === 'running' ? 'badge-orange' : 'badge-muted'}`}>
                    {job.status}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{isExp ? '▲' : '▼'}</span>
                </div>
              </div>
              {isExp && (
                <div style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)', padding: '16px 20px', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Job ID:</span> <span style={{ color: 'var(--muted2)', fontFamily: 'monospace' }}>{job.id}</span></div>
                    <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Agent:</span> <span style={{ color: 'var(--text)' }}>{job.agentName}</span></div>
                    <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Started:</span> <span style={{ color: 'var(--text)' }}>{formatTime(job.startedAt)}</span></div>
                    {job.finishedAt && <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Finished:</span> <span style={{ color: 'var(--text)' }}>{formatTime(job.finishedAt)}</span></div>}
                    <div><span style={{ color: 'var(--muted)', fontWeight: 600 }}>Status:</span> <span className={`badge ${job.status === 'done' ? 'badge-green' : job.status === 'running' ? 'badge-orange' : 'badge-muted'}`}>{job.status}</span></div>
                  </div>
                  {job.error && (
                    <div style={{ background: 'rgba(229,90,90,0.08)', border: '1px solid rgba(229,90,90,0.2)', borderRadius: 6, padding: '10px 14px', color: 'var(--red)', marginBottom: 10, fontSize: 12 }}>
                      <strong>Error:</strong> {job.error}
                    </div>
                  )}
                  {job.input && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ color: 'var(--muted)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 10, marginBottom: 6 }}>Input Prompt</div>
                      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', color: 'var(--muted2)', whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto', lineHeight: 1.6 }}>
                        {job.input.slice(0, 400)}{job.input.length > 400 ? '…' : ''}
                      </div>
                    </div>
                  )}
                  {parsedOutput && (
                    <div>
                      <div style={{ color: 'var(--muted)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 10, marginBottom: 6 }}>Output Preview</div>
                      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', color: 'var(--accent2)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 11, maxHeight: 160, overflowY: 'auto', lineHeight: 1.6 }}>
                        {JSON.stringify(parsedOutput, null, 2).slice(0, 800)}
                        {JSON.stringify(parsedOutput, null, 2).length > 800 ? '\n…' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Autopilot */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Autopilot</div>
          <span className={`badge ${autopilot.enabled ? 'badge-green' : 'badge-muted'}`}>
            {autopilot.enabled ? 'Running' : 'Idle'}
          </span>
        </div>
        <p className="text-muted2" style={{ marginBottom: 20, fontSize: 13 }}>
          When enabled, the system will automatically generate social content on a schedule.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            className="autopilot-toggle"
            onClick={!autopilotToggling ? toggleAutopilot : undefined}
          >
            <div className={`autopilot-toggle-track ${autopilot.enabled ? 'on' : ''}`}>
              <div className="autopilot-toggle-thumb" />
            </div>
            <div>
              <div className="autopilot-toggle-label">
                {autopilot.enabled ? 'Autopilot Active' : 'Autopilot Disabled'}
              </div>
              <div className="autopilot-toggle-sub">
                {autopilot.enabled ? 'Generating social content hourly' : 'Click to enable scheduling'}
              </div>
            </div>
          </div>
          {autopilotToggling && <div className="loading-spinner" />}
        </div>
      </div>
    </div>
  )
}
