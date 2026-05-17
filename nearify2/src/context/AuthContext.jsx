import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// ── storage helpers dengan error handling ──
const safeGet = (key) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
const safeSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* storage full or blocked */ }
}
const safeRemove = (key) => {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(() => safeGet('nearify_user'))
  const [orders, setOrders] = useState(() => safeGet('nearify_orders') ?? [])

  const login = (userData, remember = false) => {
    if (!userData || !userData.email) return
    const userObj = {
      id:     userData.id ?? Date.now(),
      name:   (userData.name ?? 'Pengguna').trim(),
      email:  userData.email.toLowerCase().trim(),
      avatar: userData.avatar ?? null,
      saldo:  typeof userData.saldo === 'number' ? userData.saldo : 0,
      role:   userData.role ?? 'user',
    }
    setUser(userObj)
    if (remember) safeSet('nearify_user', userObj)
    else safeRemove('nearify_user') // session only
  }

  const logout = () => {
    setUser(null)
    safeRemove('nearify_user')
  }

  const updateUser = (data) => {
    if (!data) return
    setUser(prev => {
      if (!prev) return prev
      const updated = {
        ...prev,
        name:   data.name  !== undefined ? data.name.trim()  : prev.name,
        email:  data.email !== undefined ? data.email.trim() : prev.email,
        avatar: data.avatar !== undefined ? data.avatar : prev.avatar,
      }
      safeSet('nearify_user', updated)
      return updated
    })
  }

  const updateSaldo = (amount) => {
    const delta = Number(amount)
    if (isNaN(delta)) return
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, saldo: Math.max(0, (prev.saldo ?? 0) + delta) }
      safeSet('nearify_user', updated)
      return updated
    })
  }

  const addOrder = (order) => {
    if (!order) return null
    const newOrder = {
      ...order,
      id:        Date.now(),
      createdAt: new Date().toISOString(),
      status:    'Menunggu Konfirmasi',
      messages:  [],
      userName:  user?.name ?? 'Pengguna',
      userEmail: user?.email ?? '',
      userId:    user?.id ?? null,
    }
    setOrders(prev => {
      const updated = [newOrder, ...prev]
      safeSet('nearify_orders', updated)
      return updated
    })
    return newOrder
  }

  // Admin: update status pesanan + kirim pesan ke user
  const updateOrderStatus = (orderId, status, message = '') => {
    if (!orderId || !status) return
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId) return o
        const msgs = message.trim()
          ? [...(o.messages ?? []), { text: message.trim(), time: new Date().toISOString(), from: 'admin' }]
          : (o.messages ?? [])
        return { ...o, status, messages: msgs }
      })
      safeSet('nearify_orders', updated)
      return updated
    })
  }

  // User: ambil hanya ordernya sendiri
  const userOrders = user?.role === 'admin'
    ? orders
    : orders.filter(o => o.userId === user?.id || o.userEmail === user?.email)

  return (
    <AuthContext.Provider value={{
      user, orders, userOrders,
      login, logout, updateUser, updateSaldo, addOrder, updateOrderStatus,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}
