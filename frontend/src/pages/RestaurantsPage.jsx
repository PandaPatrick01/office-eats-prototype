import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRestaurants, fetchRestaurantSettings } from '../api/endpoints.js'

function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [settings, setSettings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [restaurantsData, settingsData] = await Promise.all([
          fetchRestaurants(),
          fetchRestaurantSettings(),
        ])
        setRestaurants(restaurantsData)
        setSettings(settingsData)
      } catch (err) {
        setError('Restaurants konnten nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="page">
      <h1>Restaurants</h1>
      <p>Wähle ein Restaurant aus.</p>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        {isLoading ? (
          <div className="muted">Lade Restaurants...</div>
        ) : (
          restaurants
            .filter((restaurant) => {
              const setting = settings.find(
                (entry) => String(entry.restaurantId) === String(restaurant.id),
              )
              return setting?.isEnabled ?? false
            })
            .map((restaurant) => (
            <div className="card-row" key={restaurant.id}>
              <div>
                <strong>{restaurant.name}</strong>
                <div className="muted">{restaurant.cuisine}</div>
              </div>
              <Link
                to={`/restaurants/${restaurant.id}/menu`}
                className="btn-blue"
              >
                Menu
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RestaurantsPage
