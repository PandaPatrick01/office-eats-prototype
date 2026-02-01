import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchInvoicesByUser, fetchRestaurants } from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'

function InvoicesPage() {
  const { currentUser } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return
      setIsLoading(true)
      setError('')
      try {
        const [invoicesData, restaurantsData] = await Promise.all([
          fetchInvoicesByUser(currentUser.id),
          fetchRestaurants(),
        ])
        setInvoices(invoicesData)
        setRestaurants(restaurantsData)
      } catch (err) {
        setError('Rechnungen konnten nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [currentUser])

  return (
    <div className="page">
      <h1>Invoices</h1>
      <p>Deine Rechnungen.</p>
      {!currentUser ? (
        <div className="error">Bitte zuerst einloggen.</div>
      ) : null}
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        {isLoading ? (
          <div className="muted">Lade Rechnungen...</div>
        ) : invoices.length === 0 ? (
          <div className="muted">Noch keine Rechnungen.</div>
        ) : (
          invoices.map((invoice) => (
            <div className="card-row" key={invoice.id}>
              <div>
                <strong>{invoice.invoiceNumber ?? `Invoice #${invoice.id}`}</strong>
                <div className="muted">
                  {invoice.createdAt?.slice(0, 10)} ·{' '}
                  {(restaurants.find(
                    (restaurant) =>
                      String(restaurant.id) === String(invoice.restaurantId),
                  )?.name ??
                    `Restaurant #${invoice.restaurantId}`)}
                </div>
              </div>
              <div className="order-meta">
                <span className="status-badge status-CONFIRMED">Erstellt</span>
                <span>€{Number(invoice.total ?? 0).toFixed(2)}</span>
                <Link className="order-link" to={`/invoices/${invoice.id}`}>
                  Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default InvoicesPage
