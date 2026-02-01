import { useEffect, useMemo, useState } from 'react'
import {
  createAuditLog,
  createRestaurantSetting,
  fetchRestaurants,
  fetchRestaurantSettings,
  updateRestaurantSetting,
} from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'

const clampSubsidy = (value) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 0
  return Math.min(Math.max(numeric, 0), 100)
}

function AdminRestaurantsPage() {
  const { currentUser } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [settings, setSettings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isManager = currentUser?.role === 'manager'

  const loadData = async () => {
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
      setError('Restaurantdaten konnten nicht geladen werden.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isManager) {
      loadData()
    }
  }, [isManager])

  const settingsByRestaurant = useMemo(() => {
    const map = new Map()
    settings.forEach((setting) => {
      map.set(String(setting.restaurantId), setting)
    })
    return map
  }, [settings])

  const upsertSetting = async (restaurantId, patch) => {
    const existing = settingsByRestaurant.get(String(restaurantId))
    const payload = {
      restaurantId,
      isEnabled: existing?.isEnabled ?? false,
      subsidyPercent:
        existing?.subsidyPercent ?? existing?.subsidyAmount ?? 0,
      ...patch,
    }

    if (existing) {
      return updateRestaurantSetting(existing.id, payload)
    }
    return createRestaurantSetting(payload)
  }

  const handleToggle = async (restaurant) => {
    if (!isManager) return
    try {
      const updated = await upsertSetting(restaurant.id, {
        isEnabled: !settingsByRestaurant.get(String(restaurant.id))?.isEnabled,
      })
      await createAuditLog({
        at: new Date().toISOString(),
        action: 'RESTAURANT_SETTING_UPDATED',
        actorUserId: currentUser?.id ?? null,
        targetRestaurantId: restaurant.id,
        details: updated,
      })
      await loadData()
    } catch (err) {
      setError('Änderung konnte nicht gespeichert werden.')
      console.error(err)
    }
  }

  const handleSubsidyChange = async (restaurant, value) => {
    if (!isManager) return
    try {
      const updated = await upsertSetting(restaurant.id, {
        subsidyPercent: clampSubsidy(value),
      })
      await createAuditLog({
        at: new Date().toISOString(),
        action: 'RESTAURANT_SETTING_UPDATED',
        actorUserId: currentUser?.id ?? null,
        targetRestaurantId: restaurant.id,
        details: updated,
      })
      await loadData()
    } catch (err) {
      setError('Zuschuss konnte nicht gespeichert werden.')
      console.error(err)
    }
  }

  if (!isManager) {
    return (
      <div className="page">
        <h1>Restaurantverwaltung</h1>
        <div className="error">Nicht autorisiert.</div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Restaurantverwaltung</h1>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        {isLoading ? (
          <div className="muted">Lade Restaurants...</div>
        ) : (
          restaurants.map((restaurant) => {
            const setting = settingsByRestaurant.get(String(restaurant.id))
            return (
              <div className="card-row" key={restaurant.id}>
                <div>
                  <strong>{restaurant.name}</strong>
                  <div className="muted">{restaurant.cuisine}</div>
                </div>
                <div className="order-meta">
                  <label className="inline-field">
                    <span>Aktiv</span>
                    <input
                      type="checkbox"
                      checked={setting?.isEnabled ?? false}
                      onChange={() => handleToggle(restaurant)}
                    />
                  </label>
                  <label className="field">
                    <span>Zuschuss (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={
                        setting?.subsidyPercent ??
                        setting?.subsidyAmount ??
                        0
                      }
                      onChange={(event) =>
                        handleSubsidyChange(restaurant, event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AdminRestaurantsPage
