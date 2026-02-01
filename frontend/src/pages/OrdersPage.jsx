import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrdersByUser } from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'

const statusLabels = {
  CONFIRMED: 'Bestätigt',
  SENT_TO_KITCHEN: 'An Küche gesendet',
  ACCEPTED_BY_KITCHEN: 'Von Küche bestätigt',
  ASSIGNED_TO_DRIVER: 'Fahrer zugewiesen',
  OUT_FOR_DELIVERY: 'Unterwegs',
  DELIVERED: 'Geliefert',
  REJECTED_BY_KITCHEN: 'Von Küche abgelehnt',
  CANCELLED: 'Storniert',
}

function OrdersPage() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchOrdersByUser(currentUser.id)
        setOrders(data)
      } catch (err) {
        setError('Bestellungen konnten nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [currentUser])

  return (
    <div className="page">
      <h1>Orders</h1>
      <p>Deine Bestellungen.</p>
      {!currentUser ? (
        <div className="error">Bitte zuerst einloggen.</div>
      ) : null}
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        {isLoading ? (
          <div className="muted">Lade Bestellungen...</div>
        ) : orders.length === 0 ? (
          <div className="muted">Noch keine Bestellungen.</div>
        ) : (
          orders.map((order) => (
            <Link
              className="card-row row-button"
              key={order.id}
              to={`/orders/${order.id}`}
            >
              <div>
                <strong>Order #{order.id}</strong>
                <div className="muted">
                  Restaurant #{order.restaurantId} ·{' '}
                  {order.createdAt?.slice(0, 10)}
                </div>
              </div>
              <div className="order-meta">
                <span className={`status-badge status-${order.status}`}>
                  {statusLabels[order.status] ?? order.status}
                </span>
                <span>€{Number(order.subtotal ?? 0).toFixed(2)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default OrdersPage
