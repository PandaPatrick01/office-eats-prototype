import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RestaurantsPage from './pages/RestaurantsPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import GroupOrderCreatePage from './pages/GroupOrderCreatePage.jsx'
import GroupOrderJoinPage from './pages/GroupOrderJoinPage.jsx'
import InvoicesPage from './pages/InvoicesPage.jsx'
import InvoiceDetailPage from './pages/InvoiceDetailPage.jsx'
import MonthlyPage from './pages/MonthlyPage.jsx'
import MonthlyDetailPage from './pages/MonthlyDetailPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import InvitePage from './pages/InvitePage.jsx'
import AdminRestaurantsPage from './pages/AdminRestaurantsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ImpressumPage from './pages/ImpressumPage.jsx'
import KontaktPage from './pages/KontaktPage.jsx'
import DatenschutzPage from './pages/DatenschutzPage.jsx'
import AgbPage from './pages/AgbPage.jsx'
import PendingPage from './pages/PendingPage.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import { CartProvider } from './state/CartContext.jsx'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/restaurants" replace />} />
              <Route path="restaurants" element={<RestaurantsPage />} />
              <Route
                path="restaurants/:restaurantId/menu"
                element={<MenuPage />}
              />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="group-order/create" element={<GroupOrderCreatePage />} />
              <Route path="group-order/join" element={<GroupOrderJoinPage />} />
              <Route path="group-orders/:token" element={<GroupOrderJoinPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route
                path="invoices/:invoiceId"
                element={<InvoiceDetailPage />}
              />
              <Route path="monthly" element={<MonthlyPage />} />
              <Route path="monthly/:statementId" element={<MonthlyDetailPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/restaurants" element={<AdminRestaurantsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="impressum" element={<ImpressumPage />} />
              <Route path="kontakt" element={<KontaktPage />} />
              <Route path="datenschutz" element={<DatenschutzPage />} />
              <Route path="agb" element={<AgbPage />} />
              <Route path="pending" element={<PendingPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/restaurants" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
