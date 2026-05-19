import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard',      icon: '⬡',  label: 'Dashboard' },
  { to: '/brand-studio',   icon: '◈',  label: 'Brand Studio' },
  { to: '/social-content', icon: '◉',  label: 'Social Content' },
  { to: '/client-brief',   icon: '◻',  label: 'Client Brief' },
  { to: '/ad-creative',    icon: '◆',  label: 'Ad Creative' },
  { to: '/content-writer', icon: '◇',  label: 'Content Writer' },
  { to: '/pricing',        icon: '◎',  label: 'Pricing' },
  { to: '/prospector',    icon: '🎯',  label: 'Prospector' },
  { to: '/campaign',      icon: '📊',  label: 'Campaign Builder' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">◈</div>
          <div>
            <div className="sidebar-logo-text">GRAFIQ</div>
            <div className="sidebar-logo-sub">Business HQ</div>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                'sidebar-nav-item' + (isActive ? ' active' : '')
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
          Powered by Claude AI
        </div>
        <div style={{ fontSize: 11, color: 'var(--border2)' }}>v1.0.0</div>
      </div>
    </aside>
  )
}
