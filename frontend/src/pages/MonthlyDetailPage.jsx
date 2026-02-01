import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchMonthlyStatementById,
  fetchOrdersByUser,
  fetchRestaurants,
} from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'
import generateMonthlyStatementPdf from '../pdf/generateMonthlyStatementPdf.js'

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : '-'

function MonthlyDetailPage() {
  const { statementId } = useParams()
  const { currentUser } = useAuth()
  const [statement, setStatement] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchMonthlyStatementById(statementId)
        setStatement(data)
        fetchRestaurants().then(setRestaurants).catch(() => {})
        if (currentUser?.id) {
          fetchOrdersByUser(currentUser.id).then(setOrders).catch(() => {})
        }
      } catch (err) {
        setError('Monatsabrechnung konnte nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [statementId, currentUser])

  const handleDownloadPdf = () => {
    if (!displayStatement) return
    generateMonthlyStatementPdf({
      ...displayStatement,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
    })
  }

  const displayStatement = useMemo(() => {
    if (!statement) return null
    const taxRate = statement.taxRate ?? 0
    const orderLookup = new Map(
      orders.map((order) => [String(order.id), order]),
    )
    const restaurantLookup = new Map(
      restaurants.map((restaurant) => [
        String(restaurant.id),
        restaurant.name,
      ]),
    )

    const statementOrders = (statement.orders ?? []).map((order) => {
      const orderMatch = orderLookup.get(String(order.orderId))
      const restaurantName =
        order.restaurantName ??
        restaurantLookup.get(String(order.restaurantId)) ??
        restaurantLookup.get(String(orderMatch?.restaurantId))
      const subtotal = Number(order.subtotal ?? 0)
      const taxAmount =
        order.taxAmount != null
          ? Number(order.taxAmount)
          : Math.round(subtotal * taxRate * 100) / 100
      const total =
        order.total != null
          ? Number(order.total)
          : Math.round((subtotal + taxAmount) * 100) / 100
      return {
        ...order,
        restaurantId: order.restaurantId ?? orderMatch?.restaurantId,
        subtotal,
        taxAmount,
        total,
        restaurantName,
      }
    })
    const subtotal = Math.round(
      statementOrders.reduce((sum, order) => sum + order.subtotal, 0) * 100,
    ) / 100
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100
    const total = Math.round((subtotal + taxAmount) * 100) / 100
    return { ...statement, orders: statementOrders, subtotal, taxAmount, total }
  }, [statement, restaurants, orders])

  return (
    <div className="page">
      <h1>Monatsabrechnung</h1>
      {error ? <div className="error">{error}</div> : null}
      {isLoading ? (
        <div className="muted">Lade Monatsabrechnung...</div>
      ) : displayStatement ? (
        <>
          <div className="card">
            <div className="card-row">
              <div>
                <strong>{displayStatement.statementNumber ?? displayStatement.month}</strong>
                <div className="muted">{displayStatement.month}</div>
              </div>
              <span>€{Number(displayStatement.total ?? 0).toFixed(2)}</span>
            </div>
            <div className="card-row">
              <div>
                <strong>Zeitraum</strong>
                <div className="muted">
                  {formatDate(displayStatement.periodStart)} –{' '}
                  {formatDate(displayStatement.periodEnd)}
                </div>
              </div>
              <span>{displayStatement.orderCount ?? 0} Orders</span>
            </div>
            <div className="card-row">
              <div>
                <strong>Subtotal</strong>
              </div>
              <span>€{Number(displayStatement.subtotal ?? 0).toFixed(2)}</span>
            </div>
            <div className="card-row">
              <div>
                <strong>MwSt</strong>
                <div className="muted">
                  {Math.round((displayStatement.taxRate ?? 0) * 100)}%
                </div>
              </div>
              <span>€{Number(displayStatement.taxAmount ?? 0).toFixed(2)}</span>
            </div>
            <div className="card-row">
              <div>
                <strong>Total</strong>
              </div>
              <span>€{Number(displayStatement.total ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="page-section">
            <h2>Orders</h2>
            <div className="card">
              {displayStatement.orders?.length ? (
                displayStatement.orders.map((order) => (
                  <div className="card-row" key={order.orderId}>
                    <div>
                      <strong>Order #{order.orderId}</strong>
                      <div className="muted">
                        {order.restaurantName ?? `#${order.restaurantId ?? ''}`} ·{' '}
                        {formatDate(order.deliveredAt)}
                      </div>
                    </div>
                    <span>€{Number(order.total ?? 0).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="muted">Keine Orders im Zeitraum.</div>
              )}
            </div>
          </div>

          <div className="actions">
            <button type="button" className="btn-blue" onClick={handleDownloadPdf}>
              PDF herunterladen
            </button>
          </div>
        </>
      ) : (
        <div className="muted">Monatsabrechnung nicht gefunden.</div>
      )}
    </div>
  )
}

export default MonthlyDetailPage
