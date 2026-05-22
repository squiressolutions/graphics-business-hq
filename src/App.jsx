import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import BrandStudio from './pages/BrandStudio'
import SocialContent from './pages/SocialContent'
import ClientBrief from './pages/ClientBrief'
import AdCreative from './pages/AdCreative'
import ContentWriter from './pages/ContentWriter'
import Pricing from './pages/Pricing'
import Prospector from './pages/Prospector'
import CampaignBuilder from './pages/CampaignBuilder'
import ClientTracker from './pages/ClientTracker'
import InvoiceGenerator from './pages/InvoiceGenerator'
import ExpenseTracker from './pages/ExpenseTracker'
import ContractBuilder from './pages/ContractBuilder'
import ClientPortal from './pages/ClientPortal'
import ClientRequests from './pages/ClientRequests'
import Uploads from './pages/Uploads'

// ─── Admin Password Gate ──────────────────────────────────────────────────────
const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD || 'Chase0613'

function AdminGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_auth') === '1')
  const [input, setInput]   = useState('')
  const [shake, setShake]   = useState(false)
  const [hidden, setHidden] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => { if (!authed) setTimeout(() => inputRef.current?.focus(), 80) }, [authed])

  function submit(e) {
    e.preventDefault()
    if (input === ADMIN_PW) {
      sessionStorage.setItem('admin_auth', '1')
      setAuthed(true)
    } else {
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 600)
    }
  }

  if (authed) return children

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <form onSubmit={submit} style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 360,
        textAlign: 'center',
        animation: shake ? 'adminShake 0.5s ease' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Lock size={36} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.06em',
          color: 'var(--text)', marginBottom: 6,
        }}>ADMIN ACCESS</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
          Squires Solutions · Internal Portal
        </p>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            ref={inputRef}
            type={hidden ? 'password' : 'text'}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: 8, padding: '11px 40px 11px 14px',
              fontSize: 14, color: 'var(--text)', outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setHidden(h => !h)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 13, padding: 0,
            }}
          >{hidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Unlock
        </button>
      </form>
      <style>{`
        @keyframes adminShake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  )
}

function AppShell() {
  const isMobile = () => window.innerWidth < 768
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile())
  const location = useLocation()

  useEffect(() => {
    if (isMobile()) setSidebarOpen(false)
  }, [location])

  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 768) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function toggle() { setSidebarOpen(o => !o) }

  return (
    <div className="app-shell" data-sidebar={sidebarOpen ? 'open' : 'closed'}>
      {sidebarOpen && isMobile() && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onToggle={toggle} />

      <header className="mobile-topbar">
        <button className="hamburger" onClick={toggle} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
        <div className="mobile-topbar-logo">SQUIRES SOLUTIONS</div>
        <div style={{ width: 40 }} />
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/brand-studio" element={<BrandStudio />} />
          <Route path="/admin/social-content" element={<SocialContent />} />
          <Route path="/admin/client-brief" element={<ClientBrief />} />
          <Route path="/admin/ad-creative" element={<AdCreative />} />
          <Route path="/admin/content-writer" element={<ContentWriter />} />
          <Route path="/admin/pricing" element={<Pricing />} />
          <Route path="/admin/prospector" element={<Prospector />} />
          <Route path="/admin/campaign" element={<CampaignBuilder />} />
          <Route path="/admin/clients" element={<ClientTracker />} />
          <Route path="/admin/invoices" element={<InvoiceGenerator />} />
          <Route path="/admin/expenses" element={<ExpenseTracker />} />
          <Route path="/admin/contracts" element={<ContractBuilder />} />
          <Route path="/admin/requests" element={<ClientRequests />} />
          <Route path="/admin/uploads" element={<Uploads />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
        <Footer />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientPortal />} />
        <Route path="/portal" element={<Navigate to="/" replace />} />
        <Route path="/portal/*" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/*" element={<AdminGate><AppShell /></AdminGate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
