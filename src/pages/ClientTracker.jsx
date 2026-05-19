import { useState, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const STORAGE_KEY = 'sq_clients'

const PROJECT_TYPES = [
  'Logo Design',
  'Brand Identity',
  'Social Media Kit',
  'Website Design',
  'Print Design',
  'Motion Graphics',
  'Full Rebrand',
  'Ongoing Retainer',
  'Custom',
]

const STATUSES = ['Lead', 'Active', 'Completed', 'On Hold', 'Cancelled']

const BLANK_FORM = {
  name: '',
  company: '',
  email: '',
  phone: '',
  projectType: 'Logo Design',
  status: 'Lead',
  budget: '',
  startDate: '',
  notes: '',
}

function statusStyle(status) {
  switch (status) {
    case 'Lead':
      return { background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }
    case 'Active':
      return { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }
    case 'Completed':
      return { background: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.25)' }
    case 'On Hold':
      return { background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' }
    case 'Cancelled':
      return { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
    default:
      return {}
  }
}

function loadClients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function ClientTracker() {
  const [clients, setClients] = useState(loadClients)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  }, [clients])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Client name is required.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    if (editId) {
      setClients(prev =>
        prev.map(c => (c.id === editId ? { ...c, ...form } : c))
      )
    } else {
      const newClient = {
        ...form,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }
      setClients(prev => [newClient, ...prev])
    }
    setForm(BLANK_FORM)
    setEditId(null)
    setShowForm(false)
    setErrors({})
  }

  function handleEdit(client) {
    setForm({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      projectType: client.projectType,
      status: client.status,
      budget: client.budget,
      startDate: client.startDate,
      notes: client.notes,
    })
    setEditId(client.id)
    setShowForm(true)
    setErrors({})
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this client? This cannot be undone.')) return
    setClients(prev => prev.filter(c => c.id !== id))
    if (editId === id) {
      setEditId(null)
      setForm(BLANK_FORM)
      setShowForm(false)
    }
  }

  function handleCancel() {
    setForm(BLANK_FORM)
    setEditId(null)
    setShowForm(false)
    setErrors({})
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('Squires Graphics — Client Roster', 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 30)
    doc.autoTable({
      startY: 36,
      head: [['Name', 'Company', 'Project', 'Status', 'Budget', 'Start Date']],
      body: clients.map(c => [
        c.name,
        c.company,
        c.projectType,
        c.status,
        c.budget,
        c.startDate,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [212, 160, 23], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })
    doc.save('squires-graphics-clients.pdf')
  }

  const total = clients.length
  const activeCount = clients.filter(c => c.status === 'Active').length
  const leadCount = clients.filter(c => c.status === 'Lead').length
  const completedCount = clients.filter(c => c.status === 'Completed').length

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="page-eyebrow">CLIENT TRACKER</div>
          <h1 className="page-title">CLIENTS</h1>
          <p className="page-subtitle">Track every client, project status, and budget. Export your full roster as a PDF.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm && !editId) {
              handleCancel()
            } else {
              setForm(BLANK_FORM)
              setEditId(null)
              setErrors({})
              setShowForm(true)
              setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }, 50)
            }
          }}
        >
          {showForm && !editId ? '✕ Cancel' : '+ Add Client'}
        </button>
      </div>

      {/* Form card */}
      {showForm && (
        <div className="card" ref={formRef} style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">{editId ? 'Edit Client' : 'Add New Client'}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ gap: '16px' }}>
              {/* Client Name — full width */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Client Name *</label>
                <input
                  className={`form-input${errors.name ? ' is-error' : ''}`}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  autoComplete="off"
                />
                {errors.name && <div className="inline-error">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Company</label>
                <input
                  className="form-input"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Co."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@acme.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Type</label>
                <select
                  className="form-select"
                  name="projectType"
                  value={form.projectType}
                  onChange={handleChange}
                >
                  {PROJECT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Budget</label>
                <input
                  className="form-input"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="$2,500"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>

              {/* Notes — full width */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional notes about this client or project…"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editId ? 'Update Client' : 'Save Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats row */}
      <div
        className="stats-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Total Clients', value: total, color: 'var(--accent)' },
          { label: 'Active', value: activeCount, color: '#4ade80' },
          { label: 'Leads', value: leadCount, color: '#60a5fa' },
          { label: 'Completed', value: completedCount, color: '#94a3b8' },
        ].map(stat => (
          <div
            key={stat.label}
            className="card"
            style={{ textAlign: 'center', padding: '20px 16px' }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: stat.color,
                lineHeight: 1,
                marginBottom: '6px',
              }}
            >
              {stat.value}
            </div>
            <div className="card-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Client table */}
      {clients.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: 'var(--text)',
            opacity: 0.5,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>+</div>
          <div style={{ fontSize: '16px', fontWeight: 500 }}>Add your first client</div>
          <div style={{ fontSize: '13px', marginTop: '8px' }}>
            Click "Add Client" above to get started.
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Project Type</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Start Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text)' }}>
                      {client.name}
                    </td>
                    <td style={{ color: 'var(--text)', opacity: 0.75 }}>
                      {client.company || '—'}
                    </td>
                    <td style={{ color: 'var(--text)', opacity: 0.75 }}>
                      {client.projectType}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          ...statusStyle(client.status),
                          borderRadius: '20px',
                          padding: '2px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          display: 'inline-block',
                        }}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--accent)', fontWeight: 500 }}>
                      {client.budget || '—'}
                    </td>
                    <td style={{ color: 'var(--text)', opacity: 0.65, fontSize: '13px' }}>
                      {client.startDate
                        ? new Date(client.startDate + 'T00:00:00').toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit client"
                          onClick={() => handleEdit(client)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          title="Delete client"
                          onClick={() => handleDelete(client.id)}
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export PDF */}
      {clients.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={exportPDF}>
            ↓ Export PDF
          </button>
        </div>
      )}
    </div>
  )
}
