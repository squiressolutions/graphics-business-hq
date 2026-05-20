import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const SERVICES = [
  { id: 'brand-identity',   icon: '◈', title: 'Brand Identity',     desc: 'Full brand system — logo, colors, typography, guidelines', from: 'From $1,197' },
  { id: 'logo-design',      icon: '◆', title: 'Logo Design',         desc: 'Professional logo concepts with revisions & source files',  from: 'From $497'   },
  { id: 'social-media-kit', icon: '◉', title: 'Social Media Kit',    desc: 'Templates & graphics for Instagram, TikTok, Facebook',     from: 'From $399'   },
  { id: 'website-design',   icon: '◻', title: 'Website Design',      desc: 'UI/UX mockups, landing pages & full site designs',          from: 'From $1,299' },
  { id: 'print-design',     icon: '◇', title: 'Print & Packaging',   desc: 'Business cards, flyers, packaging, signage & more',         from: 'From $799'   },
  { id: 'ad-creative',      icon: '▣', title: 'Ad Creative',         desc: 'Meta, TikTok & Google ad graphics and copy',                from: 'From $299'   },
  { id: 'motion-graphics',  icon: '▷', title: 'Motion Graphics',     desc: 'Animated logos, video intros, reels & short-form content',  from: 'From $599'   },
  { id: 'full-rebrand',     icon: '↻', title: 'Full Rebrand',        desc: 'Complete overhaul — strategy, identity, collateral & rollout', from: 'From $3,697' },
]

const BUDGETS   = ['Under $500','$500 – $1,000','$1,000 – $2,500','$2,500 – $5,000','$5,000 – $10,000','$10,000+','Not sure yet']
const TIMELINES = ['ASAP (rush)','1 – 2 weeks','2 – 4 weeks','1 – 2 months','2 – 3 months','Flexible']
const HEAR_ABOUT = ['Google Search','Instagram','TikTok','Referral / Word of mouth','LinkedIn','Other']

function blankContact() { return { name:'', business:'', email:'', phone:'', website:'' } }
function blankProject() { return { budget:'', timeline:'', description:'', inspiration:'', hearAbout:'' } }

export default function ClientPortal() {
  const [searchParams] = useSearchParams()
  const [tab, setTab]  = useState('intake') // 'intake' | 'pay'

  // Handle Stripe redirect back
  const paymentStatus = searchParams.get('payment')

  // ── Intake state ──────────────────────────────────────────────
  const [step, setStep]           = useState(1)
  const [services, setServices]   = useState([])
  const [project, setProject]     = useState(blankProject())
  const [contact, setContact]     = useState(blankContact())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refNum, setRefNum]       = useState('')
  const [intakeError, setIntakeError] = useState(null)

  // ── Payment state ─────────────────────────────────────────────
  const [stripeConfigured, setStripeConfigured] = useState(null)
  const [pay, setPay] = useState({ invoiceNumber:'', amount:'', email:'', description:'' })
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState(null)

  useEffect(() => {
    fetch('/api/stripe-status').then(r => r.json()).then(d => setStripeConfigured(d.configured)).catch(() => setStripeConfigured(false))
    if (paymentStatus === 'success') setTab('pay')
  }, [paymentStatus])

  function toggleService(id) {
    setServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  function projChange(e)    { const {name,value}=e.target; setProject(p=>({...p,[name]:value})) }
  function contactChange(e) { const {name,value}=e.target; setContact(p=>({...p,[name]:value}))  }
  function payChange(e)     { const {name,value}=e.target; setPay(p=>({...p,[name]:value}))       }

  async function submitIntake() {
    setSubmitting(true); setIntakeError(null)
    try {
      const res = await fetch('/api/client-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: services.map(id => SERVICES.find(s => s.id === id)?.title).filter(Boolean),
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

  async function startPayment(e) {
    e.preventDefault()
    if (!pay.amount || isNaN(parseFloat(pay.amount))) return
    setPaying(true); setPayError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: pay.amount,
          description: pay.description || 'Design Services — Squires Solutions',
          clientEmail: pay.email,
          invoiceNumber: pay.invoiceNumber,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment setup failed.')
      window.location.href = data.url
    } catch (err) {
      setPayError(err.message)
    } finally {
      setPaying(false)
    }
  }

  const selectedServices = SERVICES.filter(s => services.includes(s.id))

  return (
    <div className="portal-shell">
      <PortalHeader />

      <div className="portal-body">
        {/* Tab switcher */}
        <div className="portal-tab-row">
          <button className={`portal-tab ${tab === 'intake' ? 'active' : ''}`} onClick={() => setTab('intake')}>
            📋 Request a Project
          </button>
          <button className={`portal-tab ${tab === 'pay' ? 'active' : ''}`} onClick={() => setTab('pay')}>
            💳 Pay an Invoice
          </button>
        </div>

        {/* ══════════════ PAYMENT TAB ══════════════ */}
        {tab === 'pay' && (
          <div className="portal-card" style={{ maxWidth: 520, margin: '0 auto' }}>
            {paymentStatus === 'success' && (
              <div className="portal-pay-success">
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#3DD68C', marginBottom: 4 }}>Payment Successful!</div>
                <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Thank you — we've received your payment and will be in touch shortly.</div>
              </div>
            )}

            {paymentStatus === 'cancelled' && (
              <div className="portal-pay-cancelled">
                <div style={{ fontSize: 13, color: 'var(--orange)' }}>Payment cancelled. No charge was made.</div>
              </div>
            )}

            <div className="portal-step-header">
              <h2 className="portal-step-title">Pay Your Invoice</h2>
              <p className="portal-step-sub">Enter your invoice details below and pay securely via Stripe.</p>
            </div>

            {stripeConfigured === false && (
              <div className="inline-notice" style={{ marginBottom: 20 }}>
                Stripe payments are not yet configured. Please contact{' '}
                <a href="mailto:squiressolutions@gmail.com" style={{ color: 'var(--accent)' }}>squiressolutions@gmail.com</a>{' '}
                to arrange payment.
              </div>
            )}

            <form onSubmit={startPayment}>
              <div className="portal-form-group">
                <label className="portal-label">Invoice Number</label>
                <input type="text" name="invoiceNumber" className="portal-input" value={pay.invoiceNumber}
                  onChange={payChange} placeholder="e.g. INV-00001" />
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
                  onChange={payChange} placeholder="e.g. Brand Identity Project" />
              </div>

              {payError && <div className="portal-error">{payError}</div>}

              <button type="submit" className="portal-btn portal-btn-primary w-full"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                disabled={paying || stripeConfigured === false}>
                {paying
                  ? <><span className="portal-spinner" /> Redirecting to payment…</>
                  : '💳 Pay Now via Stripe'}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
              🔒 Secured by Stripe · We never store your card details
            </div>
          </div>
        )}

        {/* ══════════════ INTAKE TAB ══════════════ */}
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
                      <span key={s.id} className="portal-tag">{s.icon} {s.title}</span>
                    ))}
                  </div>
                  <button className="portal-btn portal-btn-ghost" style={{ marginTop: 24 }}
                    onClick={() => { setSubmitted(false); setStep(1); setServices([]); setProject(blankProject()); setContact(blankContact()) }}>
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Progress */}
                <div className="portal-progress">
                  {['Services','Project Details','Contact Info','Review'].map((label,i) => (
                    <div key={label} className={`portal-progress-step ${step > i+1 ? 'done' : ''} ${step === i+1 ? 'active' : ''}`}>
                      <div className="portal-progress-dot">{step > i+1 ? '✓' : i+1}</div>
                      <div className="portal-progress-label">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                  <div className="portal-card">
                    <div className="portal-step-header">
                      <h2 className="portal-step-title">What do you need?</h2>
                      <p className="portal-step-sub">Select all services that apply — you can pick multiple.</p>
                    </div>
                    <div className="portal-services-grid">
                      {SERVICES.map(s => (
                        <button key={s.id} type="button"
                          className={`portal-service-card ${services.includes(s.id) ? 'selected' : ''}`}
                          onClick={() => toggleService(s.id)}>
                          <div className="portal-service-check">{services.includes(s.id) ? '✓' : ''}</div>
                          <div className="portal-service-icon">{s.icon}</div>
                          <div className="portal-service-title">{s.title}</div>
                          <div className="portal-service-desc">{s.desc}</div>
                          <div className="portal-service-price">{s.from}</div>
                        </button>
                      ))}
                    </div>
                    <div className="portal-nav">
                      <div />
                      <button className="portal-btn portal-btn-primary" onClick={() => setStep(2)} disabled={services.length === 0}>
                        Next — Project Details →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="portal-card">
                    <div className="portal-step-header">
                      <h2 className="portal-step-title">Tell us about your project</h2>
                      <p className="portal-step-sub">The more detail you share, the better we can help you.</p>
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
                      <label className="portal-label">Inspiration / References (optional)</label>
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

                {/* Step 3 */}
                {step === 3 && (
                  <div className="portal-card">
                    <div className="portal-step-header">
                      <h2 className="portal-step-title">How can we reach you?</h2>
                      <p className="portal-step-sub">We'll follow up within 24 hours with a proposal and next steps.</p>
                    </div>
                    <div className="portal-grid-2">
                      <div className="portal-form-group">
                        <label className="portal-label">Your Name <span className="portal-required">*</span></label>
                        <input type="text" name="name" className="portal-input" value={contact.name} onChange={contactChange} placeholder="Jane Smith" />
                      </div>
                      <div className="portal-form-group">
                        <label className="portal-label">Business / Brand Name</label>
                        <input type="text" name="business" className="portal-input" value={contact.business} onChange={contactChange} placeholder="Your company name" />
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
                      <label className="portal-label">Current Website (optional)</label>
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
                        disabled={!contact.name.trim() || !contact.email.trim()}>
                        Review Request →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                  <div className="portal-card">
                    <div className="portal-step-header">
                      <h2 className="portal-step-title">Review your request</h2>
                      <p className="portal-step-sub">Everything look right? Hit submit and we'll be in touch shortly.</p>
                    </div>
                    <div className="portal-review-section">
                      <div className="portal-review-label">Services Requested</div>
                      <div className="portal-tag-row">
                        {selectedServices.map(s => <span key={s.id} className="portal-tag">{s.icon} {s.title}</span>)}
                      </div>
                    </div>
                    <div className="portal-review-section">
                      <div className="portal-review-label">Project Details</div>
                      <div className="portal-review-grid">
                        {project.budget   && <ReviewRow label="Budget"    value={project.budget} />}
                        {project.timeline && <ReviewRow label="Timeline"  value={project.timeline} />}
                        {project.hearAbout && <ReviewRow label="Found via" value={project.hearAbout} />}
                      </div>
                      {project.description && <div className="portal-review-desc">{project.description}</div>}
                      {project.inspiration && (
                        <div style={{ marginTop: 8, fontSize: 13, color: '#94AAC4' }}>
                          <span style={{ fontWeight: 600 }}>References:</span> {project.inspiration}
                        </div>
                      )}
                    </div>
                    <div className="portal-review-section">
                      <div className="portal-review-label">Your Info</div>
                      <div className="portal-review-grid">
                        <ReviewRow label="Name"     value={contact.name} />
                        <ReviewRow label="Email"    value={contact.email} />
                        {contact.business && <ReviewRow label="Business" value={contact.business} />}
                        {contact.phone    && <ReviewRow label="Phone"    value={contact.phone} />}
                        {contact.website  && <ReviewRow label="Website"  value={contact.website} />}
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
        <a href="/portal" className="portal-logo" style={{ textDecoration: 'none' }}>
          <div className="portal-logo-mark">◈</div>
          <div>
            <div className="portal-logo-name">SQUIRES SOLUTIONS</div>
            <div className="portal-logo-sub">Creative & Brand Design</div>
          </div>
        </a>
        <a href="mailto:squiressolutions@gmail.com" className="portal-contact-link">
          squiressolutions@gmail.com
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
