import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const STORAGE_KEY = 'sq_invoices'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function dueDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

function newInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-6)}`
}

function newLineItem() {
  return { id: Date.now().toString() + Math.random(), description: '', qty: 1, unitPrice: '' }
}

function blankForm() {
  return {
    yourBusiness: 'Squires Graphics',
    yourEmail: 'keenansquires@gmail.com',
    yourAddress: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    invoiceNumber: newInvoiceNumber(),
    invoiceDate: todayStr(),
    dueDate: dueDateStr(),
    notes: '',
  }
}

function loadInvoices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function calcSubtotal(lineItems) {
  return lineItems.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0),
    0
  )
}

function buildPDF(form, lineItems) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  // Header — business name in gold
  doc.setFontSize(22)
  doc.setTextColor(212, 160, 23)
  doc.text('SQUIRES GRAPHICS', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(form.yourEmail || '', 14, 27)
  if (form.yourAddress) {
    const addrLines = doc.splitTextToSize(form.yourAddress, 80)
    doc.text(addrLines, 14, 33)
  }

  // Invoice details — right side
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text(`Invoice ${form.invoiceNumber}`, pageW - 14, 20, { align: 'right' })
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Date: ${form.invoiceDate}`, pageW - 14, 27, { align: 'right' })
  doc.text(`Due: ${form.dueDate}`, pageW - 14, 33, { align: 'right' })

  // Bill To
  doc.setFontSize(11)
  doc.setTextColor(40, 40, 40)
  doc.text('BILL TO', 14, 50)
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(form.clientName || '', 14, 57)
  doc.text(form.clientEmail || '', 14, 63)
  if (form.clientAddress) {
    const clientAddrLines = doc.splitTextToSize(form.clientAddress, 80)
    doc.text(clientAddrLines, 14, 69)
  }

  // Line items table
  const subtotal = calcSubtotal(lineItems)

  doc.autoTable({
    startY: 80,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: lineItems.map(item => {
      const amt = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)
      return [
        item.description,
        item.qty,
        `$${parseFloat(item.unitPrice || 0).toFixed(2)}`,
        `$${amt.toFixed(2)}`,
      ]
    }),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [9, 20, 40], textColor: [212, 160, 23] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
  })

  const finalY = doc.lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setTextColor(40, 40, 40)
  doc.text(`Total: $${subtotal.toFixed(2)}`, pageW - 14, finalY, { align: 'right' })

  if (form.notes) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    const noteLines = doc.splitTextToSize(form.notes, pageW - 28)
    doc.text(noteLines, 14, finalY + 14)
  }

  return doc
}

export default function InvoiceGenerator() {
  const [tab, setTab] = useState('create') // 'create' | 'history'
  const [invoices, setInvoices] = useState(loadInvoices)
  const [form, setForm] = useState(blankForm)
  const [lineItems, setLineItems] = useState([newLineItem()])
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
  }, [invoices])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleLineItemChange(id, field, value) {
    setLineItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  function addLineItem() {
    setLineItems(prev => [...prev, newLineItem()])
  }

  function removeLineItem(id) {
    setLineItems(prev => (prev.length > 1 ? prev.filter(i => i.id !== id) : prev))
  }

  function saveInvoice() {
    const subtotal = calcSubtotal(lineItems)
    const invoice = {
      id: Date.now().toString(),
      form: { ...form },
      lineItems: lineItems.map(i => ({ ...i })),
      subtotal,
      savedAt: new Date().toISOString(),
    }
    setInvoices(prev => [invoice, ...prev])
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
    setTab('history')
  }

  function downloadPDF() {
    const doc = buildPDF(form, lineItems)
    doc.save(`invoice-${form.invoiceNumber}.pdf`)
  }

  function downloadSavedPDF(invoice) {
    const doc = buildPDF(invoice.form, invoice.lineItems)
    doc.save(`invoice-${invoice.form.invoiceNumber}.pdf`)
  }

  function deleteInvoice(id) {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  function resetForm() {
    setForm(blankForm())
    setLineItems([newLineItem()])
  }

  const subtotal = calcSubtotal(lineItems)

  // ── Live preview ──────────────────────────────────────────────────────────
  const previewLineItems = lineItems.filter(i => i.description || i.unitPrice)

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-eyebrow">INVOICE GENERATOR</div>
        <h1 className="page-title">INVOICES</h1>
        <p className="page-subtitle">
          Create professional invoices and download them as PDFs in seconds.
        </p>
      </div>

      {/* Tab pills */}
      <div
        className="pill-group"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '28px',
          background: 'var(--bg2)',
          padding: '6px',
          borderRadius: '10px',
          width: 'fit-content',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {[
          { key: 'create', label: 'Create Invoice' },
          { key: 'history', label: `Invoice History${invoices.length ? ` (${invoices.length})` : ''}` },
        ].map(t => (
          <button
            key={t.key}
            className={`pill btn btn-sm${tab === t.key ? ' btn-primary' : ' btn-ghost'}`}
            onClick={() => setTab(t.key)}
            style={{
              borderRadius: '7px',
              fontWeight: tab === t.key ? 600 : 400,
              ...(tab !== t.key ? { background: 'transparent', opacity: 0.65 } : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Create Invoice ── */}
      {tab === 'create' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left: Form */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Invoice Details</h2>
            </div>

            {/* Your business */}
            <div className="form-group">
              <label className="form-label">Your Business</label>
              <input
                className="form-input"
                name="yourBusiness"
                value={form.yourBusiness}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Your Email</label>
              <input
                className="form-input"
                name="yourEmail"
                type="email"
                value={form.yourEmail}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Your Address</label>
              <textarea
                className="form-textarea"
                name="yourAddress"
                rows={2}
                value={form.yourAddress}
                onChange={handleFormChange}
                placeholder="123 Studio Lane, City, ST 00000"
              />
            </div>

            <hr className="divider" />

            {/* Client info */}
            <div className="form-group">
              <label className="form-label">Client Name *</label>
              <input
                className="form-input"
                name="clientName"
                value={form.clientName}
                onChange={handleFormChange}
                placeholder="Jane Doe"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Client Email</label>
              <input
                className="form-input"
                name="clientEmail"
                type="email"
                value={form.clientEmail}
                onChange={handleFormChange}
                placeholder="jane@acme.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Client Address</label>
              <textarea
                className="form-textarea"
                name="clientAddress"
                rows={2}
                value={form.clientAddress}
                onChange={handleFormChange}
                placeholder="456 Client Ave, City, ST 00000"
              />
            </div>

            {/* Invoice meta */}
            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Invoice #</label>
                <input
                  className="form-input"
                  name="invoiceNumber"
                  value={form.invoiceNumber}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group" />

              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="invoiceDate"
                  value={form.invoiceDate}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <hr className="divider" />

            {/* Line items */}
            <div style={{ marginBottom: '8px' }}>
              <div
                className="card-label"
                style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}
              >
                Line Items
              </div>

              {/* Column headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 100px 80px 28px',
                  gap: '8px',
                  marginBottom: '6px',
                  paddingLeft: '4px',
                }}
              >
                {['Description', 'Qty', 'Unit Price', 'Amount', ''].map(h => (
                  <div
                    key={h}
                    style={{ fontSize: '11px', color: 'var(--text)', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {lineItems.map(item => {
                const amt = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 60px 100px 80px 28px',
                      gap: '8px',
                      marginBottom: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      className="form-input"
                      placeholder="Design service…"
                      value={item.description}
                      onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                      style={{ fontSize: '13px', padding: '8px 10px' }}
                    />
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={e => handleLineItemChange(item.id, 'qty', e.target.value)}
                      style={{ fontSize: '13px', padding: '8px 6px', textAlign: 'center' }}
                    />
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={e => handleLineItemChange(item.id, 'unitPrice', e.target.value)}
                      style={{ fontSize: '13px', padding: '8px 10px' }}
                    />
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        textAlign: 'right',
                        paddingRight: '4px',
                      }}
                    >
                      ${amt.toFixed(2)}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeLineItem(item.id)}
                      title="Remove line item"
                      style={{
                        padding: '4px',
                        opacity: lineItems.length === 1 ? 0.25 : 0.6,
                        fontSize: '14px',
                        cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer',
                      }}
                      disabled={lineItems.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}

              <button
                className="btn btn-ghost btn-sm"
                onClick={addLineItem}
                style={{ marginTop: '4px', fontSize: '13px' }}
              >
                + Add Line Item
              </button>
            </div>

            <hr className="divider" />

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes / Terms</label>
              <textarea
                className="form-textarea"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleFormChange}
                placeholder="Payment due within 14 days. Thank you for your business!"
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={resetForm} style={{ opacity: 0.65 }}>
                Reset
              </button>
              <div style={{ flex: 1 }} />
              {saveSuccess && (
                <span style={{ color: '#4ade80', fontSize: '13px', alignSelf: 'center' }}>
                  ✓ Saved to history
                </span>
              )}
              <button className="btn btn-secondary" onClick={saveInvoice}>
                Save Invoice
              </button>
              <button className="btn btn-primary" onClick={downloadPDF}>
                ↓ Download PDF
              </button>
            </div>
          </div>

          {/* Right: Live preview */}
          <div>
            <div
              className="card-label"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                opacity: 0.55,
              }}
            >
              Live Preview
            </div>
            <div
              style={{
                background: 'white',
                color: '#111',
                padding: '32px',
                borderRadius: '8px',
                fontSize: '13px',
                overflowX: 'auto',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {/* Invoice header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#D4A017', marginBottom: '4px' }}>
                    {form.yourBusiness || 'Squires Graphics'}
                  </div>
                  <div style={{ color: '#555', fontSize: '12px' }}>{form.yourEmail}</div>
                  {form.yourAddress && (
                    <div style={{ color: '#555', fontSize: '12px', whiteSpace: 'pre-line', marginTop: '2px' }}>
                      {form.yourAddress}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                    {form.invoiceNumber}
                  </div>
                  <div style={{ color: '#666', fontSize: '12px' }}>Date: {form.invoiceDate}</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>Due: {form.dueDate}</div>
                </div>
              </div>

              {/* Bill To */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#999',
                    marginBottom: '6px',
                  }}
                >
                  Bill To
                </div>
                <div style={{ fontWeight: 600, color: '#222' }}>{form.clientName || '—'}</div>
                {form.clientEmail && <div style={{ color: '#555', fontSize: '12px' }}>{form.clientEmail}</div>}
                {form.clientAddress && (
                  <div style={{ color: '#555', fontSize: '12px', whiteSpace: 'pre-line' }}>{form.clientAddress}</div>
                )}
              </div>

              {/* Line items */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    {['Description', 'Qty', 'Price', 'Amount'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i === 0 ? 'left' : 'right',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#999',
                          padding: '6px 4px',
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewLineItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ color: '#bbb', fontSize: '12px', padding: '12px 4px', fontStyle: 'italic' }}
                      >
                        No line items yet…
                      </td>
                    </tr>
                  ) : (
                    previewLineItems.map(item => {
                      const amt = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px 4px', color: '#333' }}>{item.description}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'right', color: '#555' }}>{item.qty}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'right', color: '#555' }}>
                            ${parseFloat(item.unitPrice || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#222' }}>
                            ${amt.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ minWidth: '180px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      fontSize: '12px',
                      color: '#555',
                    }}
                  >
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      fontSize: '12px',
                      color: '#999',
                    }}
                  >
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0 4px',
                      borderTop: '2px solid #222',
                      marginTop: '4px',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: '#111',
                    }}
                  >
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {form.notes && (
                <div
                  style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #eee',
                    fontSize: '11px',
                    color: '#777',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {form.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Invoice History ── */}
      {tab === 'history' && (
        <div>
          {invoices.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '64px 24px',
                color: 'var(--text)',
                opacity: 0.5,
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📄</div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>No invoices yet.</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>
                Create your first invoice above.
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
                onClick={() => setTab('create')}
              >
                Create Invoice
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace', fontSize: '13px' }}>
                          {inv.form.invoiceNumber}
                        </td>
                        <td style={{ color: 'var(--text)' }}>
                          <div style={{ fontWeight: 500 }}>{inv.form.clientName || '—'}</div>
                          {inv.form.clientEmail && (
                            <div style={{ fontSize: '12px', opacity: 0.55, marginTop: '2px' }}>
                              {inv.form.clientEmail}
                            </div>
                          )}
                        </td>
                        <td style={{ color: 'var(--text)', opacity: 0.7, fontSize: '13px' }}>
                          {inv.form.invoiceDate
                            ? new Date(inv.form.invoiceDate + 'T00:00:00').toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                          ${inv.subtotal.toFixed(2)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => downloadSavedPDF(inv)}
                              title="Download PDF"
                            >
                              ↓ PDF
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => deleteInvoice(inv.id)}
                              title="Delete invoice"
                              style={{
                                background: 'rgba(239,68,68,0.08)',
                                color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.2)',
                              }}
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
        </div>
      )}
    </div>
  )
}
