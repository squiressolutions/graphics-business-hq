import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
