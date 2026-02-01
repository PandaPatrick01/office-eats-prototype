import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ensureInvoiceForDeliveredOrder, fetchOrder, updateOrder } from '../api/endpoints.js'

const STATUS_SEQUENCE = [
  'CONFIRMED',
  'SENT_TO_KITCHEN',
  'ACCEPTED_BY_KITCHEN',
  'ASSIGNED_TO_DRIVER',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

const STATUS_LABELS = {
  CONFIRMED: 'Bestätigt',
  SENT_TO_KITCHEN: 'An Küche gesendet',
  ACCEPTED_BY_KITCHEN: 'Von Küche bestätigt',
  ASSIGNED_TO_DRIVER: 'Fahrer zugewiesen',
  OUT_FOR_DELIVERY: 'Unterwegs',
  DELIVERED: 'Geliefert',
  REJECTED_BY_KITCHEN: 'Von Küche abgelehnt',
  CANCELLED: 'Storniert',
}

function formatStatus(status) {
  return STATUS_LABELS[status] ?? status
}

function OrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchOrder(orderId)
        setOrder(data)
        await ensureInvoiceForDeliveredOrder(data)
      } catch (err) {
        setError('Bestellung konnte nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [orderId])

  const currentStatus = order?.status ?? 'CONFIRMED'
  const statusHistory = order?.statusHistory ?? []
  const isEndState = currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED'
  const nextStatus = useMemo(() => {
    if (currentStatus === 'REJECTED_BY_KITCHEN') return 'CANCELLED'
    const index = STATUS_SEQUENCE.indexOf(currentStatus)
    if (index === -1 || index === STATUS_SEQUENCE.length - 1) return null
    return STATUS_SEQUENCE[index + 1]
  }, [currentStatus])

  const canReject = currentStatus === 'SENT_TO_KITCHEN'
  const canCancel = currentStatus === 'CONFIRMED'

  const patchStatus = async (status, by) => {
    if (!order) return
    const entry = { at: new Date().toISOString(), by, event: status }
    const nextHistory = [...statusHistory, entry]
    const deliveredAt =
      status === 'DELIVERED' ? new Date().toISOString() : order.deliveredAt
    setIsSubmitting(true)
    setError('')
    try {
      const updated = await updateOrder(order.id, {
        status,
        statusHistory: nextHistory,
        deliveredAt,
      })
      setOrder(updated)
      await ensureInvoiceForDeliveredOrder(updated)
    } catch (err) {
      setError('Status konnte nicht aktualisiert werden.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (!nextStatus || isEndState) return
    patchStatus(nextStatus, 'system')
  }

  const handleReject = () => {
    if (!canReject) return
    patchStatus('REJECTED_BY_KITCHEN', 'kitchen')
  }

  const handleCancel = () => {
    if (!canCancel) return
    patchStatus('CANCELLED', 'employee')
  }

  const handleReset = async () => {
    if (!order) return
    setIsSubmitting(true)
    setError('')
    try {
      const updated = await updateOrder(order.id, {
        status: 'CONFIRMED',
        statusHistory: [],
      })
      setOrder(updated)
    } catch (err) {
      setError('Simulation konnte nicht zurückgesetzt werden.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Order #{orderId}</h1>
        <button type="button" className="btn-blue" onClick={() => navigate(-1)}>
          Zurück
        </button>
      </div>
      {error ? <div className="error">{error}</div> : null}
      {isLoading ? (
        <div className="muted">Lade Bestellung...</div>
      ) : order ? (
        <>
          <div className="card">
            <div className="card-row">
              <div>
                <strong>Status</strong>
                <div className="muted">Aktueller Stand</div>
              </div>
              <span className={`status-badge status-${currentStatus}`}>
                {formatStatus(currentStatus)}
              </span>
            </div>
            <div className="card-row">
              <div>
                <strong>Restaurant</strong>
                <div className="muted">#{order.restaurantId}</div>
              </div>
              <span>€{Number(order.subtotal ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="page-section">
            <h2>Timeline</h2>
            <div className="timeline">
              {statusHistory.length === 0 ? (
                <div className="muted">Noch keine Historie.</div>
              ) : (
                statusHistory.map((entry, index) => (
                  <div className="timeline-item" key={`${entry.at}-${index}`}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-title">
                        {formatStatus(entry.event)}
                      </div>
                      <div className="muted">
                        {new Date(entry.at).toLocaleString()} · {entry.by}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="page-section">
            <h2>Demo – Prozesssimulation</h2>
            <div className="card">
              <div className="actions">
                <button
                  type="button"
                  className="btn-blue"
                  onClick={handleNext}
                  disabled={!nextStatus || isEndState || isSubmitting}
                >
                  Next Step
                </button>
                <button
                  type="button"
                  className="btn-blue"
                  onClick={handleReject}
                  disabled={!canReject || isEndState || isSubmitting}
                >
                  Reject by Kitchen
                </button>
                <button
                  type="button"
                  className="btn-blue"
                  onClick={handleCancel}
                  disabled={!canCancel || isEndState || isSubmitting}
                >
                  Cancel Order
                </button>
                <button
                  type="button"
                  className="btn-blue"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset Simulation
                </button>
              </div>
            </div>
          </div>

          {order.items?.length ? (
            <div className="page-section">
              <h2>Items</h2>
              <div className="card">
                {order.items.map((item) => (
                  <div className="card-row" key={item.menuItemId}>
                    <div>
                      <strong>
                        {item.name} x{item.qty}
                      </strong>
                      <div className="muted">€{item.price.toFixed(2)}</div>
                    </div>
                    <span>€{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="muted">Bestellung nicht gefunden.</div>
      )}
    </div>
  )
}

export default OrderDetailPage
