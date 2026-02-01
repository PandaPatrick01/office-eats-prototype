import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  createAuditLog,
  createInvite,
  deleteUser,
  fetchUsers,
  updateUser,
} from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'

function AdminUsersPage() {
  const { currentUser } = useAuth()
  const [email, setEmail] = useState('')
  const [users, setUsers] = useState([])
  const [inviteLink, setInviteLink] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isManager = currentUser?.role === 'manager'

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      setError('Nutzer konnten nicht geladen werden.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isManager) {
      loadUsers()
    }
  }, [isManager])

  const handleInvite = async () => {
    if (!email.trim()) return
    setError('')
    try {
      const token = Math.random().toString(36).slice(2, 10)
      const payload = {
        email: email.trim(),
        token,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        createdByUserId: currentUser?.id ?? null,
      }
      const invite = await createInvite(payload)
      await createAuditLog({
        at: new Date().toISOString(),
        action: 'INVITE_CREATED',
        actorUserId: currentUser?.id ?? null,
        inviteId: invite.id,
        details: { email: invite.email },
      })
      const link = `${window.location.origin}/invite/${token}`
      setInviteLink(link)
      const dataUrl = await QRCode.toDataURL(link, { width: 180, margin: 1 })
      setQrDataUrl(dataUrl)
      setEmail('')
      await loadUsers()
    } catch (err) {
      setError('Einladung konnte nicht erstellt werden.')
      console.error(err)
    }
  }

  const handleCopyInvite = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (user) => {
    if (!isManager) return
    try {
      await deleteUser(user.id)
      await createAuditLog({
        at: new Date().toISOString(),
        action: 'USER_DELETED',
        actorUserId: currentUser?.id ?? null,
        targetUserId: user.id,
      })
      await loadUsers()
    } catch (err) {
      setError('Löschen fehlgeschlagen.')
      console.error(err)
    }
  }

  const handleActivate = async (user) => {
    if (!isManager) return
    setError('')
    try {
      const updated = await updateUser(user.id, { status: 'ACTIVE' })
      await createAuditLog({
        at: new Date().toISOString(),
        action: 'USER_ACTIVATED',
        actorUserId: currentUser?.id ?? null,
        targetUserId: updated.id,
      })
      await loadUsers()
    } catch (err) {
      setError('Freischalten fehlgeschlagen.')
      console.error(err)
    }
  }

  const statusLabel = useMemo(
    () => ({
      ACTIVE: 'Aktiv',
      PENDING: 'Ausstehend',
    }),
    [],
  )

  if (!isManager) {
    return (
      <div className="page">
        <h1>Nutzerverwaltung</h1>
        <div className="error">Nicht autorisiert.</div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Nutzerverwaltung</h1>
      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <label className="field">
          <span>Email für Einladung</span>
          <input
            type="email"
            value={email}
            placeholder="name@firma.de"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button type="button" className="btn-blue" onClick={handleInvite}>
          Einladung erstellen
        </button>
        {inviteLink ? (
          <div className="page-section">
            <strong>Einladung</strong>
            <div className="muted">{inviteLink}</div>
            <button type="button" className="btn-blue" onClick={handleCopyInvite}>
              Link kopieren
            </button>
            {qrDataUrl ? (
              <div className="qr-preview">
                <img src={qrDataUrl} alt="QR Code" />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="page-section">
        <h2>Unternehmensnutzer</h2>
        <div className="card">
          {isLoading ? (
            <div className="muted">Lade Nutzer...</div>
          ) : (
            users.map((user) => (
              <div className="card-row" key={user.id}>
                <div>
                  <strong>{user.name || user.email}</strong>
                  <div className="muted">{user.email}</div>
                </div>
                <div className="order-meta">
                  <span className="status-badge status-CONFIRMED">
                    {statusLabel[user.status] ?? 'Unbekannt'}
                  </span>
                  <button
                    type="button"
                    className="btn-blue"
                    onClick={() => handleDelete(user)}
                  >
                    Löschen
                  </button>
                  {user.status === 'PENDING' ? (
                    <button
                      type="button"
                      className="btn-blue"
                      onClick={() => handleActivate(user)}
                    >
                      Freischalten
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
