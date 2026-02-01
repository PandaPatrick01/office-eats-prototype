import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchInvoice,
  fetchRestaurant,
  fetchRestaurantSettings,
  fetchRestaurants,
  fetchUser,
} from '../api/endpoints.js'
import generateInvoicePdf from '../pdf/generateInvoicePdf.js'

function InvoiceDetailPage() {
  const { invoiceId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [user, setUser] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [settings, setSettings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchInvoice(invoiceId)
        setInvoice(data)
        if (data?.userId) {
          fetchUser(data.userId).then(setUser).catch(() => {})
        }
        if (data?.restaurantId) {
          fetchRestaurant(data.restaurantId).then(setRestaurant).catch(() => {})
        }
        fetchRestaurantSettings().then(setSettings).catch(() => {})
        fetchRestaurants().then(setRestaurants).catch(() => {})
      } catch (err) {
        setError('Rechnung konnte nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [invoiceId])

  const displayInvoice = useMemo(() => {
    if (!invoice) return null
    const lines = invoice.lines ?? []
    const rawSubtotal =
      invoice.rawSubtotal ??
      lines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0)
    const setting = settings.find(
      (entry) => String(entry.restaurantId) === String(invoice.restaurantId),
    )
    const subsidyPercent =
      invoice.subsidyPercent ??
      setting?.subsidyPercent ??
      setting?.subsidyAmount ??
      0
    const subsidyAmount =
      invoice.subsidyAmount ??
      Math.round((rawSubtotal * subsidyPercent) / 100 * 100) / 100
    const subtotal = Math.round((rawSubtotal - subsidyAmount) * 100) / 100
    const taxRate = invoice.taxRate ?? 0
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100
    const total = Math.round((subtotal + taxAmount) * 100) / 100

    const restaurantName =
      restaurant?.name ??
      restaurants.find(
        (entry) => String(entry.id) === String(invoice.restaurantId),
      )?.name

    return {
      ...invoice,
      rawSubtotal,
      subsidyPercent,
      subsidyAmount,
      subtotal,
      taxRate,
      taxAmount,
      total,
      userName: user?.name,
      userEmail: user?.email,
      restaurantName,
    }
  }, [invoice, user, restaurant, settings, restaurants])

  const handleDownload = () => {
    if (!displayInvoice) return
    generateInvoicePdf(displayInvoice)
  }

  return (
    <div className="page">
      <h1>Invoice Details</h1>
      <p className="muted">Invoice ID: {invoiceId}</p>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        {isLoading ? (
          <div className="muted">Lade Rechnung...</div>
        ) : displayInvoice ? (
          <>
            <div className="card-row">
              <div>
                <strong>{displayInvoice.invoiceNumber ?? 'Invoice'}</strong>
                <div className="muted">Order #{displayInvoice.orderId}</div>
              </div>
              <span>€{Number(displayInvoice.total ?? 0).toFixed(2)}</span>
            </div>
            <div className="card-row">
              <div>
                <strong>Restaurant</strong>
                <div className="muted">
                  {displayInvoice.restaurantName ??
                    `#${displayInvoice.restaurantId ?? ''}`}
                </div>
              </div>
              <span>{displayInvoice.currency ?? 'EUR'}</span>
            </div>
            <div className="card-row">
              <div>
                <strong>Datum</strong>
                <div className="muted">{displayInvoice.createdAt?.slice(0, 10)}</div>
              </div>
              <span>Erstellt</span>
            </div>
            {displayInvoice.lines?.length ? (
              <div>
                <strong>Positionen</strong>
                <div className="card">
                  {displayInvoice.lines.map((line, index) => (
                    <div className="card-row" key={`${line.name}-${index}`}>
                      <div>
                        <strong>
                          {line.name} x{line.qty}
                        </strong>
                        <div className="muted">€{line.unitPrice.toFixed(2)}</div>
                      </div>
                      <span>€{line.lineTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="page-section">
              <div className="card">
                {displayInvoice.rawSubtotal != null ? (
                  <div className="card-row">
                    <div>
                      <strong>Zuschuss</strong>
                      <div className="muted">
                        {Number(displayInvoice.subsidyPercent ?? 0).toFixed(0)}%
                      </div>
                    </div>
                    <span>
                      -€{Number(displayInvoice.subsidyAmount ?? 0).toFixed(2)}
                    </span>
                  </div>
                ) : null}
                <div className="card-row">
                  <div>
                    <strong>Subtotal</strong>
                  </div>
                  <span>€{Number(displayInvoice.subtotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="card-row">
                  <div>
                    <strong>MwSt</strong>
                    <div className="muted">
                      {Math.round((displayInvoice.taxRate ?? 0) * 100)}%
                    </div>
                  </div>
                  <span>€{Number(displayInvoice.taxAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="card-row">
                  <div>
                    <strong>Total</strong>
                  </div>
                  <span>€{Number(displayInvoice.total ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="actions">
              <button type="button" className="btn-blue" onClick={handleDownload}>
                PDF herunterladen
              </button>
            </div>
          </>
        ) : (
          <div className="muted">Rechnung nicht gefunden.</div>
        )}
      </div>
    </div>
  )
}

export default InvoiceDetailPage
