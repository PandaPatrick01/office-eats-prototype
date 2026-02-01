import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchMenuItems } from '../api/endpoints.js'
import { useCart } from '../state/CartContext.jsx'

function MenuPage() {
  const { restaurantId } = useParams()
  const numericRestaurantId = Number(restaurantId)
  const { addItem, cartItems, subtotal, setActiveRestaurant } = useCart()
  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (Number.isFinite(numericRestaurantId)) {
      setActiveRestaurant(numericRestaurantId)
    }
  }, [numericRestaurantId, setActiveRestaurant])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchMenuItems(numericRestaurantId)
        setMenuItems(data)
      } catch (err) {
        setError('Menu konnte nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    if (Number.isFinite(numericRestaurantId)) {
      load()
    }
  }, [numericRestaurantId])

  const handleAdd = (item) => {
    addItem(
      { menuItemId: item.id, name: item.name, price: item.price },
      numericRestaurantId,
    )
  }

  return (
    <div className="page">
      <h1>Menu</h1>
      <p className="muted">Restaurant ID: {restaurantId}</p>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        {isLoading ? (
          <div className="muted">Lade Menu...</div>
        ) : (
          menuItems.map((item) => (
            <div className="card-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <div className="muted">€{item.price.toFixed(2)}</div>
              </div>
              <button
                type="button"
                className="btn-blue"
                onClick={() => handleAdd(item)}
              >
                Add
              </button>
            </div>
          ))
        )}
      </div>
      <div className="actions">
        <Link to="/checkout" className="primary-link">
          Warenkorb prüfen ({cartItems.length}) · €{subtotal.toFixed(2)}
        </Link>
      </div>
    </div>
  )
}

export default MenuPage
