import { del, get, patch, post } from './client.js'

const withQuery = (path, params) => {
  const query = new URLSearchParams(params)
  return `${path}?${query.toString()}`
}

function fetchRestaurants() {
  return get('/restaurants')
}

function fetchUsers() {
  return get('/users')
}

function fetchUser(id) {
  return get(`/users/${id}`)
}

function createUser(payload) {
  return post('/users', payload)
}

function updateUser(id, payload) {
  return patch(`/users/${id}`, payload)
}

function fetchRestaurant(id) {
  return get(`/restaurants/${id}`)
}

function fetchMenuItems(restaurantId) {
  return get(withQuery('/menuItems', { restaurantId }))
}

function fetchTimeSlots() {
  return get('/timeSlots')
}

function createOrder(payload) {
  return post('/orders', payload)
}

function fetchOrdersByUser(userId) {
  return get(withQuery('/orders', { userId }))
}

function fetchInvoicesByUser(userId) {
  return get(withQuery('/invoices', { userId }))
}

async function fetchInvoiceByOrderId(orderId) {
  const data = await get(withQuery('/invoices', { orderId }))
  return data[0] ?? null
}

function fetchInvoice(id) {
  return get(`/invoices/${id}`)
}

function fetchMonthlyStatements(userId) {
  return get(withQuery('/monthlyStatements', { userId }))
}

async function fetchMonthlyStatementsByUser(userId) {
  return get(withQuery('/monthlyStatements', { userId }))
}

async function fetchMonthlyStatement(userId, month) {
  const data = await get(withQuery('/monthlyStatements', { userId, month }))
  return data[0] ?? null
}

async function fetchMonthlyStatementById(id) {
  try {
    return await get(`/monthlyStatements/${id}`)
  } catch {
    const data = await get('/monthlyStatements')
    return (
      data.find((statement) => String(statement.id) === String(id)) ?? null
    )
  }
}

function createMonthlyStatement(payload) {
  return post('/monthlyStatements', payload)
}

function updateMonthlyStatement(id, payload) {
  return patch(`/monthlyStatements/${id}`, payload)
}

function fetchOrder(id) {
  return get(`/orders/${id}`)
}

function updateOrder(id, payload) {
  return patch(`/orders/${id}`, payload)
}

function createInvoice(payload) {
  return post('/invoices', payload)
}

function createInvite(payload) {
  return post('/invites', payload)
}

async function fetchInviteByToken(token) {
  const data = await get(withQuery('/invites', { token }))
  return data[0] ?? null
}

function updateInvite(id, payload) {
  return patch(`/invites/${id}`, payload)
}

function createAuditLog(payload) {
  return post('/auditLog', payload)
}

function deleteUser(id) {
  return del(`/users/${id}`)
}

function fetchRestaurantSettings() {
  return get('/restaurantSettings')
}

function createRestaurantSetting(payload) {
  return post('/restaurantSettings', payload)
}

function updateRestaurantSetting(id, payload) {
  return patch(`/restaurantSettings/${id}`, payload)
}

const INVOICE_TAX_RATE = 0.07

function roundCurrency(value) {
  return Math.round(value * 100) / 100
}

function getSubsidyPercent(settings, restaurantId) {
  if (!settings?.length) return 0
  const setting = settings.find(
    (entry) => String(entry.restaurantId) === String(restaurantId),
  )
  return Number(setting?.subsidyPercent ?? setting?.subsidyAmount ?? 0)
}

function buildInvoiceNumber(orderId) {
  const year = new Date().getFullYear()
  const normalized = String(orderId)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase()
    .padStart(6, '0')
  return `OE-${year}-${normalized}`
}

async function ensureInvoiceForDeliveredOrder(order) {
  if (!order || order.status !== 'DELIVERED') {
    return null
  }

  const existing = await fetchInvoiceByOrderId(order.id)
  if (existing) {
    return existing
  }

  const lines = (order.items ?? []).map((item) => ({
    name: item.name,
    unitPrice: item.price,
    qty: item.qty,
    lineTotal: roundCurrency(item.price * item.qty),
  }))

  const rawSubtotal = roundCurrency(
    lines.reduce((sum, line) => sum + line.lineTotal, 0),
  )
  const settings = await fetchRestaurantSettings()
  const subsidyPercent = getSubsidyPercent(settings, order.restaurantId)
  const subsidyAmount = roundCurrency(
    Math.min((rawSubtotal * subsidyPercent) / 100, rawSubtotal),
  )
  const subtotal = roundCurrency(rawSubtotal - subsidyAmount)
  const taxRate = INVOICE_TAX_RATE
  const taxAmount = roundCurrency(subtotal * taxRate)
  const total = roundCurrency(subtotal + taxAmount)
  const createdAt = new Date().toISOString()
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const payload = {
    invoiceNumber: buildInvoiceNumber(order.id),
    userId: order.userId,
    orderId: order.id,
    restaurantId: order.restaurantId,
    createdAt,
    dueDate,
    currency: 'EUR',
    rawSubtotal,
    subsidyPercent,
    subsidyAmount,
    subtotal,
    taxRate,
    taxAmount,
    total,
    lines,
  }

  return createInvoice(payload)
}

function monthKeyFromDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function periodRange(monthKey) {
  const [yearStr, monthStr] = monthKey.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999))
  return { start, end }
}

function buildMonthlyStatementNumber(monthKey, userId) {
  const normalizedUser = String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(-4)
  return `MS-${monthKey}-${normalizedUser.padStart(4, '0')}`
}

async function fetchDeliveredOrdersByUserAndMonth(userId, monthKey) {
  const orders = await fetchOrdersByUser(userId)
  const { start, end } = periodRange(monthKey)
  return orders.filter((order) => {
    if (order.status !== 'DELIVERED') return false
    const dateValue = order.deliveredAt || order.createdAt
    if (!dateValue) return false
    const date = new Date(dateValue)
    return date >= start && date <= end
  })
}

async function ensureMonthlyStatement(
  userId,
  monthKey,
  { force = false, overwrite = false } = {},
) {
  const existing = await fetchMonthlyStatement(userId, monthKey)

  const deliveredOrders = await fetchDeliveredOrdersByUserAndMonth(
    userId,
    monthKey,
  )
  if (!force && deliveredOrders.length === 0) {
    return null
  }

  if (existing && existing.orders?.length && !overwrite) {
    return existing
  }

  const restaurantIds = [
    ...new Set(deliveredOrders.map((order) => order.restaurantId)),
  ]
  const restaurantEntries = await Promise.all(
    restaurantIds.map(async (id) => {
      try {
        const restaurant = await fetchRestaurant(id)
        return [id, restaurant?.name]
      } catch {
        return [id, null]
      }
    }),
  )
  const restaurantNameById = Object.fromEntries(restaurantEntries)
  const settings = await fetchRestaurantSettings()

  const { start, end } = periodRange(monthKey)
  const taxRate = INVOICE_TAX_RATE
  const orders = deliveredOrders.map((order) => {
    const itemsSubtotal = roundCurrency(
      (order.items ?? []).reduce(
        (sum, item) => sum + item.price * item.qty,
        0,
      ),
    )
    const baseSubtotal = itemsSubtotal || roundCurrency(Number(order.subtotal ?? 0))
    const subsidyPercent = getSubsidyPercent(settings, order.restaurantId)
    const subsidyAmount = roundCurrency(
      Math.min((baseSubtotal * subsidyPercent) / 100, baseSubtotal),
    )
    const subtotal = roundCurrency(baseSubtotal - subsidyAmount)
    const taxAmount = roundCurrency(subtotal * taxRate)
    const total = roundCurrency(subtotal + taxAmount)
    return {
      orderId: order.id,
      restaurantName:
        restaurantNameById[order.restaurantId] ??
        order.restaurantName ??
        `#${order.restaurantId}`,
      deliveredAt: order.deliveredAt || order.createdAt,
      subtotal,
      taxAmount,
      total,
    }
  })

  const subtotal = roundCurrency(orders.reduce((sum, o) => sum + o.subtotal, 0))
  const taxAmount = roundCurrency(subtotal * taxRate)
  const total = roundCurrency(subtotal + taxAmount)

  const payload = {
    statementNumber: buildMonthlyStatementNumber(monthKey, userId),
    userId,
    month: monthKey,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    createdAt: new Date().toISOString(),
    currency: 'EUR',
    subtotal,
    taxRate,
    taxAmount,
    total,
    orderCount: orders.length,
    orders,
  }

  if (existing) {
    return updateMonthlyStatement(existing.id, payload)
  }
  return createMonthlyStatement(payload)
}

function createGroupOrder(payload) {
  return post('/groupOrders', payload)
}

async function fetchGroupOrderByToken(token) {
  const data = await get(withQuery('/groupOrders', { token }))
  return data[0] ?? null
}

async function patchGroupOrderByToken(token, payload) {
  const match = await fetchGroupOrderByToken(token)
  if (!match) {
    throw new Error('Group order not found')
  }
  return patch(`/groupOrders/${match.id}`, payload)
}

function addGroupOrderItem(token, payload) {
  return patchGroupOrderByToken(token, payload)
}

export {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  fetchRestaurants,
  fetchRestaurant,
  fetchMenuItems,
  fetchTimeSlots,
  createOrder,
  fetchOrdersByUser,
  fetchInvoicesByUser,
  fetchInvoiceByOrderId,
  fetchInvoice,
  fetchMonthlyStatements,
  fetchMonthlyStatementsByUser,
  fetchMonthlyStatement,
  fetchMonthlyStatementById,
  createMonthlyStatement,
  updateMonthlyStatement,
  fetchOrder,
  updateOrder,
  createInvoice,
  ensureInvoiceForDeliveredOrder,
  fetchDeliveredOrdersByUserAndMonth,
  ensureMonthlyStatement,
  createInvite,
  fetchInviteByToken,
  updateInvite,
  createAuditLog,
  fetchRestaurantSettings,
  createRestaurantSetting,
  updateRestaurantSetting,
  createGroupOrder,
  fetchGroupOrderByToken,
  addGroupOrderItem,
}
