import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingBag, ClipboardList, CreditCard,
  Palette, PenTool, Share2, Monitor, Package,
  Megaphone, Play, RefreshCw, Lock, CheckCircle,
  Mail, ArrowRight, ChevronLeft,
} from 'lucide-react'

// ── Static service data (mirrors server catalog) ──────────────────────────────
const SERVICES_INTAKE = [
  { id: 'brand-identity',   Icon: Palette,    title: 'Brand Identity',     desc: 'Full brand system — logo, colors, typography, guidelines', from: 'From $1,197' },
  { id: 'logo-design',      Icon: PenTool,    title: 'Logo Design',         desc: 'Professional logo concepts with revisions & source files',  from: 'From $497'   },
  { id: 'social-media-kit', Icon: Share2,     title: 'Social Media Kit',    desc: 'Templates & graphics for Instagram, TikTok, Facebook',     from: 'From $399'   },
  { id: 'website-design',   Icon: Monitor,    title: 'Website Design',      desc: 'UI/UX mockups, landing pages & full site designs',          from: 'From $1,299' },
  { id: 'print-design',     Icon: Package,    title: 'Print & Packaging',   desc: 'Business cards, flyers, packaging, signage & more',         from: 'From $799'   },
  { id: 'ad-creative',      Icon: Megaphone,  title: 'Ad Creative',         desc: 'Meta, TikTok & Google ad graphics and copy',                from: 'From $299'   },
  { id: 'motion-graphics',  Icon: Play,       title: 'Motion Graphics',     desc: 'Animated logos, video intros, reels & short-form content',  from: 'From $599'   },
  { id: 'full-rebrand',     Icon: RefreshCw,  title: 'Full Rebrand',        desc: 'Complete overhaul — strategy, identity, collateral & rollout', from: 'From $3,697' },
]

const BUDGETS    = ['Under $500','$500 – $1,000','$1,000 – $2,500','$2,500 – $5,000','$5,000 – $10,000','$10,000+','Not sure yet']
const TIMELINES  = ['ASAP (rush)','1 – 2 weeks','2 – 4 weeks','1 – 2 months','2 – 3 months','Flexible']
const HEAR_ABOUT = ['Google Search','Instagram','TikTok','Referral / Word of mouth','LinkedIn','Other']

function fmt(cents) { return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 }) }
function blankContact() { return { name:'', business:'', email:'', phone:'', website:'' } }
function blankProject() { return { budget:'', timeline:'', description:'', inspiration:'', hearAbout:'' } }

// ── Category config ────────────────────────────────────────────────────────────
const CAT = {
  package: { label: 'Packages',          color: 'var(--accent)',  badge: 'Best Value' },
  service: { label: 'À La Carte Services', color: 'var(--accent3)', badge: null },
  addon:   { label: 'Add-Ons',            color: 'var(--green)',   badge: null },
}

export default function ClientPortal() {
  const [searchParams] = useSearchParams()
  const paymentStatus  = searchParams.get('payment')
  const paidService    = searchParams.get('service')

  const [tab, setTab] = useState(paymentStatus ? 'pay' : 'services')

  // ── Services catalog from API ──────────────────────────────────────────────
  const [catalog, setCatalog]                 = useState([])
  const [stripeConfigured, setStripeConfigured] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [checkoutError, setCheckoutError]     = useState(null)
  const [buyEmail, setBuyEmail]               = useState('')
  const [showEmailFor, setShowEmailFor]       = useState(null)

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setCatalog).catch(() => setCatalog([]))
    fetch('/api/stripe-status').then(r => r.json()).then(d => setStripeConfigured(d.configured)).catch(() => setStripeConfigured(false))
  }, [])

  async function buyService(serviceId) {
    setCheckoutLoading(serviceId)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, clientEmail: buyEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed.')
      window.location.href = data.url
    } catch (err) {
      setCheckoutError(err.message)
    } finally {
      setCheckoutLoading(null)
    }
  }

  // ── Invoice pay state ──────────────────────────────────────────────────────
  const [pay, setPay]     = useState({ invoiceNumber:'', amount:'', email:'', description:'' })
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState(null)
  function payChange(e) { const {name,value}=e.target; setPay(p=>({...p,[name]:value})) }

  async function startPayment(e) {
    e.preventDefault()
    setPaying(true); setPayError(null)
    try {
      const res = await fetch('/api/checkout/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pay),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed.')
      window.location.href = data.url
    } catch (err) {
      setPayError(err.message)
    } finally {
      setPaying(false)
    }
  }

  // ── Intake state ───────────────────────────────────────────────────────────
  const [step, setStep]             = useState(1)
  const [services, setServices]     = useState([])
  const [project, setProject]       = useState(blankProject())
  const [contact, setContact]       = useState(blankContact())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [refNum, setRefNum]         = useState('')
  const [intakeError, setIntakeError] = useState(null)

  function toggleService(id) { setServices(prev => prev.includes(id) ? prev.filter(s=>s!==id) : [...prev,id]) }
  function projChange(e)    { const {name,value}=e.target; setProject(p=>({...p,[name]:value})) }
  function contactChange(e) { const {name,value}=e.target; setContact(p=>({...p,[name]:value}))  }

  async function submitIntake() {
    setSubmitting(true); setIntakeError(null)
    try {
      const res = await fetch('/api/client-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: services.map(id => SERVICES_INTAKE.find(s=>s.id===id)?.title).filter(Boolean),
          ...project, ...contact,
        }),
      })
      if (!res.ok) throw new Error('Submission failed. Please try again.')
      const data = await res.json()
      setRefNum(data.refNum || '')
      setSubmitted(true)
    } catch (err) {
      setIntakeError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedServices = SERVICES_INTAKE.filter(s => services.includes(s.id))
  const groupedCatalog   = ['package','service','addon'].map(cat => ({
    cat,
    items: catalog.filter(s => s.category === cat),
  })).filter(g => g.items.length > 0)

  return (
    <div className="portal-shell">
      <PortalHeader />

      <div className="portal-body">
        {/* ── Tab row ── */}
        <div className="portal-tab-row">
          <button className={`portal-tab ${tab==='services'?'active':''}`} onClick={() => setTab('services')}>
            <ShoppingBag size={15} strokeWidth={1.75} /> Services & Pricing
          </button>
          <button className={`portal-tab ${tab==='intake'?'active':''}`} onClick={() => setTab('intake')}>
            <ClipboardList size={15} strokeWidth={1.75} /> Request a Project
          </button>
          <button className={`portal-tab ${tab==='pay'?'active':''}`} onClick={() => setTab('pay')}>
            <CreditCard size={15} strokeWidth={1.75} /> Pay an Invoice
          </button>
        </div>

        {/* ══════════════════ FREE CONSULTATION BANNER ══════════════════ */}
        <div className="portal-consult-banner">
          <div className="portal-consult-text">
            <div className="portal-consult-title">Not sure where to start?</div>
            <div className="portal-consult-sub">Book a free 30-min consultation — no commitment, no pressure.</div>
          </div>
          <a
            href="mailto:squiressolutions@gmail.com?subject=Free Consultation Request&body=Hi, I'd like to book a free consultation to discuss my project."
            className="portal-consult-btn"
          >
            <Mail size={15} strokeWidth={1.75} /> Book Free Consultation
          </a>
        </div>

        {/* ══════════════════ SERVICES TAB ══════════════════ */}
        {tab === 'services' && (
          <div>
            {/* Payment success banner */}
            {paymentStatus === 'success' && (
              <div className="portal-pay-success" style={{ marginBottom: 24 }}>
                <CheckCircle size={32} color="#3DD68C" style={{ marginBottom: 6 }} />
                <div style={{ fontWeight: 700, color: '#3DD68C', fontSize: 15 }}>Payment Successful!</div>
                {paidService && catalog.find(s=>s.id===paidService) && (
                  <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 4 }}>
                    Thank you for purchasing <strong>{catalog.find(s=>s.id===paidService)?.name}</strong>. We'll be in touch within 24 hours.
                  </div>
                )}
              </div>
            )}

            {checkoutError && <div className="portal-error" style={{ marginBottom: 16 }}>{checkoutError}</div>}

            {/* Email capture (shown when someone clicks Buy) */}
            {showEmailFor && (
              <div className="portal-card" style={{ marginBottom: 20, maxWidth: 480 }}>
                <div className="portal-step-header" style={{ marginBottom: 16 }}>
                  <h2 className="portal-step-title" style={{ fontSize: 20 }}>
                    {catalog.find(s=>s.id===showEmailFor)?.name}
                  </h2>
                  <p className="portal-step-sub">Enter your email for the receipt (optional), then proceed to checkout.</p>
                </div>
                <div className="portal-form-group">
                  <label className="portal-label">Email (optional)</label>
                  <input type="email" className="portal-input" value={buyEmail}
                    onChange={e => setBuyEmail(e.target.value)} placeholder="you@yourbusiness.com" />
                </div>
                <div style={{ display:'flex', gap:10, marginTop:8 }}>
                  <button className="portal-btn portal-btn-primary" style={{ flex:1, justifyContent:'center' }}
                    onClick={() => { buyService(showEmailFor); setShowEmailFor(null) }}
                    disabled={checkoutLoading === showEmailFor}>
                    {checkoutLoading === showEmailFor
                      ? <><span className="portal-spinner" /> Redirecting…</>
                      : `💳 Pay ${fmt(catalog.find(s=>s.id===showEmailFor)?.price||0)}`}
                  </button>
                  <button className="portal-btn portal-btn-ghost" onClick={() => setShowEmailFor(null)}>Cancel</button>
                </div>
              </div>
            )}

            {catalog.length === 0 && (
              <div style={{ textAlign:'center', padding: '40px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
                <p style={{ fontSize: 13 }}>Loading services…</p>
              </div>
            )}

            {groupedCatalog.map(({ cat, items }) => (
              <div key={cat} style={{ marginBottom: 36 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.04em', color:'var(--text)' }}>
                    {CAT[cat]?.label}
                  </h3>
                  <div style={{ flex:1, height:1, background:'var(--border)' }} />
                </div>
                <div className="portal-catalog-grid">
                  {items.map(svc => (
                    <div key={svc.id} className={`portal-catalog-card ${cat === 'package' ? 'portal-catalog-card--featured' : ''}`}>
                      {cat === 'package' && svc.id === 'studio' && (
                        <div className="portal-catalog-badge">Most Popular</div>
                      )}
                      <div className="portal-catalog-name">{svc.name}</div>
                      <div className="portal-catalog-desc">{svc.description}</div>
                      <div className="portal-catalog-pricing">
                        {svc.originalPrice && (
                          <div className="portal-catalog-original">{fmt(svc.originalPrice)}</div>
                        )}
                        <div className="portal-catalog-price">{fmt(svc.price)}</div>
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:16 }}>
                        {stripeConfigured ? (
                          <button
                            className="portal-btn portal-btn-primary"
                            style={{ flex:1, justifyContent:'center', fontSize:13 }}
                            onClick={() => { setShowEmailFor(svc.id); setCheckoutError(null) }}
                            disabled={!!checkoutLoading}
                          >
                            {checkoutLoading === svc.id
                              ? <><span className="portal-spinner" /> …</>
                              : 'Buy Now'}
                          </button>
                        ) : (
                          <a
                            href="mailto:squiressolutions@gmail.com?subject=Service Inquiry"
                            className="portal-btn portal-btn-primary"
                            style={{ flex:1, justifyContent:'center', fontSize:13, textAlign:'center' }}
                          >
                            Get Started
                          </a>
                        )}
                        <button
                          className="portal-btn portal-btn-ghost"
                          style={{ fontSize:13 }}
                          onClick={() => setTab('intake')}
                        >
                          Request Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════ PAY INVOICE TAB ══════════════════ */}
        {tab === 'pay' && (
          <div className="portal-card" style={{ maxWidth: 520, margin: '0 auto' }}>
            {paymentStatus === 'success' && (
              <div className="portal-pay-success" style={{ marginBottom: 24 }}>
                <CheckCircle size={32} color="#3DD68C" />
                <div style={{ fontWeight:700, color:'#3DD68C', marginTop:6 }}>Payment Successful!</div>
                <div style={{ fontSize:13, color:'var(--muted2)', marginTop:4 }}>Thank you — we'll be in touch shortly.</div>
              </div>
            )}
            {paymentStatus === 'cancelled' && (
              <div className="portal-pay-cancelled">
                <p style={{ fontSize:13, color:'var(--orange)' }}>Payment cancelled. No charge was made.</p>
              </div>
            )}
            <div className="portal-step-header">
              <h2 className="portal-step-title">Pay Your Invoice</h2>
              <p className="portal-step-sub">Enter your invoice number and amount, then pay securely via Stripe.</p>
            </div>
            {stripeConfigured === false && (
              <div className="inline-notice" style={{ marginBottom: 20 }}>
                Stripe is not yet activated. Contact{' '}
                <a href="mailto:squiressolutions@gmail.com" style={{ color:'var(--accent)' }}>squiressolutions@gmail.com</a>{' '}
                to arrange payment.
              </div>
            )}
            <form onSubmit={startPayment}>
              <div className="portal-form-group">
                <label className="portal-label">Invoice Number</label>
                <input type="text" name="invoiceNumber" className="portal-input" value={pay.invoiceNumber}
                  onChange={payChange} placeholder="INV-00001" />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Amount (USD) <span className="portal-required">*</span></label>
                <input type="number" name="amount" className="portal-input" value={pay.amount}
                  onChange={payChange} placeholder="0.00" step="0.01" min="1" required />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Your Email</label>
                <input type="email" name="email" className="portal-input" value={pay.email}
                  onChange={payChange} placeholder="you@yourbusiness.com" />
              </div>
              <div className="portal-form-group">
                <label className="portal-label">Description (optional)</label>
                <input type="text" name="description" className="portal-input" value={pay.description}
                  onChange={payChange} placeholder="Brand Identity Project" />
              </div>
              {payError && <div className="portal-error">{payError}</div>}
              <button type="submit" className="portal-btn portal-btn-primary"
                style={{ width:'100%', justifyContent:'center', marginTop:8 }}
                disabled={paying || stripeConfigured === false}>
                {paying ? <><span className="portal-spinner" /> Redirecting…</> : <><CreditCard size={15} style={{marginRight:6}} /> Pay Now via Stripe</>}
              </button>
            </form>
            <div style={{ marginTop:20, textAlign:'center', fontSize:12, color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Lock size={12} /> Secured by Stripe · We never store your card details
            </div>
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
                  <p className="portal-success-sub">
                    Thanks, <strong>{contact.name}</strong>. We'll review your project and be in touch
                    at <strong>{contact.email}</strong> within 24 hours.
                  </p>
                  {refNum && <div className="portal-ref">Reference: <span>{refNum}</span></div>}
                  <div className="portal-success-services">
                    {selectedServices.map(s => (
                      <span key={s.id} className="portal-tag">
                        <s.Icon size={12} strokeWidth={1.75} style={{marginRight:4}} />{s.title}
                      </span>
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
                        <button key={s.id} type="button"
                          className={`portal-service-card ${services.includes(s.id)?'selected':''}`}
                          onClick={() => toggleService(s.id)}>
                          <div className="portal-service-check">{services.includes(s.id) ? '✓' : ''}</div>
                          <div className="portal-service-icon"><s.Icon size={22} strokeWidth={1.5} /></div>
                          <div className="portal-service-title">{s.title}</div>
                          <div className="portal-service-desc">{s.desc}</div>
                          <div className="portal-service-price">{s.from}</div>
                        </button>
                      ))}
                    </div>
                    <div className="portal-nav">
                      <div />
                      <button className="portal-btn portal-btn-primary" onClick={() => setStep(2)} disabled={services.length===0}>
                        Next — Project Details →
                      </button>
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
                      <div className="portal-pill-row">
                        {BUDGETS.map(b => (
                          <button key={b} type="button" className={`portal-pill ${project.budget===b?'selected':''}`}
                            onClick={() => setProject(p=>({...p,budget:b}))}>{b}</button>
                        ))}
                      </div>
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Timeline</label>
                      <div className="portal-pill-row">
                        {TIMELINES.map(t => (
                          <button key={t} type="button" className={`portal-pill ${project.timeline===t?'selected':''}`}
                            onClick={() => setProject(p=>({...p,timeline:t}))}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Project Description <span className="portal-required">*</span></label>
                      <textarea name="description" className="portal-textarea" rows={5} value={project.description}
                        onChange={projChange} placeholder="Describe your business, what you need, who your audience is…" />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label">Inspiration / References</label>
                      <input type="text" name="inspiration" className="portal-input" value={project.inspiration}
                        onChange={projChange} placeholder="Links to brands or styles you like" />
                    </div>
                    <div className="portal-nav">
                      <button className="portal-btn portal-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                      <button className="portal-btn portal-btn-primary" onClick={() => setStep(3)} disabled={!project.description.trim()}>
                        Next — Contact Info →
                      </button>
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
                      <div className="portal-pill-row">
                        {HEAR_ABOUT.map(h => (
                          <button key={h} type="button" className={`portal-pill ${project.hearAbout===h?'selected':''}`}
                            onClick={() => setProject(p=>({...p,hearAbout:h}))}>{h}</button>
                        ))}
                      </div>
                    </div>
                    <div className="portal-nav">
                      <button className="portal-btn portal-btn-ghost" onClick={() => setStep(2)}>← Back</button>
                      <button className="portal-btn portal-btn-primary" onClick={() => setStep(4)}
                        disabled={!contact.name.trim()||!contact.email.trim()}>
                        Review Request →
                      </button>
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
                      <div className="portal-tag-row">
                        {selectedServices.map(s => (
                          <span key={s.id} className="portal-tag">
                            <s.Icon size={12} strokeWidth={1.75} style={{marginRight:4}} />{s.title}
                          </span>
                        ))}
                      </div>
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
                        <ReviewRow label="Name"     value={contact.name} />
                        <ReviewRow label="Email"    value={contact.email} />
                        {contact.business && <ReviewRow label="Business" value={contact.business} />}
                        {contact.phone    && <ReviewRow label="Phone"    value={contact.phone} />}
                      </div>
                    </div>
                    {intakeError && <div className="portal-error">{intakeError}</div>}
                    <div className="portal-nav">
                      <button className="portal-btn portal-btn-ghost" onClick={() => setStep(3)}>← Back</button>
                      <button className="portal-btn portal-btn-primary" onClick={submitIntake} disabled={submitting}>
                        {submitting ? <><span className="portal-spinner" /> Submitting…</> : '✓ Submit Request'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <PortalFooter />
    </div>
  )
}

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
          <div className="portal-logo-mark">◈</div>
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
      <div className="portal-footer-inner">
        <span>© {new Date().getFullYear()} Squires Solutions · All rights reserved</span>
        <a href="mailto:squiressolutions@gmail.com">squiressolutions@gmail.com</a>
      </div>
    </footer>
  )
}
