import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { fetchUsers } from '../api/endpoints.js'

function LoginPage() {
  const navigate = useNavigate()
  const { currentUser, login } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentUser) {
      navigate('/restaurants', { replace: true })
      return
    }

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchUsers()
        setUsers(data)
        if (data.length > 0) {
          setSelectedId(String(data[0].id))
        }
      } catch (err) {
        setError('Konnte Users nicht laden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [currentUser, navigate])

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === selectedId),
    [users, selectedId],
  )

  const handleLogin = () => {
    if (!selectedUser) return
    login(selectedUser)
    navigate('/restaurants', { replace: true })
  }

  return (
    <div className="page">
      <h1>Login</h1>
      <p>Bitte User auswählen und einloggen.</p>
      <div className="card">
        <label className="field">
          <span>User</span>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            disabled={isLoading}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Einladungscode/QR (optional)</span>
          <input
            type="text"
            placeholder="z. B. LUNCH-2026"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
          />
        </label>
        {error ? <div className="error">{error}</div> : null}
        <button type="button" className="primary" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  )
}

export default LoginPage
