import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingBag, ClipboardList, CreditCard, Palette, PenTool,
  Share2, Monitor, Package, Megaphone, RefreshCw, Lock,
  CheckCircle, Mail, CalendarDays, MessageSquare, Upload,
  Download, FileText, Image, ExternalLink, Star, X, User, Award, Target, Heart,
} from 'lucide-react'

// ─── Portfolio data from behance.net/kc144 ───────────────────────────────────
// TODO: Replace with live Behance API calls (requires API key from adobe.io)
//       when a key is available. For now, thumbnails and links are hardcoded
//       from the public profile page.
const PORTFOLIO = [
  { id: 1, title: 'Summit & Stone Realty Brand Identity', cat: 'Logo & Brand Identity', url: 'https://www.behance.net/gallery/244456217/Summit-Stone-Realty-Brand-Identity',       thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/3148fc244456217.Y3JvcCwxMzA5LDEwMjQsMTEzLDA.png' },
  { id: 2, title: 'Hive Café Rebrand',                    cat: 'Logo & Brand Identity', url: 'https://www.behance.net/gallery/244456151/Hive-Caf-Rebrand',                          thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/bcef4e244456151.Y3JvcCwxMzA5LDEwMjQsMTEzLDA.png' },
  { id: 3, title: 'VM Marketing Co. Logo & Brand Mockups', cat: 'Logo & Brand Identity', url: 'https://www.behance.net/gallery/244324865/VM-Marketing-Co-Logo-Brand-Mockups',        thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/f640de244324865.Y3JvcCwxMzA5LDEwMjQsMTEzLDA.png' },
  { id: 4, title: 'LUMIÉ Seoul Skincare Packaging',        cat: 'Print & Layout',        url: 'https://www.behance.net/gallery/244456345/LUMIE-Seoul-Skincare-Packaging-Design',     thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/08c4a2244456345.Y3JvcCwxMzA5LDEwMjQsMTEzLDA.png' },
  { id: 5, title: 'SPORTS Magazine Cover & Spread',        cat: 'Print & Layout',        url: 'https://www.behance.net/gallery/244456321/SPORTS-Magazine-Cover-Spread',              thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/8addc1244456321.Y3JvcCwxMDI0LDgwMCwwLDM2Nw.png' },
  { id: 6, title: 'Arial Typeface Poster',                 cat: 'Print & Layout',        url: 'https://www.behance.net/gallery/176281171/Arial-Type-Face-Poster',                    thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/94f3c5176281171.Y3JvcCwxMDIyLDgwMCw4OCww.jpg' },
  { id: 7, title: 'St. Louis Zoo Brochure',                cat: 'Print & Layout',        url: 'https://www.behance.net/gallery/175732589/St-Louis-Zoo-Brochure',                     thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/12463a175732589.Y3JvcCw4NjIsNjc1LDE2OCww.jpg' },
  { id: 8, title: 'Nexora Marketing Website Concept',      cat: 'Digital & Web',         url: 'https://www.behance.net/gallery/244323959/Nexora-Marketing-Website-Concept',          thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/bc74a9244323959.Y3JvcCw5MTEsNzEyLDE0NCw0Mg.png' },
  { id: 9, title: 'Blaze Energy Drink Launch Campaign',    cat: 'Digital & Web',         url: 'https://www.behance.net/gallery/244456189/Blaze-Energy-Drink-Launch-Campaign',        thumb: 'https://mir-s3-cdn-cf.behance.net/projects/404/b57bce244456189.Y3JvcCwxMDI0LDgwMCwwLDM2Nw.png' },
]
const PORT_CATS = ['All', 'Logo & Brand Identity', 'Print & Layout', 'Digital & Web']

// ─── Testimonials (placeholder — replace with real client quotes) ─────────────
const TESTIMONIALS = [
  { name: 'Alex Rivera',    biz: 'Summit & Stone Realty',  stars: 5, quote: 'Keenan completely transformed our brand. The new identity is clean, professional, and exactly what we needed to stand out in a competitive market. The process was smooth and the results exceeded every expectation.' },
  { name: 'Maria Chen',     biz: 'Hive Café',              stars: 5, quote: 'We came in needing a rebrand and walked away with a full identity system that truly felt like us. Fast turnaround, excellent communication, and the final work was beyond anything we had imagined.' },
  { name: 'Jordan Williams', biz: 'Blaze Energy',          stars: 5, quote: 'The campaign visuals Keenan created for our launch were incredible. We saw a measurable lift in engagement from day one and the creative direction was exactly on brand. Highly recommend.' },
]

// ─── Services for request form ────────────────────────────────────────────────
const SERVICES_INTAKE = [
  { id: 'brand-identity',   Icon: Palette,    title: 'Brand Identity',     desc: 'Full brand system — logo, colors, typography, guidelines', from: 'From $1,197' },
  { id: 'logo-design',      Icon: PenTool,    title: 'Logo Design',         desc: 'Professional logo with revisions & source files',          from: 'From $497'   },
  { id: 'social-media-kit', Icon: Share2,     title: 'Social Media Kit',    desc: 'Templates & graphics for Instagram, TikTok, Facebook',    from: 'From $399'   },
  { id: 'website-design',   Icon: Monitor,    title: 'Website Design',      desc: 'Custom website — design, development & launch',           from: 'From $600'   },
  { id: 'print-design',     Icon: Package,    title: 'Print & Packaging',   desc: 'Business cards, flyers, packaging, signage & more',       from: 'From $799'   },
  { id: 'ad-creative',      Icon: Megaphone,  title: 'Ad Creative',         desc: 'Meta, TikTok & Google ad graphics and copy',              from: 'From $299'   },
  { id: 'full-rebrand',     Icon: RefreshCw,  title: 'Full Rebrand',        desc: 'Complete overhaul — strategy, identity, collateral & rollout', from: 'From $3,697' },
]

// Hidden from portal display — motion-graphics & photo-direction excluded
const HIDDEN_IDS = ['motion-graphics', 'logo-animation', 'photo-direction']

const BUDGETS   = ['Under $500','$500 – $1,000','$1,000 – $2,500','$2,500 – $5,000','$5,000 – $10,000','$10,000+','Not sure yet']
const TIMELINES = ['ASAP (rush)','1 – 2 weeks','2 – 4 weeks','1 – 2 months','2 – 3 months','Flexible']
const HEAR_ABOUT = ['Google Search','Instagram','TikTok','Referral / Word of mouth','LinkedIn','Other']

const FILE_ACCEPT = '.png,.jpg,.jpeg,.pdf'
const MAX_FILE_MB = 20
const MAX_TOTAL_MB = 50

function fmt(cents) { return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 }) }
function fmtSize(bytes) { return bytes < 1024*1024 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/1024/1024).toFixed(1)} MB` }
function blankContact() { return { name:'', business:'', email:'', phone:'', website:'' } }
function blankProject() { return { budget:'', timeline:'', description:'', inspiration:'', hearAbout:'' } }

const CAT = {
  package: { label: 'Packages',             color: 'var(--accent)'  },
  service: { label: 'À La Carte Services',  color: 'var(--accent3)' },
  addon:   { label: 'Additional Services',  color: 'var(--green)'   },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientPortal() {
  const [searchParams] = useSearchParams()
  const paymentStatus = searchParams.get('payment')
  const paidService   = searchParams.get('service')
  const [tab, setTab] = useState(paymentStatus ? 'pay' : 'about')

  // ── Catalog from API
  const [catalog, setCatalog]                   = useState([])
  const [stripeConfigured, setStripeConfigured] = useState(null)
  const [checkoutLoading, setCheckoutLoading]   = useState(null)
  const [checkoutError, setCheckoutError]       = useState(null)
  const [buyEmail, setBuyEmail]                 = useState('')
  const [showEmailFor, setShowEmailFor]         = useState(null)

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setCatalog).catch(() => setCatalog([]))
    fetch('/api/stripe-status').then(r => r.json()).then(d => setStripeConfigured(d.configured)).catch(() => setStripeConfigured(false))
  }, [])

  async function buyService(serviceId) {
    setCheckoutLoading(serviceId); setCheckoutError(null)
    try {
      const res  = await fetch('/api/checkout/service', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ serviceId, clientEmail: buyEmail }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed.')
      window.location.href = data.url
    } catch (err) { setCheckoutError(err.message) }
    finally { setCheckoutLoading(null) }
  }

  // ── Invoice pay
  const [pay, setPay]       = useState({ invoiceNumber:'', amount:'', email:'', description:'' })
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState(null)
  function payChange(e) { const {name,value}=e.target; setPay(p=>({...p,[name]:value})) }
  async function startPayment(e) {
    e.preventDefault(); setPaying(true); setPayError(null)
    try {
      const res  = await fetch('/api/checkout/invoice', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(pay) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed.')
      window.location.href = data.url
    } catch (err) { setPayError(err.message) }
    finally { setPaying(false) }
  }

  // ── Consultation
  const [consult, setConsult]               = useState({ name:'', email:'', phone:'', business:'', topic:'', preferredTime:'' })
  const [consultSubmitting, setConsultSubmitting] = useState(false)
  const [consultSubmitted, setConsultSubmitted]   = useState(false)
  const [consultError, setConsultError]           = useState(null)
  function consultChange(e) { const {name,value}=e.target; setConsult(p=>({...p,[name]:value})) }
  async function submitConsult(e) {
    e.preventDefault(); setConsultSubmitting(true); setConsultError(null)
    try {
      const res = await fetch('/api/client-intake', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...consult, type:'consultation', services:['Free Consultation'] }) })
      if (!res.ok) throw new Error('Submission failed. Please try again.')
      setConsultSubmitted(true)
    } catch (err) { setConsultError(err.message) }
    finally { setConsultSubmitting(false) }
  }

  // ── Intake
  const [step, setStep]         = useState(1)
  const [services, setServices] = useState([])
  const [project, setProject]   = useState(blankProject())
  const [contact, setContact]   = useState(blankContact())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [refNum, setRefNum]         = useState('')
  const [intakeError, setIntakeError] = useState(null)
  function toggleService(id) { setServices(prev => prev.includes(id) ? prev.filter(s=>s!==id) : [...prev,id]) }
  function projChange(e)    { const {name,value}=e.target; setProject(p=>({...p,[name]:value})) }
  function contactChange(e) { const {name,value}=e.target; setContact(p=>({...p,[name]:value})) }
  async function submitIntake() {
    setSubmitting(true); setIntakeError(null)
    try {
      const res  = await fetch('/api/client-intake', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ services: services.map(id=>SERVICES_INTAKE.find(s=>s.id===id)?.title).filter(Boolean), ...project, ...contact }) })
      if (!res.ok) throw new Error('Submission failed. Please try again.')
      const data = await res.json()
      setRefNum(data.refNum || ''); setSubmitted(true)
    } catch (err) { setIntakeError(err.message) }
    finally { setSubmitting(false) }
  }

  // ── Contact
  const [msg, setMsg]         = useState({ name:'', email:'', phone:'', message:'' })
  const [msgSending, setMsgSending] = useState(false)
  const [msgSent, setMsgSent]       = useState(false)
  const [msgError, setMsgError]     = useState(null)
  function msgChange(e) { const {name,value}=e.target; setMsg(p=>({...p,[name]:value})) }
  async function sendMsg(e) {
    e.preventDefault(); setMsgSending(true); setMsgError(null)
    try {
      const res = await fetch('/api/portal/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(msg) })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to send.')
      setMsgSent(true)
    } catch (err) { setMsgError(err.message) }
    finally { setMsgSending(false) }
  }

  // ── Portfolio filter
  const [portCat, setPortCat] = useState('All')

  const groupedCatalog = ['package','service','addon'].map(cat => ({
    cat, items: catalog.filter(s => s.category === cat && !HIDDEN_IDS.includes(s.id)),
  })).filter(g => g.items.length > 0)

  const selectedServices = SERVICES_INTAKE.filter(s => services.includes(s.id))
  const filteredPortfolio = portCat === 'All' ? PORTFOLIO : PORTFOLIO.filter(p => p.cat === portCat)

  const NAV = [
    { section: 'Services', items: [
      { key:'about',    Icon: User,         label: 'About' },
      { key:'services', Icon: ShoppingBag,  label: 'Services & Pricing' },
      { key:'work',     Icon: Image,        label: 'My Work' },
    ]},
    { section: 'Work Together', items: [
      { key:'intake',  Icon: ClipboardList, label: 'Request a Project' },
      { key:'consult', Icon: CalendarDays,  label: 'Free Consultation' },
      { key:'contact', Icon: MessageSquare, label: 'Contact' },
    ]},
    { section: 'Client Area', items: [
      { key:'files', Icon: Upload,    label: 'Files' },
      { key:'pay',   Icon: CreditCard, label: 'Pay Invoice' },
    ]},
  ]

  return (
    <div className="portal-shell">
      <PortalHeader />

      <div className="portal-body">
        {/* ── Left sidebar nav */}
        <nav className="portal-sidenav">
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <div className="portal-sidenav-label">{section}</div>
              {items.map(({ key, Icon: NavIcon, label }) => (
                <button
                  key={key}
                  className={`portal-sidenav-item ${tab===key?'active':''}`}
                  onClick={() => { setTab(key); if(key==='consult') setConsultSubmitted(false) }}
                >
                  <NavIcon size={15} strokeWidth={1.75} />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Right content */}
        <div className="portal-tab-content">

        {/* ══════════════════ ABOUT TAB ══════════════════ */}
        {tab === 'about' && (
          <div>
            {/* Hero */}
            <div style={{ display:'flex', alignItems:'center', gap:28, marginBottom:40, flexWrap:'wrap' }}>
              <img src="/logo.png" alt="Squires Solutions" style={{ width:96, height:96, objectFit:'contain', borderRadius:16, background:'#111', padding:10, flexShrink:0 }} />
              <div>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:36, letterSpacing:'0.06em', color:'var(--text)', lineHeight:1.1, marginBottom:6 }}>KEENAN SQUIRES</h1>
                <div style={{ fontSize:14, color:'var(--accent)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Founder · Squires Solutions</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Stevens — Institute of Business & Arts','B.S. Graphic Design','Google Certified — SEO & Digital Marketing','Web Development','Scrum & Agile','Brand Identity','Ad Creative'].map(tag => (
                    <span key={tag} style={{ fontSize:11, background:'rgba(212,160,23,0.1)', border:'1px solid rgba(212,160,23,0.25)', color:'var(--accent2)', borderRadius:20, padding:'3px 10px' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="portal-card" style={{ marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <User size={16} color="var(--accent)" />
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, letterSpacing:'0.05em', color:'var(--text)' }}>MY STORY</h3>
              </div>
              <p style={{ fontSize:14, color:'var(--muted2)', lineHeight:1.9, marginBottom:14 }}>
                I'm Keenan Squires — a graphic designer, brand strategist, and the founder of Squires Solutions. I graduated from Stevens — The Institute of Business & Arts with a Bachelor's degree in Graphic Design, and hold certifications in SEO & Digital Marketing from Google, Web Development, Scrum Methodology, and Agile. That combination of creative training and technical know-how means I can take a brand from concept all the way to a live, optimized web presence.
              </p>
              <p style={{ fontSize:14, color:'var(--muted2)', lineHeight:1.9 }}>
                Squires Solutions was built on one belief: every business deserves a brand that looks as good as the work behind it. Whether you're a startup finding your identity or an established business ready for a fresh look, I bring the same level of care, precision, and passion to every project — no matter the size.
              </p>
            </div>

            {/* Values grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:24 }}>
              <div className="portal-card" style={{ borderTop:'2px solid var(--accent)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Heart size={16} color="var(--accent)" />
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>People First</div>
                </div>
                <p style={{ fontSize:13, color:'var(--muted2)', lineHeight:1.8 }}>
                  I genuinely care about the people I work with. My goal isn't just to deliver a logo — it's to help your business grow and make sure you walk away confident and proud of what we built together.
                </p>
              </div>
              <div className="portal-card" style={{ borderTop:'2px solid var(--accent)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Target size={16} color="var(--accent)" />
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>Everyone Wins</div>
                </div>
                <p style={{ fontSize:13, color:'var(--muted2)', lineHeight:1.8 }}>
                  I don't measure success by what I produce — I measure it by your results. When your brand connects with your audience and drives real outcomes, that's the win I'm after. Your success is my success.
                </p>
              </div>
              <div className="portal-card" style={{ borderTop:'2px solid var(--accent)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Award size={16} color="var(--accent)" />
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>Quality Without Compromise</div>
                </div>
                <p style={{ fontSize:13, color:'var(--muted2)', lineHeight:1.8 }}>
                  Every project gets my full attention — from first brief to final file. I combine design fundamentals with modern strategy to make sure what I deliver isn't just beautiful, but built to perform.
                </p>
              </div>
            </div>

            {/* Credentials */}
            <div className="portal-card" style={{ marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <Award size={16} color="var(--accent)" />
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, letterSpacing:'0.05em', color:'var(--text)' }}>EDUCATION & CREDENTIALS</h3>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { title: 'B.S. Graphic Design — Stevens, The Institute of Business & Arts', sub: 'Formal training in visual communication, typography, layout, branding, and design theory.' },
                  { title: 'Google Certificate — SEO & Digital Marketing', sub: 'Certified in search engine optimization, digital advertising, analytics, and growth marketing strategy.' },
                  { title: 'Web Development Certificate', sub: 'Certified in front-end and web development — bringing designs to life with real, functional code.' },
                  { title: 'Scrum Methodology & Agile Certificate', sub: 'Trained in Agile project management and Scrum frameworks — keeping projects on track, on time, and on budget.' },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start', paddingBottom:14, borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', marginTop:6, flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{item.title}</div>
                      <div style={{ fontSize:13, color:'var(--muted2)', lineHeight:1.7 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button className="portal-btn portal-btn-primary" onClick={() => setTab('intake')}>Start a Project →</button>
              <button className="portal-btn portal-btn-ghost" onClick={() => { setTab('consult'); setConsultSubmitted(false) }}>Book a Free Consultation</button>
              <a href="https://www.behance.net/kc144" target="_blank" rel="noreferrer" className="portal-btn portal-btn-ghost">
                <ExternalLink size={13} style={{ marginRight:4 }} /> View My Work on Behance
              </a>
            </div>
          </div>
        )}

        {/* ══════════════════ SERVICES TAB ══════════════════ */}
        {tab === 'services' && (
          <div>
            {/* Free Consultation banner — only on Services tab */}
            <div className="portal-consult-banner">
              <div className="portal-consult-text">
                <div className="portal-consult-title">Not sure where to start?</div>
                <div className="portal-consult-sub">Book a free 30-min consultation — no commitment, no pressure.</div>
              </div>
              <button className="portal-consult-btn" onClick={() => { setTab('consult'); setConsultSubmitted(false) }}>
                <CalendarDays size={15} strokeWidth={1.75} /> Book Free Consultation
              </button>
            </div>

            {paymentStatus === 'success' && (
              <div className="portal-pay-success" style={{ marginBottom: 24 }}>
                <CheckCircle size={32} color="#3DD68C" style={{ marginBottom: 6 }} />
                <div style={{ fontWeight:700, color:'#3DD68C', fontSize:15 }}>Payment Successful!</div>
                {paidService && catalog.find(s=>s.id===paidService) && (
                  <div style={{ fontSize:13, color:'var(--muted2)', marginTop:4 }}>
                    Thank you for purchasing <strong>{catalog.find(s=>s.id===paidService)?.name}</strong>. We'll be in touch within 24 hours.
                  </div>
                )}
              </div>
            )}

            {checkoutError && <div className="portal-error" style={{ marginBottom:16 }}>{checkoutError}</div>}

            {showEmailFor && (
              <div className="portal-card" style={{ marginBottom:20, maxWidth:480 }}>
                <div className="portal-step-header" style={{ marginBottom:16 }}>
                  <h2 className="portal-step-title" style={{ fontSize:20 }}>{catalog.find(s=>s.id===showEmailFor)?.name}</h2>
                  <p className="portal-step-sub">Enter your email for the receipt, then proceed to checkout.</p>
                </div>
                <div className="portal-form-group">
                  <label className="portal-label">Email (optional)</label>
                  <input type="email" className="portal-input" value={buyEmail} onChange={e=>setBuyEmail(e.target.value)} placeholder="you@yourbusiness.com" />
                </div>
                <div style={{ display:'flex', gap:10, marginTop:8 }}>
                  <button className="portal-btn portal-btn-primary" style={{ flex:1, justifyContent:'center' }}
                    onClick={() => { buyService(showEmailFor); setShowEmailFor(null) }}
                    disabled={checkoutLoading === showEmailFor}>
                    {checkoutLoading === showEmailFor ? <><span className="portal-spinner" /> Redirecting…</> : `Pay ${fmt(catalog.find(s=>s.id===showEmailFor)?.price||0)}`}
                  </button>
                  <button className="portal-btn portal-btn-ghost" onClick={() => setShowEmailFor(null)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Website Tier — special card (first) */}
            <div style={{ marginBottom:40 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.04em', color:'var(--text)' }}>Website</h3>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>
              <div className="portal-website-card">
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:16 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.04em', color:'var(--text)', marginBottom:6 }}>Custom Website Build</div>
                    <div style={{ fontSize:13, color:'var(--muted2)', lineHeight:1.7, maxWidth:440 }}>
                      A fully custom website built to represent your brand. Includes design, development, and launch. The monthly fee covers hosting, updates, and ongoing support.
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, color:'var(--red)', textDecoration:'line-through', marginBottom:2 }}>$997</div>
                    <div style={{ fontSize:38, fontFamily:'var(--font-display)', color:'var(--accent)', letterSpacing:'0.02em', lineHeight:1 }}>$600</div>
                    <div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>upfront build</div>
                    <div style={{ fontSize:16, color:'var(--accent2)', fontWeight:700, marginTop:6 }}>+ $63 / mo</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>hosting & support</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
                  {['Custom design (up to 5 pages)','Mobile responsive','SEO-ready structure','Contact form & integrations','Monthly content updates','Hosting & maintenance'].map(f => (
                    <span key={f} style={{ fontSize:12, background:'rgba(212,160,23,0.1)', border:'1px solid rgba(212,160,23,0.25)', color:'var(--accent2)', borderRadius:20, padding:'3px 10px' }}>✓ {f}</span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="portal-btn portal-btn-primary" onClick={() => setTab('intake')}>Get a Quote →</button>
                  <button className="portal-btn portal-btn-ghost" onClick={() => { setTab('consult'); setConsultSubmitted(false) }}>Book a Call</button>
                </div>
              </div>
            </div>

            {/* All services — flat single section */}
            <div style={{ marginBottom:40 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.04em', color:'var(--text)' }}>Additional Services</h3>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>

              {catalog.length === 0 && (
                <div style={{ textAlign:'center', padding:'48px 0', color:'var(--muted)' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>⟳</div>
                  <p style={{ fontSize:13 }}>Loading services…</p>
                </div>
              )}

              <div className="portal-catalog-grid">
                {catalog.filter(s => !HIDDEN_IDS.includes(s.id)).map(svc => (
                  <div key={svc.id} className={`portal-catalog-card ${svc.id==='studio'?'portal-catalog-card--featured':''}`}>
                    {svc.id==='studio' && <div className="portal-catalog-badge">Most Popular</div>}
                    <div className="portal-catalog-name">{svc.name}</div>
                    <div className="portal-catalog-desc">{svc.description}</div>
                    <div className="portal-catalog-pricing">
                      {svc.originalPrice && <div className="portal-catalog-original">{fmt(svc.originalPrice)}</div>}
                      <div className="portal-catalog-price">{fmt(svc.price)}</div>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:16 }}>
                      {stripeConfigured ? (
                        <button className="portal-btn portal-btn-primary" style={{ flex:1, justifyContent:'center', fontSize:13 }}
                          onClick={() => { setShowEmailFor(svc.id); setCheckoutError(null) }}
                          disabled={!!checkoutLoading}>
                          {checkoutLoading===svc.id ? <><span className="portal-spinner"/>…</> : 'Buy Now'}
                        </button>
                      ) : (
                        <a href="mailto:squiressolutions@gmail.com?subject=Service Inquiry" className="portal-btn portal-btn-primary" style={{ flex:1, justifyContent:'center', fontSize:13, textAlign:'center' }}>Get Started</a>
                      )}
                      <button className="portal-btn portal-btn-ghost" style={{ fontSize:13 }} onClick={() => setTab('intake')}>Request Quote</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div style={{ marginBottom:40 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.04em', color:'var(--text)' }}>What Clients Say</h3>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>
              <div className="portal-testimonials-grid">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="portal-testimonial-card">
                    <div style={{ display:'flex', gap:2, marginBottom:12 }}>
                      {Array.from({length:t.stars}).map((_,j) => <Star key={j} size={14} fill="#D4A017" color="#D4A017" />)}
                    </div>
                    <p style={{ fontSize:13, color:'var(--muted2)', lineHeight:1.8, fontStyle:'italic', marginBottom:14 }}>"{t.quote}"</p>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>{t.biz}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ OUR WORK TAB ══════════════════ */}
        {tab === 'work' && (
          <div>
            <div className="portal-step-header" style={{ marginBottom:24 }}>
              <h2 className="portal-step-title">My Work</h2>
              <p className="portal-step-sub">
                A selection of recent projects from{' '}
                <a href="https://www.behance.net/kc144" target="_blank" rel="noreferrer" style={{ color:'var(--accent)', textDecoration:'none' }}>
                  behance.net/kc144 <ExternalLink size={12} style={{ verticalAlign:'middle' }} />
                </a>
              </p>
            </div>

            {/* Category filter */}
            <div className="portal-pill-row" style={{ marginBottom:28 }}>
              {PORT_CATS.map(c => (
                <button key={c} className={`portal-pill ${portCat===c?'selected':''}`} onClick={() => setPortCat(c)}>{c}</button>
              ))}
            </div>

            {PORT_CATS.filter(c => c !== 'All').map(category => {
              const items = filteredPortfolio.filter(p => p.cat === category)
              if (items.length === 0) return null
              return (
                <div key={category} style={{ marginBottom:40 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:'0.04em', color:'var(--text)' }}>{category}</h3>
                    <div style={{ flex:1, height:1, background:'var(--border)' }} />
                  </div>
                  <div className="portal-portfolio-grid">
                    {items.map(p => (
                      <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="portal-portfolio-card">
                        <div className="portal-portfolio-thumb">
                          <img src={p.thumb} alt={p.title} loading="lazy" />
                          <div className="portal-portfolio-overlay">
                            <ExternalLink size={20} color="#fff" />
                            <span>View on Behance</span>
                          </div>
                        </div>
                        <div className="portal-portfolio-info">
                          <div className="portal-portfolio-title">{p.title}</div>
                          <div className="portal-portfolio-cat">{p.cat}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══════════════════ INTAKE TAB ══════════════════ */}
        {tab === 'intake' && (
          <>
            {submitted ? (
              <div className="portal-card">
                <div className="portal-success">
                  <div className="portal-success-icon">✓</div>
                  <h2 className="portal-success-title">Request Received!</h2>
                  <p className="portal-success-sub">Thanks, <strong>{contact.name}</strong>. We'll review your project and be in touch at <strong>{contact.email}</strong> within 24 hours.</p>
                  {refNum && <div className="portal-ref">Reference: <span>{refNum}</span></div>}
                  <div className="portal-success-services">
                    {selectedServices.map(s => (
                      <span key={s.id} className="portal-tag"><s.Icon size={12} strokeWidth={1.75} style={{marginRight:4}} />{s.title}</span>
                    ))}
                  </div>
                  <button className="portal-btn portal-btn-ghost" style={{ marginTop:24 }}
                    onClick={() => { setSubmitted(false); setStep(1); setServices([]); setProject(blankProject()); setContact(blankContact()) }}>
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="portal-progress">
                  {['Services','Project Details','Contact Info','Review'].map((label,i) => (
                    <div key={label} className={`portal-progress-step ${step>i+1?'done':''} ${step===i+1?'active':''}`}>
                      <div className="portal-progress-dot">{step>i+1?'✓':i+1}</div>
                      <div className="portal-progress-label">{label}</div>
                    </div>
                  ))}
                </div>

                {step === 1 && (
                  <div className="portal-card">
                    <div className="portal-step-header">
                      <h2 className="portal-step-title">What do you need?</h2>
                      <p className="portal-step-sub">Select all that apply.</p>
                    </div>
                    <div className="portal-services-grid">
                      {SERVICES_INTAKE.map(s => (
                        <button key={s.id} type="button" className={`portal-service-card ${services.includes(s.id)?'selected':''}`} onClick={() => toggleService(s.id)}>
                          <div className="portal-service-check">{services.includes(s.id)?'✓':''}</div>
                          <div className="portal-service-icon"><s.Icon size={22} strokeWidth={1.5} /></div>
                          <div className="portal-service-title">{s.title}</div>
                          <div className="portal-service-desc">{s.desc}</div>
                          <div className="portal-service-price">{s.from}</div>
                        </button>
                      ))}
                    </div>
                    <div className="portal-nav">
                      <div />
                      <button className="portal-btn portal-btn-primary" onClick={() => setStep(2)} disabled={services.length===0}>Next — Project Details →</button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="portal-card">
                    <div className="portal-step-header">
                      <h2 className="portal-step-title">Tell us about your project</h2>
                      <p className="portal-step-sub">The more detail you share, the better we can help.</p>
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Budget Range</label>
                      <div className="portal-pill-row">{BUDGETS.map(b => <button key={b} type="button" className={`portal-pill ${project.budget===b?'selected':''}`} onClick={() => setProject(p=>({...p,budget:b}))}>{b}</button>)}</div>
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Timeline</label>
                      <div className="portal-pill-row">{TIMELINES.map(t => <button key={t} type="button" className={`portal-pill ${project.timeline===t?'selected':''}`} onClick={() => setProject(p=>({...p,timeline:t}))}>{t}</button>)}</div>
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Project Description <span className="portal-required">*</span></label>
                      <textarea name="description" className="portal-textarea" rows={5} value={project.description} onChange={projChange} placeholder="Describe your business, what you need, who your audience is…" />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Inspiration / References</label>
                      <input type="text" name="inspiration" className="portal-input" value={project.inspiration} onChange={projChange} placeholder="Links to brands or styles you like" />
                    </div>
                    <div className="portal-nav">
                      <button className="portal-btn portal-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                      <button className="portal-btn portal-btn-primary" onClick={() => setStep(3)} disabled={!project.description.trim()}>Next — Contact Info →</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="portal-card">
                    <div className="portal-step-header">
                      <h2 className="portal-step-title">How can we reach you?</h2>
                      <p className="portal-step-sub">We'll follow up within 24 hours.</p>
                    </div>
                    <div className="portal-grid-2">
                      <div className="portal-form-group">
                        <label className="portal-label">Your Name <span className="portal-required">*</span></label>
                        <input type="text" name="name" className="portal-input" value={contact.name} onChange={contactChange} placeholder="Jane Smith" />
                      </div>
                      <div className="portal-form-group">
                        <label className="portal-label">Business / Brand Name</label>
                        <input type="text" name="business" className="portal-input" value={contact.business} onChange={contactChange} placeholder="Company name" />
                      </div>
                      <div className="portal-form-group">
                        <label className="portal-label">Email <span className="portal-required">*</span></label>
                        <input type="email" name="email" className="portal-input" value={contact.email} onChange={contactChange} placeholder="jane@yourbusiness.com" />
                      </div>
                      <div className="portal-form-group">
                        <label className="portal-label">Phone (optional)</label>
                        <input type="tel" name="phone" className="portal-input" value={contact.phone} onChange={contactChange} placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Current Website</label>
                      <input type="text" name="website" className="portal-input" value={contact.website} onChange={contactChange} placeholder="https://yourbusiness.com" />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">How did you hear about us?</label>
                      <div className="portal-pill-row">{HEAR_ABOUT.map(h => <button key={h} type="button" className={`portal-pill ${project.hearAbout===h?'selected':''}`} onClick={() => setProject(p=>({...p,hearAbout:h}))}>{h}</button>)}</div>
                    </div>
                    <div className="portal-nav">
                      <button className="portal-btn portal-btn-ghost" onClick={() => setStep(2)}>← Back</button>
                      <button className="portal-btn portal-btn-primary" onClick={() => setStep(4)} disabled={!contact.name.trim()||!contact.email.trim()}>Review Request →</button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="portal-card">
                    <div className="portal-step-header">
                      <h2 className="portal-step-title">Review your request</h2>
                      <p className="portal-step-sub">Everything look right?</p>
                    </div>
                    <div className="portal-review-section">
                      <div className="portal-review-label">Services</div>
                      <div className="portal-tag-row">{selectedServices.map(s => <span key={s.id} className="portal-tag"><s.Icon size={12} strokeWidth={1.75} style={{marginRight:4}} />{s.title}</span>)}</div>
                    </div>
                    <div className="portal-review-section">
                      <div className="portal-review-label">Project Details</div>
                      <div className="portal-review-grid">
                        {project.budget    && <ReviewRow label="Budget"    value={project.budget} />}
                        {project.timeline  && <ReviewRow label="Timeline"  value={project.timeline} />}
                        {project.hearAbout && <ReviewRow label="Found via" value={project.hearAbout} />}
                      </div>
                      {project.description && <div className="portal-review-desc">{project.description}</div>}
                    </div>
                    <div className="portal-review-section">
                      <div className="portal-review-label">Contact</div>
                      <div className="portal-review-grid">
                        <ReviewRow label="Name"  value={contact.name} />
                        <ReviewRow label="Email" value={contact.email} />
                        {contact.business && <ReviewRow label="Business" value={contact.business} />}
                        {contact.phone    && <ReviewRow label="Phone"    value={contact.phone} />}
                      </div>
                    </div>
                    {intakeError && <div className="portal-error">{intakeError}</div>}
                    <div className="portal-nav">
                      <button className="portal-btn portal-btn-ghost" onClick={() => setStep(3)}>← Back</button>
                      <button className="portal-btn portal-btn-primary" onClick={submitIntake} disabled={submitting}>
                        {submitting ? <><span className="portal-spinner"/> Submitting…</> : '✓ Submit Request'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══════════════════ CONSULTATION TAB ══════════════════ */}
        {tab === 'consult' && (
          <div className="portal-card" style={{ maxWidth:560, margin:'0 auto' }}>
            {consultSubmitted ? (
              <div className="portal-success">
                <CheckCircle size={48} color="#3DD68C" style={{ marginBottom:12 }} />
                <h2 className="portal-success-title">You're booked!</h2>
                <p className="portal-success-sub">Thanks, <strong>{consult.name}</strong>! We'll reach out to <strong>{consult.email}</strong> within 24 hours to confirm your free 30-min consultation.</p>
                <button className="portal-btn portal-btn-ghost" style={{ marginTop:24 }}
                  onClick={() => { setConsultSubmitted(false); setConsult({ name:'', email:'', phone:'', business:'', topic:'', preferredTime:'' }) }}>
                  Submit Another
                </button>
              </div>
            ) : (
              <>
                <div className="portal-step-header">
                  <h2 className="portal-step-title">Free 30-Min Consultation</h2>
                  <p className="portal-step-sub">No commitment, no pressure. Let's talk about your brand goals and how we can help.</p>
                </div>
                <form onSubmit={submitConsult}>
                  <div className="portal-grid-2">
                    <div className="portal-form-group">
                      <label className="portal-label">Your Name <span className="portal-required">*</span></label>
                      <input type="text" name="name" className="portal-input" value={consult.name} onChange={consultChange} placeholder="Jane Smith" required />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Business / Brand</label>
                      <input type="text" name="business" className="portal-input" value={consult.business} onChange={consultChange} placeholder="Company name" />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Email <span className="portal-required">*</span></label>
                      <input type="email" name="email" className="portal-input" value={consult.email} onChange={consultChange} placeholder="jane@yourbusiness.com" required />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Phone (optional)</label>
                      <input type="tel" name="phone" className="portal-input" value={consult.phone} onChange={consultChange} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="portal-form-group">
                    <label className="portal-label">What do you want to discuss? <span className="portal-required">*</span></label>
                    <textarea name="topic" className="portal-textarea" rows={4} value={consult.topic} onChange={consultChange} required placeholder="e.g. I need a full rebrand for my restaurant, not sure where to start…" />
                  </div>
                  <div className="portal-form-group">
                    <label className="portal-label">Preferred Time / Availability</label>
                    <input type="text" name="preferredTime" className="portal-input" value={consult.preferredTime} onChange={consultChange} placeholder="e.g. Weekdays after 3pm EST, or anytime Friday" />
                  </div>
                  {consultError && <div className="portal-error">{consultError}</div>}
                  <button type="submit" className="portal-btn portal-btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:8 }} disabled={consultSubmitting}>
                    {consultSubmitting ? <><span className="portal-spinner"/> Submitting…</> : <><CalendarDays size={15} style={{marginRight:6}} /> Book My Free Consultation</>}
                  </button>
                </form>
                <p style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:16 }}>100% free · No card required · We'll confirm within 24 hours</p>
              </>
            )}
          </div>
        )}

        {/* ══════════════════ CONTACT TAB ══════════════════ */}
        {tab === 'contact' && (
          <div className="portal-card" style={{ maxWidth:560, margin:'0 auto' }}>
            {msgSent ? (
              <div className="portal-success">
                <CheckCircle size={48} color="#3DD68C" style={{ marginBottom:12 }} />
                <h2 className="portal-success-title">Message Sent!</h2>
                <p className="portal-success-sub">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                <button className="portal-btn portal-btn-ghost" style={{ marginTop:24 }} onClick={() => { setMsgSent(false); setMsg({ name:'', email:'', phone:'', message:'' }) }}>Send Another</button>
              </div>
            ) : (
              <>
                <div className="portal-step-header">
                  <h2 className="portal-step-title">Get in Touch</h2>
                  <p className="portal-step-sub">Have a question or just want to say hello? Send us a message and we'll get back to you within 24 hours.</p>
                </div>
                <form onSubmit={sendMsg}>
                  <div className="portal-grid-2">
                    <div className="portal-form-group">
                      <label className="portal-label">Your Name <span className="portal-required">*</span></label>
                      <input type="text" name="name" className="portal-input" value={msg.name} onChange={msgChange} placeholder="Jane Smith" required />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Email <span className="portal-required">*</span></label>
                      <input type="email" name="email" className="portal-input" value={msg.email} onChange={msgChange} placeholder="jane@yourbusiness.com" required />
                    </div>
                  </div>
                  <div className="portal-form-group">
                    <label className="portal-label">Phone (optional)</label>
                    <input type="tel" name="phone" className="portal-input" value={msg.phone} onChange={msgChange} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="portal-form-group">
                    <label className="portal-label">Message <span className="portal-required">*</span></label>
                    <textarea name="message" className="portal-textarea" rows={6} value={msg.message} onChange={msgChange} placeholder="What's on your mind?" required />
                  </div>
                  {msgError && <div className="portal-error">{msgError}</div>}
                  <button type="submit" className="portal-btn portal-btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:8 }} disabled={msgSending}>
                    {msgSending ? <><span className="portal-spinner"/> Sending…</> : <><Mail size={15} style={{marginRight:6}} /> Send Message</>}
                  </button>
                </form>
                <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)', display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap' }}>
                  <a href="mailto:squiressolutions@gmail.com" style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted2)', fontSize:13, textDecoration:'none' }}>
                    <Mail size={14} /> squiressolutions@gmail.com
                  </a>
                  <a href="https://www.behance.net/kc144" target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted2)', fontSize:13, textDecoration:'none' }}>
                    <ExternalLink size={14} /> Behance Portfolio
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════ FILES TAB ══════════════════ */}
        {tab === 'files' && <FilesTab />}

        {/* ══════════════════ PAY INVOICE TAB ══════════════════ */}
        {tab === 'pay' && (
          <div className="portal-card" style={{ maxWidth:520, margin:'0 auto' }}>
            {paymentStatus==='success' && (
              <div className="portal-pay-success" style={{ marginBottom:24 }}>
                <CheckCircle size={32} color="#3DD68C" />
                <div style={{ fontWeight:700, color:'#3DD68C', marginTop:6 }}>Payment Successful!</div>
                <div style={{ fontSize:13, color:'var(--muted2)', marginTop:4 }}>Thank you — we'll be in touch shortly.</div>
              </div>
            )}
            {paymentStatus==='cancelled' && (
              <div className="portal-pay-cancelled"><p style={{ fontSize:13, color:'var(--orange)' }}>Payment cancelled. No charge was made.</p></div>
            )}
            <div className="portal-step-header">
              <h2 className="portal-step-title">Pay Your Invoice</h2>
              <p className="portal-step-sub">Enter your invoice number and amount, then pay securely via Stripe.</p>
            </div>
            {stripeConfigured===false && (
              <div className="inline-notice" style={{ marginBottom:20 }}>
                Stripe is not yet activated. Contact{' '}
                <a href="mailto:squiressolutions@gmail.com" style={{ color:'var(--accent)' }}>squiressolutions@gmail.com</a>{' '}
                to arrange payment.
              </div>
            )}
            <form onSubmit={startPayment}>
              <div className="portal-form-group">
                <label className="portal-label">Invoice Number</label>
                <input type="text" name="invoiceNumber" className="portal-input" value={pay.invoiceNumber} onChange={payChange} placeholder="INV-00001" />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Amount (USD) <span className="portal-required">*</span></label>
                <input type="number" name="amount" className="portal-input" value={pay.amount} onChange={payChange} placeholder="0.00" step="0.01" min="1" required />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Your Email</label>
                <input type="email" name="email" className="portal-input" value={pay.email} onChange={payChange} placeholder="you@yourbusiness.com" />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Description (optional)</label>
                <input type="text" name="description" className="portal-input" value={pay.description} onChange={payChange} placeholder="Brand Identity Project" />
              </div>
              {payError && <div className="portal-error">{payError}</div>}
              <button type="submit" className="portal-btn portal-btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:8 }} disabled={paying||stripeConfigured===false}>
                {paying ? <><span className="portal-spinner"/> Redirecting…</> : <><CreditCard size={15} style={{marginRight:6}} /> Pay Now via Stripe</>}
              </button>
            </form>
            <div style={{ marginTop:20, textAlign:'center', fontSize:12, color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Lock size={12} /> Secured by Stripe · We never store your card details
            </div>
          </div>
        )}
        </div>{/* end portal-tab-content */}
      </div>{/* end portal-body */}

      <PortalFooter />
    </div>
  )
}

// ─── Files Tab ────────────────────────────────────────────────────────────────

function FilesTab() {
  // ── Upload state
  const [files, setFiles]         = useState([])
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadDone, setUploadDone] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const fileInputRef = useRef(null)

  // ── Track project state
  const [refInput, setRefInput]   = useState('')
  const [trackResult, setTrackResult] = useState(null)
  const [tracking, setTracking]   = useState(false)

  const ALLOWED = ['image/png','image/jpeg','image/jpg','application/pdf']

  function validateFiles(incoming) {
    const errs = []
    const valid = []
    let total = files.reduce((s,f) => s+f.size, 0)
    for (const f of incoming) {
      if (!ALLOWED.includes(f.type)) { errs.push(`"${f.name}" is not accepted. Only PNG, JPEG, and PDF files are accepted.`); continue }
      if (f.size > MAX_FILE_MB * 1024 * 1024) { errs.push(`"${f.name}" exceeds ${MAX_FILE_MB}MB limit.`); continue }
      if (total + f.size > MAX_TOTAL_MB * 1024 * 1024) { errs.push(`Adding "${f.name}" would exceed the ${MAX_TOTAL_MB}MB total limit.`); continue }
      total += f.size
      valid.push(f)
    }
    if (errs.length) setUploadError(errs.join('\n'))
    else setUploadError(null)
    return valid
  }

  function onFileChange(e) {
    const valid = validateFiles(Array.from(e.target.files || []))
    setFiles(prev => [...prev, ...valid])
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    const valid = validateFiles(Array.from(e.dataTransfer.files || []))
    setFiles(prev => [...prev, ...valid])
  }

  function removeFile(idx) { setFiles(prev => prev.filter((_,i) => i!==idx)); setUploadError(null) }

  async function doUpload(e) {
    e.preventDefault()
    if (files.length === 0) return setUploadError('Please select at least one file.')
    if (!clientName.trim()) return setUploadError('Please enter your name.')
    setUploading(true); setUploadError(null); setUploadProgress(10)

    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    fd.append('clientName', clientName)
    fd.append('clientEmail', clientEmail)
    fd.append('description', description)

    try {
      // Simulate progress
      const tick = setInterval(() => setUploadProgress(p => Math.min(p + 15, 85)), 400)
      const res = await fetch('/api/portal/upload', { method:'POST', body: fd })
      clearInterval(tick)
      setUploadProgress(100)
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Upload failed.') }
      setUploadDone(true)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function trackProject(e) {
    e.preventDefault()
    if (!refInput.trim()) return
    setTracking(true); setTrackResult(null)
    try {
      const res  = await fetch(`/api/portal/deliveries?refNum=${encodeURIComponent(refInput.trim())}`)
      const data = await res.json()
      setTrackResult(data)
    } catch { setTrackResult({ found: false, files: [] }) }
    finally { setTracking(false) }
  }

  function fileIcon(mimetype) {
    if (mimetype === 'application/pdf') return <FileText size={18} color="#E55A5A" />
    return <Image size={18} color="#5B9BD5" />
  }

  const STATUS_LABELS = {
    new: 'Awaiting Review', reviewing: 'In Review',
    inprogress: 'In Progress', completed: 'Completed', archived: 'Archived',
  }
  const STATUS_COLORS = {
    new:'var(--accent2)', reviewing:'var(--accent3)', inprogress:'var(--orange)', completed:'var(--green)', archived:'var(--muted)',
  }

  if (uploadDone) return (
    <div className="portal-card" style={{ maxWidth:520, margin:'0 auto' }}>
      <div className="portal-success">
        <CheckCircle size={48} color="#3DD68C" style={{ marginBottom:12 }} />
        <h2 className="portal-success-title">Files Uploaded!</h2>
        <p className="portal-success-sub">Your files have been sent to Squires Solutions. We'll be in touch shortly.</p>
        <button className="portal-btn portal-btn-ghost" style={{ marginTop:24 }}
          onClick={() => { setUploadDone(false); setFiles([]); setClientName(''); setClientEmail(''); setDescription(''); setUploadProgress(0) }}>
          Upload More Files
        </button>
      </div>
    </div>
  )

  return (
    <div className="portal-files-grid">

      {/* Left: Upload */}
      <div className="portal-card">
        <div className="portal-step-header" style={{ marginBottom:20 }}>
          <h2 className="portal-step-title" style={{ fontSize:20 }}>Upload Files</h2>
          <p className="portal-step-sub">Send reference materials, assets, or feedback files directly to Squires Solutions.</p>
        </div>

        <form onSubmit={doUpload}>
          {/* Drop zone */}
          <div
            className={`portal-dropzone ${dragOver?'portal-dropzone--over':''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <Upload size={28} color="var(--muted)" style={{ marginBottom:10 }} />
            <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', marginBottom:4 }}>Drag & drop files here</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>or click to browse</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:8 }}>PNG, JPEG, PDF only · {MAX_FILE_MB}MB per file · {MAX_TOTAL_MB}MB total</div>
            <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} multiple style={{ display:'none' }} onChange={onFileChange} />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ marginTop:12, marginBottom:4 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  {fileIcon(f.type)}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{fmtSize(f.size)}</div>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:2 }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>
                Total: {fmtSize(files.reduce((s,f)=>s+f.size,0))} / {MAX_TOTAL_MB}MB
              </div>
            </div>
          )}

          <div className="portal-form-group" style={{ marginTop:14 }}>
            <label className="portal-label">Your Name <span className="portal-required">*</span></label>
            <input type="text" className="portal-input" value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="portal-form-group">
            <label className="portal-label">Your Email</label>
            <input type="email" className="portal-input" value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="jane@yourbusiness.com" />
          </div>
          <div className="portal-form-group">
            <label className="portal-label">File Description</label>
            <input type="text" className="portal-input" value={description} onChange={e=>setDescription(e.target.value)} placeholder='e.g. "Logo reference" or "Brand colors PDF"' />
          </div>

          {uploadError && <div className="portal-error" style={{ whiteSpace:'pre-line' }}>{uploadError}</div>}

          {uploading && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:4 }}>
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${uploadProgress}%`, background:'var(--accent)', borderRadius:2, transition:'width 0.3s ease' }} />
              </div>
            </div>
          )}

          <button type="submit" className="portal-btn portal-btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={uploading}>
            {uploading ? <><span className="portal-spinner"/> Uploading…</> : <><Upload size={14} style={{marginRight:6}}/> Send Files</>}
          </button>
        </form>
      </div>

      {/* Right: Track project + Delivered files */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Track project */}
        <div className="portal-card">
          <div className="portal-step-header" style={{ marginBottom:16 }}>
            <h2 className="portal-step-title" style={{ fontSize:18 }}>Track My Project</h2>
            <p className="portal-step-sub">Enter your reference number to see your project status and download delivered files.</p>
          </div>
          <form onSubmit={trackProject} style={{ display:'flex', gap:8 }}>
            <input type="text" className="portal-input" style={{ flex:1 }} value={refInput} onChange={e=>setRefInput(e.target.value)} placeholder="REQ-XXXXXX" />
            <button type="submit" className="portal-btn portal-btn-primary" disabled={tracking}>
              {tracking ? <span className="portal-spinner"/> : 'Look up'}
            </button>
          </form>

          {trackResult && (
            <div style={{ marginTop:16 }}>
              {!trackResult.found ? (
                <div className="portal-error">No project found for that reference number. Check your confirmation email for the correct number.</div>
              ) : (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <span style={{ fontSize:12, color:'var(--muted)', fontWeight:600 }}>Status:</span>
                    <span style={{ fontSize:13, fontWeight:700, color: STATUS_COLORS[trackResult.status] || 'var(--text)' }}>
                      {STATUS_LABELS[trackResult.status] || trackResult.status}
                    </span>
                  </div>

                  {trackResult.files.length === 0 ? (
                    <div style={{ fontSize:13, color:'var(--muted)', padding:'12px 0' }}>
                      No files have been delivered yet. We'll notify you by email when your files are ready.
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:11, color:'var(--muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Delivered Files</div>
                      {trackResult.files.map(f => (
                        <div key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                          {fileIcon(f.mimetype)}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{f.originalName}</div>
                            <div style={{ fontSize:11, color:'var(--muted)' }}>
                              {fmtSize(f.size)} · {new Date(f.uploadedAt).toLocaleDateString()}
                            </div>
                            {f.notes && <div style={{ fontSize:11, color:'var(--muted2)', marginTop:2 }}>{f.notes}</div>}
                          </div>
                          <a href={f.url} download className="portal-btn portal-btn-ghost" style={{ fontSize:12, padding:'4px 12px', display:'flex', alignItems:'center', gap:4 }}>
                            <Download size={12} /> Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="portal-card" style={{ background:'rgba(212,160,23,0.05)', border:'1px solid rgba(212,160,23,0.2)' }}>
          <div style={{ fontWeight:700, color:'var(--accent)', fontSize:13, marginBottom:8 }}>📎 Need to send us files?</div>
          <p style={{ fontSize:12, color:'var(--muted2)', lineHeight:1.7 }}>
            Use the upload form to send reference images, brand assets, feedback, or any files we need to complete your project. We'll receive them instantly and follow up if we have questions.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────

function ReviewRow({ label, value }) {
  return (
    <div className="portal-review-row">
      <span className="portal-review-row-label">{label}</span>
      <span className="portal-review-row-value">{value}</span>
    </div>
  )
}

function PortalHeader() {
  return (
    <header className="portal-header">
      <div className="portal-header-inner">
        <a href="/portal" className="portal-logo" style={{ textDecoration:'none' }}>
          <img src="/logo.png" alt="Squires Solutions" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 4 }} />
          <div>
            <div className="portal-logo-name">SQUIRES SOLUTIONS</div>
            <div className="portal-logo-sub">Creative & Brand Design</div>
          </div>
        </a>
        <a href="mailto:squiressolutions@gmail.com" className="portal-contact-link">
          <Mail size={14} strokeWidth={1.75} style={{marginRight:6}} />squiressolutions@gmail.com
        </a>
      </div>
    </header>
  )
}

function PortalFooter() {
  return (
    <footer className="portal-footer">
      <div className="portal-footer-inner" style={{ flexDirection:'column', gap:12, textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
          <img src="/logo.png" alt="Squires Solutions" style={{ width:28, height:28, objectFit:'contain', borderRadius:3 }} />
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, letterSpacing:'2px', color:'var(--accent)' }}>SQUIRES SOLUTIONS</div>
        </div>
        <div style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap' }}>
          <a href="mailto:squiressolutions@gmail.com" style={{ display:'flex', alignItems:'center', gap:5, color:'var(--muted2)', fontSize:12, textDecoration:'none' }}>
            <Mail size={13} /> squiressolutions@gmail.com
          </a>
          <a href="https://www.behance.net/kc144" target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, color:'var(--muted2)', fontSize:12, textDecoration:'none' }}>
            <ExternalLink size={13} /> Behance
          </a>
          {/* TODO: Replace # with real social profile URLs */}
          <a href="#" style={{ display:'flex', alignItems:'center', gap:5, color:'var(--muted2)', fontSize:12, textDecoration:'none' }}>
            <Share2 size={13} /> Instagram
          </a>
          <a href="#" style={{ display:'flex', alignItems:'center', gap:5, color:'var(--muted2)', fontSize:12, textDecoration:'none' }}>
            <ExternalLink size={13} /> LinkedIn
          </a>
        </div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>© {new Date().getFullYear()} Squires Solutions · All rights reserved</div>
      </div>
    </footer>
  )
}
