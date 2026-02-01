import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

const linkClass = ({ isActive }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link'

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuth()
  const path = location.pathname
  const hideBackButton =
    path === '/restaurants' ||
    path === '/orders' ||
    path === '/invoices' ||
    path === '/monthly' ||
    path.startsWith('/group-order') ||
    path.startsWith('/group-orders')

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">OfficeEats</div>
        {currentUser ? (
          <div className="login-chip">
            Eingeloggt als {currentUser.name} ({currentUser.role})
          </div>
        ) : (
          <div className="login-chip muted">Nicht eingeloggt</div>
        )}
        <nav className="nav">
          <NavLink className={linkClass} to="/restaurants">
            Restaurants
          </NavLink>
          <NavLink className={linkClass} to="/orders">
            Orders
          </NavLink>
          <NavLink className={linkClass} to="/invoices">
            Invoices
          </NavLink>
          <NavLink className={linkClass} to="/monthly">
            Monthly
          </NavLink>
          <NavLink className={linkClass} to="/group-order/create">
            Group Order
          </NavLink>
          {currentUser?.role === 'manager' ? (
            <>
              <NavLink className={linkClass} to="/admin/users">
                Nutzerverwaltung
              </NavLink>
              <NavLink className={linkClass} to="/admin/restaurants">
                Restaurantverwaltung
              </NavLink>
            </>
          ) : null}
          {currentUser ? (
            <button
              type="button"
              className="btn-orange"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Logout
            </button>
          ) : (
            <NavLink className="btn-orange" to="/login">
              Login
            </NavLink>
          )}
        </nav>
      </header>
      {!hideBackButton ? (
        <div className="back-row">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
            aria-label="Zurück"
          >
            ←
          </button>
        </div>
      ) : null}
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-links">
          <NavLink to="/impressum">Impressum</NavLink>
          <NavLink to="/kontakt">Kontakt</NavLink>
          <NavLink to="/datenschutz">Datenschutz</NavLink>
          <NavLink to="/agb">AGB</NavLink>
        </div>
      </footer>
    </div>
  )
}

export default AppLayout
