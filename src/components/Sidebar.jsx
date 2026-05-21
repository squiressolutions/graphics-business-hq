import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Palette,
  Share2,
  ClipboardList,
  Megaphone,
  PenTool,
  Tag,
  Target,
  BarChart2,
  Users,
  Receipt,
  Wallet,
  FileText,
  Inbox,
  FolderOpen,
} from 'lucide-react'

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'AI Agents',
    items: [
      { to: '/brand-studio',   icon: Palette,        label: 'Brand Studio' },
      { to: '/social-content', icon: Share2,          label: 'Social Content' },
      { to: '/client-brief',   icon: ClipboardList,   label: 'Client Brief' },
      { to: '/ad-creative',    icon: Megaphone,       label: 'Ad Creative' },
      { to: '/content-writer', icon: PenTool,         label: 'Content Writer' },
      { to: '/pricing',        icon: Tag,             label: 'Pricing' },
      { to: '/prospector',     icon: Target,          label: 'Prospector' },
      { to: '/campaign',       icon: BarChart2,       label: 'Campaign Builder' },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/clients',   icon: Users,       label: 'Client Tracker' },
      { to: '/invoices',  icon: Receipt,     label: 'Invoices' },
      { to: '/expenses',  icon: Wallet,      label: 'Expenses' },
      { to: '/contracts', icon: FileText,    label: 'Contracts' },
      { to: '/requests',  icon: Inbox,       label: 'Client Requests' },
      { to: '/uploads',   icon: FolderOpen,  label: 'Client Uploads' },
    ],
  },
]

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link to="/dashboard" className="sidebar-logo-mark" style={{ textDecoration: 'none' }}>
          <div className="sidebar-logo-icon">◈</div>
          {isOpen && (
            <div className="sidebar-logo-text-wrap">
              <div className="sidebar-logo-text">SQUIRES</div>
              <div className="sidebar-logo-sub">Solutions</div>
            </div>
          )}
        </Link>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {isOpen ? '‹' : '›'}
        </button>
      </div>

      {navSections.map(section => (
        <div className="sidebar-section" key={section.label}>
          {isOpen && <div className="sidebar-section-label">{section.label}</div>}
          <nav className="sidebar-nav">
            {section.items.map(item => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={!isOpen ? item.label : undefined}
                  className={({ isActive }) =>
                    'sidebar-nav-item' + (isActive ? ' active' : '')
                  }
                >
                  <span className="nav-icon">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  {isOpen && <span className="nav-label">{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>
        </div>
      ))}

      <div className="sidebar-footer">
        {isOpen ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Powered by Claude AI</div>
            <div style={{ fontSize: 10, color: 'var(--border2)' }}>v1.2.0 · 8 Agents</div>
          </>
        ) : (
          <div style={{ fontSize: 10, color: 'var(--border2)', textAlign: 'center' }}>SS</div>
        )}
      </div>
    </aside>
  )
}
