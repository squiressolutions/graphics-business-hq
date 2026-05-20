import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const AGENTS = [
  {
    name: 'Brand Studio',
    route: '/brand-studio',
    description: 'Create brand identities, palettes, and logo concepts.',
    badge: 'Branding',
    badgeClass: 'badge-violet',
    icon: '◈',
  },
  {
    name: 'Social Content',
    route: '/social-content',
    description: 'Generate posts, captions, and content calendars.',
    badge: 'Social',
    badgeClass: 'badge-pink',
    icon: '◉',
  },
  {
    name: 'Client Brief',
    route: '/client-brief',
    description: 'Turn client intake into detailed project briefs.',
    badge: 'Strategy',
    badgeClass: 'badge-cyan',
    icon: '◻',
  },
  {
    name: 'Ad Creative',
    route: '/ad-creative',
    description: 'Concept Meta, TikTok, and Google ad campaigns.',
    badge: 'Advertising',
    badgeClass: 'badge-pink',
    icon: '◆',
  },
  {
    name: 'Content Writer',
    route: '/content-writer',
    description: 'Write case studies, web copy, and service pages.',
    badge: 'Copywriting',
    badgeClass: 'badge-violet',
    icon: '◇',
  },
  {
    name: 'Pricing',
    route: '/pricing',
    description: 'Price projects and generate formal proposals.',
    badge: 'Business',
    badgeClass: 'badge-cyan',
    icon: '◎',
  },
  {
    name: 'Prospector',
    route: '/prospector',
    description: 'Find ideal clients and generate outreach sequences.',
    badge: 'Sales',
    badgeClass: 'badge-orange',
    icon: '🎯',
  },
  {
    name: 'Campaign Builder',
    route: '/campaign',
    description: 'Build full ad campaigns with copy, creatives, and strategy.',
    badge: 'Marketing',
    badgeClass: 'badge-pink',
    icon: '📊',
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
              <div className="action-card-icon">{agent.icon}</div>
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
        {!jobsLoading && jobs.length > 0 && jobs.map(job => (
          <div key={job.id} className="job-row">
            <span className={`status-dot ${statusDotClass[job.status] || ''}`} />
            <span className="job-row-label">{job.agent}</span>
            <span className="job-row-time">{formatTime(job.startedAt)}</span>
            <div className="job-row-status">
              <span className={`badge ${job.status === 'done' ? 'badge-green' : job.status === 'running' ? 'badge-orange' : 'badge-muted'}`}>
                {job.status}
              </span>
            </div>
          </div>
        ))}
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
