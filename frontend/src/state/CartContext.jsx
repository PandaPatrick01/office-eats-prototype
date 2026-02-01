import { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

function CartProvider({ children }) {
  const [activeRestaurantId, setActiveRestaurantId] = useState(null)
  const [cartsByRestaurant, setCartsByRestaurant] = useState({})

  const setActiveRestaurant = (restaurantId) => {
    if (!restaurantId) return
    setActiveRestaurantId(restaurantId)
    setCartsByRestaurant((prev) =>
      prev[restaurantId] ? prev : { ...prev, [restaurantId]: [] },
    )
  }

  const clearCart = (restaurantId = activeRestaurantId) => {
    if (!restaurantId) return
    setCartsByRestaurant((prev) => ({ ...prev, [restaurantId]: [] }))
  }

  const addItem = (item, restaurantId = activeRestaurantId) => {
    if (!restaurantId) return
    setActiveRestaurant(restaurantId)
    setCartsByRestaurant((prev) => {
      const current = prev[restaurantId] ?? []
      const existing = current.find(
        (entry) => entry.menuItemId === item.menuItemId,
      )
      const nextItems = existing
        ? current.map((entry) =>
            entry.menuItemId === item.menuItemId
              ? { ...entry, qty: entry.qty + 1 }
              : entry,
          )
        : [...current, { ...item, qty: 1 }]
      return { ...prev, [restaurantId]: nextItems }
    })
  }

  const removeItem = (menuItemId, restaurantId = activeRestaurantId) => {
    if (!restaurantId) return
    setCartsByRestaurant((prev) => {
      const current = prev[restaurantId] ?? []
      const next = current
        .map((entry) =>
          entry.menuItemId === menuItemId
            ? { ...entry, qty: entry.qty - 1 }
            : entry,
        )
        .filter((entry) => entry.qty > 0)
      return { ...prev, [restaurantId]: next }
    })
  }

  const cartItems = useMemo(
    () => (activeRestaurantId ? cartsByRestaurant[activeRestaurantId] ?? [] : []),
    [activeRestaurantId, cartsByRestaurant],
  )

  const subtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems],
  )

  const value = useMemo(
    () => ({
      cartItems,
      activeRestaurantId,
      subtotal,
      addItem,
      removeItem,
      clearCart,
      setActiveRestaurant,
    }),
    [cartItems, activeRestaurantId, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}

export { CartProvider, useCart }
