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
      { to: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'AI Agents',
    items: [
      { to: '/admin/brand-studio',   icon: Palette,        label: 'Brand Studio' },
      { to: '/admin/social-content', icon: Share2,          label: 'Social Content' },
      { to: '/admin/client-brief',   icon: ClipboardList,   label: 'Client Brief' },
      { to: '/admin/ad-creative',    icon: Megaphone,       label: 'Ad Creative' },
      { to: '/admin/content-writer', icon: PenTool,         label: 'Content Writer' },
      { to: '/admin/pricing',        icon: Tag,             label: 'Pricing' },
      { to: '/admin/prospector',     icon: Target,          label: 'Prospector' },
      { to: '/admin/campaign',       icon: BarChart2,       label: 'Campaign Builder' },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/admin/clients',   icon: Users,       label: 'Client Tracker' },
      { to: '/admin/invoices',  icon: Receipt,     label: 'Invoices' },
      { to: '/admin/expenses',  icon: Wallet,      label: 'Expenses' },
      { to: '/admin/contracts', icon: FileText,    label: 'Contracts' },
      { to: '/admin/requests',  icon: Inbox,       label: 'Client Requests' },
      { to: '/admin/uploads',   icon: FolderOpen,  label: 'Client Uploads' },
    ],
  },
]

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link to="/admin/dashboard" className="sidebar-logo-mark" style={{ textDecoration: 'none' }}>
          <img src="/logo.png" alt="Squires Solutions" className="sidebar-logo-icon" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />
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
          <img src="/logo.png" alt="SS" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 3, opacity: 0.6 }} />
        )}
      </div>
    </aside>
  )
}
