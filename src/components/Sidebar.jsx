import { NavLink } from 'react-router-dom'

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
    ],
  },
  {
    label: 'AI Agents',
    items: [
      { to: '/brand-studio',   icon: '◈', label: 'Brand Studio' },
      { to: '/social-content', icon: '◉', label: 'Social Content' },
      { to: '/client-brief',   icon: '◻', label: 'Client Brief' },
      { to: '/ad-creative',    icon: '◆', label: 'Ad Creative' },
      { to: '/content-writer', icon: '◇', label: 'Content Writer' },
      { to: '/pricing',        icon: '◎', label: 'Pricing' },
      { to: '/prospector',     icon: '🎯', label: 'Prospector' },
      { to: '/campaign',       icon: '📊', label: 'Campaign Builder' },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/clients',  icon: '👥', label: 'Client Tracker' },
      { to: '/invoices', icon: '🧾', label: 'Invoices' },
    ],
  },
]

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">◈</div>
          {isOpen && (
            <div className="sidebar-logo-text-wrap">
              <div className="sidebar-logo-text">SQUIRES</div>
              <div className="sidebar-logo-sub">Graphics Studio</div>
            </div>
          )}
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {isOpen ? '‹' : '›'}
        </button>
      </div>

      {navSections.map(section => (
        <div className="sidebar-section" key={section.label}>
          {isOpen && <div className="sidebar-section-label">{section.label}</div>}
          <nav className="sidebar-nav">
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                title={!isOpen ? item.label : undefined}
                className={({ isActive }) =>
                  'sidebar-nav-item' + (isActive ? ' active' : '')
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {isOpen && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}

      <div className="sidebar-footer">
        {isOpen ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Powered by Claude AI</div>
            <div style={{ fontSize: 10, color: 'var(--border2)' }}>v1.0.0 · 8 Agents</div>
          </>
        ) : (
          <div style={{ fontSize: 10, color: 'var(--border2)', textAlign: 'center' }}>SG</div>
        )}
      </div>
    </aside>
  )
}
