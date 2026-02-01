import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addGroupOrderItem,
  fetchGroupOrderByToken,
  fetchMenuItems,
} from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'
import QRCode from 'qrcode'

function GroupOrderJoinPage() {
  const navigate = useNavigate()
  const { token } = useParams()
  const { currentUser } = useAuth()
  const [codeInput, setCodeInput] = useState('')
  const [groupOrder, setGroupOrder] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isCreator = groupOrder && currentUser
    ? groupOrder.creatorUserId === currentUser.id
    : false

  const allItems = useMemo(() => {
    if (!groupOrder?.participants?.length) return []
    const merged = new Map()
    groupOrder.participants.forEach((participant) => {
      ;(participant.items ?? []).forEach((item) => {
        const key = item.menuItemId
        const existing = merged.get(key)
        if (existing) {
          existing.qty += item.qty
        } else {
          merged.set(key, { ...item })
        }
      })
    })
    return Array.from(merged.values())
  }, [groupOrder])

  useEffect(() => {
    if (!token) return

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchGroupOrderByToken(token)
        if (!data) {
          setError('Sammelbestellung nicht gefunden.')
          setGroupOrder(null)
          return
        }
        setGroupOrder(data)
      } catch (err) {
        setError('Sammelbestellung konnte nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [token])

  useEffect(() => {
    if (!groupOrder?.restaurantId) return

    const loadMenu = async () => {
      try {
        const data = await fetchMenuItems(groupOrder.restaurantId)
        setMenuItems(data)
      } catch (err) {
        console.error(err)
      }
    }

    loadMenu()
  }, [groupOrder?.restaurantId])

  useEffect(() => {
    const addParticipantIfNeeded = async () => {
      if (!groupOrder || !currentUser || groupOrder.status !== 'OPEN') return
      const exists = groupOrder.participants?.some(
        (participant) => participant.userId === currentUser.id,
      )
      if (exists) return
      const nextParticipants = [
        ...(groupOrder.participants ?? []),
        { userId: currentUser.id, name: currentUser.name, items: [] },
      ]
      try {
        const updated = await addGroupOrderItem(token, {
          participants: nextParticipants,
        })
        setGroupOrder(updated)
      } catch (err) {
        console.error(err)
      }
    }

    if (token) {
      addParticipantIfNeeded()
    }
  }, [groupOrder, currentUser, token])

  const handleJoin = () => {
    if (!codeInput.trim()) return
    navigate(`/group-orders/${codeInput.trim()}`)
  }

  const handleAddItem = async (item) => {
    if (!groupOrder || !currentUser) return
    if (groupOrder.status !== 'OPEN') {
      setError('Sammelbestellung ist geschlossen.')
      return
    }
    const participants = groupOrder.participants ?? []
    const nextParticipants = participants.map((participant) => {
      if (participant.userId !== currentUser.id) return participant
      const items = participant.items ?? []
      const existing = items.find((entry) => entry.menuItemId === item.id)
      if (existing) {
        return {
          ...participant,
          items: items.map((entry) =>
            entry.menuItemId === item.id
              ? { ...entry, qty: entry.qty + 1 }
              : entry,
          ),
        }
      }
      return {
        ...participant,
        items: [
          ...items,
          { menuItemId: item.id, name: item.name, price: item.price, qty: 1 },
        ],
      }
    })

    setIsSubmitting(true)
    setError('')
    try {
      const updated = await addGroupOrderItem(token, {
        participants: nextParticipants,
      })
      setGroupOrder(updated)
    } catch (err) {
      setError('Item konnte nicht hinzugefügt werden.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link)
    } catch (err) {
      console.error(err)
    }
  }

  const handleGenerateQr = async (link) => {
    try {
      const dataUrl = await QRCode.toDataURL(link, { width: 180, margin: 1 })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmitGroup = async () => {
    if (!groupOrder || !isCreator) return
    const participants = groupOrder.participants ?? []
    const totals = participants.reduce(
      (acc, participant) => {
        participant.items?.forEach((item) => {
          acc.totalItems += item.qty
          acc.subtotal += item.qty * item.price
        })
        return acc
      },
      { totalItems: 0, subtotal: 0 },
    )

    setIsSubmitting(true)
    setError('')
    try {
      const updated = await addGroupOrderItem(token, {
        status: 'SUBMITTED',
        summary: {
          totalItems: totals.totalItems,
          subtotal: Number(totals.subtotal.toFixed(2)),
        },
      })
      setGroupOrder(updated)
    } catch (err) {
      setError('Sammelbestellung konnte nicht abgeschlossen werden.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="page">
        <h1>Group Order beitreten</h1>
        <p>Gib den Code ein, um beizutreten.</p>
        <div className="card">
          <label className="field">
            <span>Code</span>
            <input
              type="text"
              placeholder="z. B. LUNCH-2026"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
            />
          </label>
          <button type="button" className="primary" onClick={handleJoin}>
            Beitreten
          </button>
        </div>
      </div>
    )
  }

  const shareLink = `${window.location.origin}/group-orders/${token}`

  return (
    <div className="page">
      <h1>Group Order</h1>
      {error ? <div className="error">{error}</div> : null}
      {isLoading ? (
        <div className="muted">Lade Sammelbestellung...</div>
      ) : groupOrder ? (
        <>
          <div className="card">
            <div className="card-row">
              <div>
                <strong>Status</strong>
                <div className="muted">{groupOrder.status}</div>
              </div>
              <div className="muted">
                Restaurant #{groupOrder.restaurantId} · Slot #
                {groupOrder.timeSlotId}
              </div>
            </div>
            <div>
              <strong>Link teilen</strong>
              <div className="muted">{shareLink}</div>
              <div className="actions">
                <button
                  type="button"
                  className="btn-blue"
                  onClick={() => handleCopyLink(shareLink)}
                >
                  Link kopieren
                </button>
                <button
                  type="button"
                  className="btn-blue"
                  onClick={() => handleGenerateQr(shareLink)}
                >
                  QR Code erstellen
                </button>
              </div>
              {qrDataUrl ? (
                <div className="qr-preview">
                  <img src={qrDataUrl} alt="QR Code" />
                </div>
              ) : null}
            </div>
            <div>
              <strong>Teilnehmer</strong>
              <div className="participant-list">
                {(groupOrder.participants ?? []).map((participant) => (
                  <div key={participant.userId} className="participant-item">
                    <span>{participant.name}</span>
                    <span className="muted">
                      {participant.items?.reduce(
                        (sum, item) => sum + item.qty,
                        0,
                      ) ?? 0}{' '}
                      Items
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {isCreator && groupOrder.status === 'OPEN' ? (
              <button
                type="button"
                className="primary"
                onClick={handleSubmitGroup}
                disabled={isSubmitting}
              >
                Sammelbestellung abschließen
              </button>
            ) : null}
          </div>

          <div className="page-section">
            <h2>Menu</h2>
            <div className="card">
              {menuItems.map((item) => (
                <div className="card-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted">€{item.price.toFixed(2)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-blue"
                    onClick={() => handleAddItem(item)}
                    disabled={isSubmitting || groupOrder.status !== 'OPEN'}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {!currentUser ? (
        <div className="error">Bitte zuerst einloggen.</div>
      ) : null}
      {groupOrder ? (
        <div className="page-section">
          <h2>Alle Gerichte</h2>
          <div className="card">
            {allItems.length ? (
              allItems.map((item) => (
                <div className="card-row" key={item.menuItemId}>
                  <div>
                    <strong>
                      {item.name} x{item.qty}
                    </strong>
                    <div className="muted">€{item.price.toFixed(2)}</div>
                  </div>
                  <span>€{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="muted">Noch keine Items.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default GroupOrderJoinPage
