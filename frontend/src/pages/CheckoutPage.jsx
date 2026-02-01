import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createOrder,
  fetchRestaurantSettings,
  fetchTimeSlots,
} from '../api/endpoints.js'
import { useCart } from '../state/CartContext.jsx'
import { useAuth } from '../state/AuthContext.jsx'

function CheckoutPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const {
    cartItems,
    subtotal,
    removeItem,
    clearCart,
    activeRestaurantId,
  } = useCart()
  const [timeSlots, setTimeSlots] = useState([])
  const [settings, setSettings] = useState([])
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTos, setAcceptedTos] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [timeSlotsData, settingsData] = await Promise.all([
          fetchTimeSlots(),
          fetchRestaurantSettings(),
        ])
        setTimeSlots(timeSlotsData)
        setSettings(settingsData)
        if (timeSlotsData.length > 0) {
          setSelectedTimeSlotId(String(timeSlotsData[0].id))
        }
      } catch (err) {
        setError('Zeitslots konnten nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const subsidyPercent = useMemo(() => {
    if (!activeRestaurantId) return 0
    const setting = settings.find(
      (entry) => String(entry.restaurantId) === String(activeRestaurantId),
    )
    return Number(setting?.subsidyPercent ?? setting?.subsidyAmount ?? 0)
  }, [settings, activeRestaurantId])

  const subsidy = Math.min((subtotal * subsidyPercent) / 100, subtotal)
  const finalTotal = Math.max(subtotal - subsidy, 0)

  useEffect(() => {
    if (currentUser?.status && currentUser.status !== 'ACTIVE') {
      navigate('/pending', { replace: true })
    }
  }, [currentUser, navigate])

  const handleSubmit = async () => {
    if (!currentUser) {
      setError('Bitte zuerst einloggen.')
      return
    }
    if (currentUser.status && currentUser.status !== 'ACTIVE') {
      navigate('/pending', { replace: true })
      return
    }
    if (!activeRestaurantId) {
      setError('Bitte erst ein Restaurant wählen.')
      return
    }
    if (!selectedTimeSlotId) {
      setError('Bitte einen Zeitslot wählen.')
      return
    }
    if (cartItems.length === 0) {
      setError('Warenkorb ist leer.')
      return
    }
    if (!acceptedTos || !acceptedPrivacy) {
      const missing = []
      if (!acceptedTos) missing.push('AGB')
      if (!acceptedPrivacy) missing.push('Datenschutzerklärung')
      setError(`Bitte ${missing.join(' und ')} akzeptieren.`)
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const createdAt = new Date().toISOString()
      const acceptedAt = acceptedTos && acceptedPrivacy ? createdAt : null
      const payload = {
        userId: currentUser.id,
        restaurantId: activeRestaurantId,
        timeSlotId: Number(selectedTimeSlotId),
        status: 'CONFIRMED',
        createdAt,
        subtotal: finalTotal,
        acceptedTos,
        acceptedPrivacy,
        acceptedAt,
        statusHistory: [
          { at: createdAt, by: 'employee', event: 'CONFIRMED' },
        ],
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
      }
      await createOrder(payload)
      clearCart(activeRestaurantId)
      navigate('/orders', { replace: true })
    } catch (err) {
      setError('Bestellung konnte nicht erstellt werden.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1>Checkout</h1>
      <p>Überprüfe deinen Warenkorb.</p>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
        {cartItems.length === 0 ? (
          <div className="muted">Warenkorb ist leer.</div>
        ) : (
          cartItems.map((item) => (
            <div className="card-row" key={item.menuItemId}>
              <div>
                <strong>
                  {item.name} x{item.qty}
                </strong>
                <div className="muted">
                  €{item.price.toFixed(2)} pro Stück
                </div>
              </div>
              <button
                type="button"
                className="btn-blue"
                onClick={() => removeItem(item.menuItemId)}
              >
                Entfernen
              </button>
            </div>
          ))
        )}
        <div className="card-row">
          <div>
            <strong>Subtotal</strong>
            <div className="muted">{cartItems.length} Items</div>
          </div>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        <div className="card-row">
          <div>
            <strong>Zuschuss</strong>
            <div className="muted">
              {subsidyPercent.toFixed(0)}% auf den Subtotal
            </div>
          </div>
          <span>-€{subsidy.toFixed(2)}</span>
        </div>
        <div className="card-row">
          <div>
            <strong>Final Total</strong>
          </div>
          <span>€{finalTotal.toFixed(2)}</span>
        </div>
        <div>
          <strong>Zeitslot</strong>
          <div className="slot-list">
            {isLoading ? (
              <div className="muted">Lade Zeitslots...</div>
            ) : (
              timeSlots.map((slot) => (
                <label key={slot.id} className="slot-item">
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot.id}
                    checked={String(slot.id) === selectedTimeSlotId}
                    onChange={(event) =>
                      setSelectedTimeSlotId(event.target.value)
                    }
                  />
                  <span>{slot.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <div className="consent-box">
            <label className="consent-row">
              <input
                type="checkbox"
                checked={acceptedTos}
                onChange={(event) => setAcceptedTos(event.target.checked)}
              />
              <span>
                Ich habe die{' '}
                <a className="consent-link" href="/agb">
                  AGB
                </a>{' '}
                gelesen und akzeptiere sie.
              </span>
            </label>
            <label className="consent-row">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(event) => setAcceptedPrivacy(event.target.checked)}
              />
              <span>
                Ich habe die{' '}
                <a className="consent-link" href="/datenschutz">
                  Datenschutzerklärung
                </a>{' '}
                gelesen und stimme der Verarbeitung meiner Daten zu.
              </span>
            </label>
            <div className="muted">
              Hinweis: Dies ist ein MVP-Prototyp. Die Zustimmung wird zu
              Demonstrationszwecken gespeichert.
            </div>
        </div>
        <div className="actions">
          <button
            type="button"
            className="primary btn-small"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Bestellen
          </button>
          <button type="button" className="btn-blue btn-small" onClick={clearCart}>
            Warenkorb leeren
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
