import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentSession, onAuthStateChange, logout } from '../services/authService'

const AuthContext = createContext(undefined)

// کاربر تا وقتی کش مرورگر (localStorage) پاک نشود لاگین می‌ماند،
// اما حداکثر تا ۳ روز بعد از ورود، به‌صورت خودکار خارج می‌شود.
const LOGIN_AT_KEY = 'dm_login_at'
const MAX_SESSION_MS = 3 * 24 * 60 * 60 * 1000

function isSessionExpired() {
  const loginAt = localStorage.getItem(LOGIN_AT_KEY)
  if (!loginAt) return false
  return Date.now() - Number(loginAt) > MAX_SESSION_MS
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe

    async function init() {
      try {
        const s = await getCurrentSession()
        if (s) {
          if (isSessionExpired()) {
            localStorage.removeItem(LOGIN_AT_KEY)
            await logout()
            setSession(null)
          } else {
            if (!localStorage.getItem(LOGIN_AT_KEY)) {
              localStorage.setItem(LOGIN_AT_KEY, String(Date.now()))
            }
            setSession(s)
          }
        } else {
          setSession(null)
        }
      } catch {
        setSession(null)
      } finally {
        setLoading(false)
      }
    }
    init()

    unsubscribe = onAuthStateChange((s, event) => {
      if (event === 'SIGNED_IN') {
        localStorage.setItem(LOGIN_AT_KEY, String(Date.now()))
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(LOGIN_AT_KEY)
      }
      setSession(s)
      setLoading(false)
    })

    // هر بار کاربر برمی‌گردد به تب سایت، انقضای ۳ روزه را دوباره چک کن
    function handleVisibility() {
      if (document.visibilityState === 'visible' && isSessionExpired()) {
        localStorage.removeItem(LOGIN_AT_KEY)
        logout().then(() => setSession(null))
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      unsubscribe && unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
