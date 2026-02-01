import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGroupOrder, fetchRestaurants, fetchTimeSlots } from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'

function GroupOrderCreatePage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [restaurantId, setRestaurantId] = useState('')
  const [timeSlotId, setTimeSlotId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [restaurantsData, timeSlotsData] = await Promise.all([
          fetchRestaurants(),
          fetchTimeSlots(),
        ])
        setRestaurants(restaurantsData)
        setTimeSlots(timeSlotsData)
        if (restaurantsData.length > 0) {
          setRestaurantId(String(restaurantsData[0].id))
        }
        if (timeSlotsData.length > 0) {
          setTimeSlotId(String(timeSlotsData[0].id))
        }
      } catch (err) {
        setError('Daten konnten nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const handleCreate = async () => {
    if (!currentUser) {
      setError('Bitte zuerst einloggen.')
      return
    }
    if (!restaurantId || !timeSlotId) {
      setError('Bitte Restaurant und Zeitslot wählen.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const token = Math.random().toString(36).slice(2, 10)
      const payload = {
        token,
        creatorUserId: currentUser.id,
        restaurantId: Number(restaurantId),
        timeSlotId: Number(timeSlotId),
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        participants: [
          {
            userId: currentUser.id,
            name: currentUser.name,
            items: [],
          },
        ],
      }
      await createGroupOrder(payload)
      navigate(`/group-orders/${token}`, { replace: true })
    } catch (err) {
      setError('Gruppe konnte nicht erstellt werden.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1>Group Order erstellen</h1>
      <p>Wähle Restaurant und Zeitslot.</p>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        <label className="field">
          <span>Restaurant</span>
          <select
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
            disabled={isLoading}
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Zeitslot</span>
          <select
            value={timeSlotId}
            onChange={(event) => setTimeSlotId(event.target.value)}
            disabled={isLoading}
          >
            {timeSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="primary"
          onClick={handleCreate}
          disabled={isSubmitting}
        >
          Gruppe erstellen
        </button>
      </div>
    </div>
  )
}

export default GroupOrderCreatePage
