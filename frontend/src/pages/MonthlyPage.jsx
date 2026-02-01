import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ensureMonthlyStatement,
  fetchMonthlyStatementsByUser,
} from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'

function MonthlyPage() {
  const { currentUser } = useAuth()
  const [statements, setStatements] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const currentMonthKey = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [yearStr, monthStr] = currentMonthKey.split('-')
  const nextMonthDate = new Date(Number(yearStr), Number(monthStr), 1)
  const availabilityDate = new Date(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
    1,
  )
  const availabilityLabel = `01.${String(
    availabilityDate.getMonth() + 1,
  ).padStart(2, '0')}.${availabilityDate.getFullYear()}`

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchMonthlyStatementsByUser(currentUser.id)
        setStatements(data)
      } catch (err) {
        setError('Monatsabrechnungen konnten nicht geladen werden.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [currentUser])

  const handleGenerateCurrent = async () => {
    if (!currentUser) return
    try {
      const created = await ensureMonthlyStatement(
        currentUser.id,
        currentMonthKey,
        { overwrite: true },
      )
      if (created) {
        const data = await fetchMonthlyStatementsByUser(currentUser.id)
        setStatements(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="page">
      <h1>Monatsabrechnungen</h1>
      <p>Monatsabrechnungen für dich.</p>
      {!currentUser ? (
        <div className="error">Bitte zuerst einloggen.</div>
      ) : null}
      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <div className="field">
          <span>Monat</span>
          <strong>{currentMonthKey}</strong>
        </div>
        <div className="muted">Abrechnung verfügbar ab {availabilityLabel}</div>
        <button type="button" className="btn-blue" onClick={handleGenerateCurrent}>
          Abrechnung für aktuellen Monat erstellen
        </button>
      </div>

      <div className="page-section">
        <h2>Vorhandene Abrechnungen</h2>
        <div className="card">
          {isLoading ? (
            <div className="muted">Lade Monatsabrechnungen...</div>
          ) : statements.length === 0 ? (
            <div className="muted">Noch keine Monatsabrechnungen.</div>
          ) : (
            statements.map((statement) => (
              <Link
                className="card-row row-button"
                key={statement.id}
                to={`/monthly/${statement.id}`}
              >
                <div>
                  <strong>{statement.statementNumber ?? statement.month}</strong>
                  <div className="muted">{statement.month}</div>
                </div>
                <div className="order-meta">
                  <span>{statement.orderCount ?? 0} Orders</span>
                  <span>€{Number(statement.total ?? 0).toFixed(2)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MonthlyPage
