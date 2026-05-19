import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
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

function AppShell() {
  const isMobile = () => window.innerWidth < 768
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile())
  const location = useLocation()

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile()) setSidebarOpen(false)
  }, [location])

  // Close on resize to mobile
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
      {/* Mobile overlay backdrop */}
      {sidebarOpen && isMobile() && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onToggle={toggle} />

      {/* Mobile top bar */}
      <header className="mobile-topbar">
        <button className="hamburger" onClick={toggle} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
        <div className="mobile-topbar-logo">SQUIRES GRAPHICS</div>
        <div style={{ width: 40 }} />
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/brand-studio" element={<BrandStudio />} />
          <Route path="/social-content" element={<SocialContent />} />
          <Route path="/client-brief" element={<ClientBrief />} />
          <Route path="/ad-creative" element={<AdCreative />} />
          <Route path="/content-writer" element={<ContentWriter />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/prospector" element={<Prospector />} />
          <Route path="/campaign" element={<CampaignBuilder />} />
          <Route path="/clients" element={<ClientTracker />} />
          <Route path="/invoices" element={<InvoiceGenerator />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
