import { useState, useMemo } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const STORAGE_KEY = 'sq_expenses'
const CATEGORIES = ['Software', 'Equipment', 'Marketing', 'Contractor', 'Office', 'Travel', 'Meals', 'Other']

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
function today() {
  return new Date().toISOString().slice(0, 10)
}
function fmt(n) {
  return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
function blank() {
  return { id: '', date: today(), category: 'Software', vendor: '', description: '', amount: '' }
}

const CAT_COLORS = {
  Software:   'badge-cyan',
  Equipment:  'badge-violet',
  Marketing:  'badge-pink',
  Contractor: 'badge-orange',
  Office:     'badge-muted',
  Travel:     'badge-cyan',
  Meals:      'badge-green',
  Other:      'badge-muted',
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState(load)
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filterCat, setFilterCat] = useState('All')
  const [filterMonth, setFilterMonth] = useState('')

  function change(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  function submit(e) {
    e.preventDefault()
    if (!form.amount || isNaN(parseFloat(form.amount))) return
    let updated
    if (editId) {
      updated = expenses.map(x => x.id === editId ? { ...form, id: editId } : x)
      setEditId(null)
    } else {
      updated = [{ ...form, id: Date.now().toString() }, ...expenses]
    }
    setExpenses(updated)
    save(updated)
    setForm(blank())
  }

  function startEdit(exp) {
    setForm({ ...exp })
    setEditId(exp.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(blank())
  }

  function doDelete(id) {
    const updated = expenses.filter(x => x.id !== id)
    setExpenses(updated)
    save(updated)
    setConfirmDelete(null)
  }

  const filtered = useMemo(() => {
    return expenses.filter(x => {
      if (filterCat !== 'All' && x.category !== filterCat) return false
      if (filterMonth && !x.date.startsWith(filterMonth)) return false
      return true
    })
  }, [expenses, filterCat, filterMonth])

  const total = useMemo(() => filtered.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0), [filtered])
  const totalAll = useMemo(() => expenses.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0), [expenses])

  const byCategory = useMemo(() => {
    const map = {}
    expenses.forEach(x => {
      map[x.category] = (map[x.category] || 0) + (parseFloat(x.amount) || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [expenses])

  const thisMonth = useMemo(() => {
    const m = new Date().toISOString().slice(0, 7)
    return expenses.filter(x => x.date.startsWith(m)).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0)
  }, [expenses])

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor(212, 160, 23)
    doc.text('SQUIRES SOLUTIONS — EXPENSE REPORT', 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleDateString()}   Total: ${fmt(total)}`, 14, 26)
    doc.autoTable({
      startY: 32,
      head: [['Date', 'Category', 'Vendor', 'Description', 'Amount']],
      body: filtered.map(x => [x.date, x.category, x.vendor, x.description, fmt(x.amount)]),
      headStyles: { fillColor: [212, 160, 23], textColor: '#fff', fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      foot: [[{ content: 'Total', colSpan: 4, styles: { fontStyle: 'bold' } }, fmt(total)]],
      footStyles: { fillColor: [30, 30, 30], textColor: '#fff' },
    })
    doc.save('squires-solutions-expenses.pdf')
  }

  function exportCSV() {
    const header = 'Date,Category,Vendor,Description,Amount\n'
    const rows = filtered.map(x =>
      [x.date, x.category, `"${x.vendor}"`, `"${x.description}"`, x.amount].join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expenses.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const months = useMemo(() => {
    const s = new Set(expenses.map(x => x.date.slice(0, 7)))
    return Array.from(s).sort().reverse()
  }, [expenses])

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-eyebrow">Business</div>
        <h1 className="page-title">EXPENSE TRACKER</h1>
        <p className="page-subtitle">Log and categorize business expenses. Export reports anytime.</p>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card stat-card-accent">
          <div className="card-label">Total (All Time)</div>
          <div className="card-value" style={{ fontSize: 24 }}>{fmt(totalAll)}</div>
          <div className="card-muted">{expenses.length} expenses</div>
        </div>
        <div className="stat-card stat-card-pink">
          <div className="card-label">This Month</div>
          <div className="card-value" style={{ fontSize: 24 }}>{fmt(thisMonth)}</div>
          <div className="card-muted">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="stat-card stat-card-cyan">
          <div className="card-label">Filtered Total</div>
          <div className="card-value" style={{ fontSize: 24 }}>{fmt(total)}</div>
          <div className="card-muted">{filtered.length} records shown</div>
        </div>
      </div>

      <div className="two-pane" style={{ alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">{editId ? 'Edit Expense' : 'Add Expense'}</div>
          </div>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" name="date" className="form-input" value={form.date} onChange={change} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={form.category} onChange={change}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Vendor / Payee</label>
              <input type="text" name="vendor" className="form-input" value={form.vendor} onChange={change}
                placeholder="e.g. Adobe, Amazon, Freelancer" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" name="description" className="form-input" value={form.description} onChange={change}
                placeholder="What was this for?" />
            </div>
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input type="number" name="amount" className="form-input" value={form.amount} onChange={change}
                placeholder="0.00" step="0.01" min="0" required />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editId ? '✓ Save Changes' : '+ Add Expense'}
              </button>
              {editId && (
                <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>

          {/* By Category breakdown */}
          {byCategory.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="card-label" style={{ marginBottom: 12 }}>Spending by Category</div>
              {byCategory.map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className={`badge ${CAT_COLORS[cat] || 'badge-muted'}`}>{cat}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{fmt(amt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div>
          {/* Filters + export */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="form-select" style={{ flex: 1, minWidth: 120 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="form-select" style={{ flex: 1, minWidth: 140 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="">All Months</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={exportCSV}>↓ CSV</button>
              <button className="btn btn-secondary btn-sm" onClick={exportPDF}>↓ PDF</button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, color: 'var(--border2)', marginBottom: 12 }}>💰</div>
                <p className="text-muted" style={{ fontSize: 13 }}>No expenses yet. Add your first one.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(x => (
                    <tr key={x.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 12 }}>{x.date}</td>
                      <td><span className={`badge ${CAT_COLORS[x.category] || 'badge-muted'}`}>{x.category}</span></td>
                      <td style={{ fontWeight: 500 }}>{x.vendor || '—'}</td>
                      <td style={{ color: 'var(--muted2)', fontSize: 13 }}>{x.description || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{fmt(x.amount)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => startEdit(x)}>Edit</button>
                          {confirmDelete === x.id ? (
                            <>
                              <button className="btn btn-danger btn-sm" onClick={() => doDelete(x.id)}>Confirm</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>No</button>
                            </>
                          ) : (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setConfirmDelete(x.id)}>Del</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ fontWeight: 700, color: 'var(--muted2)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Filtered Total
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>{fmt(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
