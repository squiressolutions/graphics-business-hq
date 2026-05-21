import { useState } from 'react'
import jsPDF from 'jspdf'

const STORAGE_KEY = 'sq_contracts'

function loadContracts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveContracts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
function today() {
  return new Date().toISOString().slice(0, 10)
}

const BLANK = {
  clientName: '',
  clientEmail: '',
  clientBusiness: '',
  projectType: 'Brand Identity',
  projectScope: '',
  totalPrice: '',
  depositPercent: '50',
  startDate: today(),
  deliveryDate: '',
  revisions: '3',
  paymentTerms: 'Net 14',
  extraClauses: '',
}

function buildContractPDF(contractText, clientName) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16
  const maxW = pageW - margin * 2

  doc.setFontSize(18)
  doc.setTextColor(212, 160, 23)
  doc.text('SQUIRES SOLUTIONS', margin, 18)
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text('squiressolutions@gmail.com', margin, 25)
  doc.setFontSize(14)
  doc.setTextColor(20, 20, 20)
  doc.text('CLIENT SERVICE AGREEMENT', margin, 36)
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)

  const lines = doc.splitTextToSize(contractText || '', maxW)
  let y = 44
  lines.forEach(line => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text(line, margin, y)
    y += 5.5
  })

  doc.save(`contract-${(clientName || 'client').replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export default function ContractBuilder() {
  const [form, setForm] = useState(BLANK)
  const [loading, setLoading] = useState(false)
  const [contract, setContract] = useState(null)
  const [error, setError] = useState(null)
  const [savedMsg, setSavedMsg] = useState(false)
  const [contracts, setContracts] = useState(loadContracts)
  const [activeTab, setActiveTab] = useState('builder')

  function change(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  async function generate(e) {
    e.preventDefault()
    setLoading(true)
    setContract(null)
    setError(null)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setContract(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function saveContract() {
    if (!contract) return
    const entry = {
      id: Date.now().toString(),
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      projectType: form.projectType,
      totalPrice: form.totalPrice,
      createdAt: new Date().toISOString(),
      contractText: contract.contractText,
    }
    const updated = [entry, ...contracts]
    setContracts(updated)
    saveContracts(updated)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  function downloadPDF() {
    if (!contract) return
    buildContractPDF(contract.contractText, form.clientName)
  }

  function sendToClient() {
    if (!contract) return
    const subject = encodeURIComponent(`Service Agreement — ${form.projectType}`)
    const body = encodeURIComponent(
      `Hi ${form.clientName},\n\nPlease find your service agreement below.\n\n` +
      `Project: ${form.projectType}\nTotal: $${form.totalPrice}\n\n` +
      `${contract.contractText}\n\n— Squires Solutions\nsquiressolutions@gmail.com`
    )
    const to = form.clientEmail ? encodeURIComponent(form.clientEmail) : ''
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
  }

  function deleteContract(id) {
    const updated = contracts.filter(c => c.id !== id)
    setContracts(updated)
    saveContracts(updated)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Business</div>
        <h1 className="page-title">CONTRACT BUILDER</h1>
        <p className="page-subtitle">
          Generate professional client contracts with AI. Download as PDF and send to clients.
        </p>
      </div>

      <div className="pill-group" style={{ marginBottom: 24 }}>
        <button className={`pill ${activeTab === 'builder' ? 'selected' : ''}`} onClick={() => setActiveTab('builder')}>
          Build Contract
        </button>
        <button className={`pill ${activeTab === 'saved' ? 'selected' : ''}`} onClick={() => setActiveTab('saved')}>
          Saved Contracts {contracts.length > 0 && `(${contracts.length})`}
        </button>
      </div>

      {activeTab === 'builder' && (
        <div className="two-pane" style={{ alignItems: 'start' }}>
          {/* Form */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Contract Details</div>
            </div>
            <form onSubmit={generate}>
              <div style={{ marginBottom: 20 }}>
                <div className="card-label" style={{ marginBottom: 10 }}>Client Info</div>
                <div className="form-group">
                  <label className="form-label">Client Name</label>
                  <input type="text" name="clientName" className="form-input" value={form.clientName} onChange={change}
                    placeholder="Estefany Squires" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Email</label>
                  <input type="email" name="clientEmail" className="form-input" value={form.clientEmail} onChange={change}
                    placeholder="estefany@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Business</label>
                  <input type="text" name="clientBusiness" className="form-input" value={form.clientBusiness} onChange={change}
                    placeholder="Company or business name" />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="card-label" style={{ marginBottom: 10 }}>Project Details</div>
                <div className="form-group">
                  <label className="form-label">Project Type</label>
                  <select name="projectType" className="form-select" value={form.projectType} onChange={change}>
                    {['Brand Identity', 'Logo Design', 'Social Media Kit', 'Website Design', 'Print Design',
                      'Motion Graphics', 'Full Rebrand', 'Ad Creative', 'Custom'].map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Project Scope</label>
                  <textarea name="projectScope" className="form-textarea" rows={3} value={form.projectScope} onChange={change}
                    placeholder="Describe what is included: deliverables, formats, pages, platforms…" />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="card-label" style={{ marginBottom: 10 }}>Financials & Timeline</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Total Price ($)</label>
                    <input type="text" name="totalPrice" className="form-input" value={form.totalPrice} onChange={change}
                      placeholder="1,197" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deposit (%)</label>
                    <select name="depositPercent" className="form-select" value={form.depositPercent} onChange={change}>
                      {['25', '30', '50', '75', '100'].map(o => <option key={o}>{o}%</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" name="startDate" className="form-input" value={form.startDate} onChange={change} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery Date</label>
                    <input type="date" name="deliveryDate" className="form-input" value={form.deliveryDate} onChange={change} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Revision Rounds</label>
                    <select name="revisions" className="form-select" value={form.revisions} onChange={change}>
                      {['1', '2', '3', '5', 'Unlimited'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <select name="paymentTerms" className="form-select" value={form.paymentTerms} onChange={change}>
                      {['Due on receipt', 'Net 7', 'Net 14', 'Net 30', '50/50 split', '33/33/34'].map(o => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Clauses (optional)</label>
                <textarea name="extraClauses" className="form-textarea" rows={2} value={form.extraClauses} onChange={change}
                  placeholder="Rush fee policy, NDA requirement, usage rights, etc." />
              </div>

              {error && <div className="inline-error">{error}</div>}

              <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 8 }}>
                {loading
                  ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Generating…</>
                  : '📋 Generate Contract'}
              </button>
            </form>
          </div>

          {/* Output */}
          <div>
            {!loading && !contract && (
              <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 40, color: 'var(--border2)', marginBottom: 14 }}>📋</div>
                <p className="text-muted" style={{ fontSize: 13 }}>
                  Fill in the details and generate a professional contract ready to send.
                </p>
              </div>
            )}

            {loading && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 48 }}>
                <div className="loading-spinner loading-spinner--lg" />
                <p className="text-muted2" style={{ fontSize: 13 }}>Drafting your contract…</p>
              </div>
            )}

            {contract && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                  <div className="card-label" style={{ marginBottom: 6 }}>Contract Ready</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={downloadPDF}>↓ Download PDF</button>
                    <button className="btn btn-secondary btn-sm" onClick={sendToClient}>✉ Send to Client</button>
                    <button className="btn btn-ghost btn-sm" onClick={saveContract}>
                      {savedMsg ? '✓ Saved' : 'Save to History'}
                    </button>
                  </div>
                </div>

                <div className="card" style={{ background: '#fff', color: '#111', padding: 32, fontFamily: 'Georgia, serif', lineHeight: 1.8 }}>
                  <div style={{ borderBottom: '2px solid #D4A017', paddingBottom: 16, marginBottom: 24 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#D4A017', letterSpacing: '0.05em' }}>SQUIRES SOLUTIONS</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>squiressolutions@gmail.com</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Client Service Agreement
                  </div>
                  <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', color: '#222' }}>
                    {contract.contractText}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {contracts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 32, color: 'var(--border2)', marginBottom: 12 }}>📋</div>
              <p className="text-muted" style={{ fontSize: 13 }}>No saved contracts yet.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Value</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.clientName}</td>
                    <td><span className="badge badge-violet">{c.projectType}</span></td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      {c.totalPrice ? `$${c.totalPrice}` : '—'}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => buildContractPDF(c.contractText, c.clientName)}>
                        ↓ PDF
                      </button>
                      {c.clientEmail && (
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => {
                            const subject = encodeURIComponent(`Service Agreement — ${c.projectType}`)
                            const body = encodeURIComponent(c.contractText || '')
                            window.location.href = `mailto:${encodeURIComponent(c.clientEmail)}?subject=${subject}&body=${body}`
                          }}>
                          ✉
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                        onClick={() => deleteContract(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
