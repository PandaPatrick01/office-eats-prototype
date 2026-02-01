import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createAuditLog,
  createUser,
  fetchInviteByToken,
  updateInvite,
} from '../api/endpoints.js'

function InvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [invite, setInvite] = useState(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchInviteByToken(token)
        if (!data || data.status === 'USED') {
          setError('Einladung ungültig oder bereits verwendet.')
          setInvite(null)
        } else {
          setInvite(data)
        }
      } catch (err) {
        setError('Einladung konnte nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [token])

  const handleRegister = async () => {
    if (!invite) return
    if (!name.trim()) {
      setError('Bitte Namen eingeben.')
      return
    }
    setError('')
    try {
      const user = await createUser({
        name: name.trim(),
        email: invite.email,
        role: 'employee',
        status: 'PENDING',
      })
      await updateInvite(invite.id, {
        status: 'USED',
        usedAt: new Date().toISOString(),
        usedByUserId: user.id,
      })
      await createAuditLog({
        at: new Date().toISOString(),
        action: 'INVITE_USED',
        actorUserId: user.id,
        inviteId: invite.id,
        targetUserId: user.id,
        details: { email: invite.email },
      })
      await createAuditLog({
        at: new Date().toISOString(),
        action: 'USER_REGISTERED',
        actorUserId: user.id,
        inviteId: invite.id,
        targetUserId: user.id,
        details: { email: invite.email },
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError('Registrierung fehlgeschlagen.')
      console.error(err)
    }
  }

  return (
    <div className="page">
      <h1>Einladung</h1>
      {error ? <div className="error">{error}</div> : null}
      {isLoading ? (
        <div className="muted">Lade Einladung...</div>
      ) : invite && !success ? (
        <div className="card">
          <div className="muted">Einladung für {invite.email}</div>
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Passwort (Platzhalter)</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="button" className="btn-blue" onClick={handleRegister}>
            Registrieren
          </button>
        </div>
      ) : success ? (
        <div className="card">
          <strong>Registrierung erfolgreich!</strong>
          <div className="muted">Weiterleitung zum Login...</div>
        </div>
      ) : null}
    </div>
  )
}

export default InvitePage
