import { useEffect, useState } from 'react'
import { updateUser } from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'

const maskReference = (value) => {
  if (!value) return ''
  const trimmed = value.replace(/\s+/g, '')
  if (trimmed.length <= 4) return `****${trimmed}`
  return `****${trimmed.slice(-4)}`
}

function ProfilePage() {
  const { currentUser, login } = useAuth()
  const [paymentType, setPaymentType] = useState('CARD')
  const [reference, setReference] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!currentUser?.paymentMethod) return
    setPaymentType(currentUser.paymentMethod.type ?? 'CARD')
    setReference(currentUser.paymentMethod.reference ?? '')
  }, [currentUser])

  const handleSave = async () => {
    if (!currentUser) return
    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const masked = maskReference(reference)
      const updated = await updateUser(currentUser.id, {
        paymentMethod: {
          type: paymentType,
          reference: masked,
        },
      })
      login(updated)
      setSuccess('Zahlungsmethode gespeichert.')
    } catch (err) {
      setError('Konnte Zahlungsdaten nicht speichern.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="page">
        <h1>Profil</h1>
        <div className="error">Bitte zuerst einloggen.</div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Profil</h1>
      <div className="card">
        <div className="card-row">
          <div>
            <strong>Name</strong>
            <div className="muted">{currentUser.name}</div>
          </div>
          <div>
            <strong>Email</strong>
            <div className="muted">{currentUser.email}</div>
          </div>
        </div>
        <div className="card-row">
          <div>
            <strong>Role</strong>
            <div className="muted">{currentUser.role}</div>
          </div>
          <div>
            <strong>Status</strong>
            <div className="muted">{currentUser.status ?? 'ACTIVE'}</div>
          </div>
        </div>
      </div>

      <div className="page-section">
        <h2>Zahlungsmethode</h2>
        {error ? <div className="error">{error}</div> : null}
        {success ? <div className="success">{success}</div> : null}
        <div className="card">
          <label className="field">
            <span>Typ</span>
            <select
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value)}
            >
              <option value="CARD">CARD</option>
              <option value="SEPA">SEPA</option>
              <option value="PAYPAL">PAYPAL</option>
            </select>
          </label>
          <label className="field">
            <span>Referenz</span>
            <input
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="z. B. IBAN oder Karten-Endziffern"
            />
          </label>
          <div className="muted">
            Payment ist im MVP nicht integriert – Speicherung dient der späteren
            Abrechnung.
          </div>
          <button
            type="button"
            className="btn-blue"
            onClick={handleSave}
            disabled={isSaving}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
