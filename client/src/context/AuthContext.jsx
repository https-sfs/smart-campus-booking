import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    api('/auth/me')
      .then((result) => {
        if (!ignore) {
          setUser(result.data.user)
        }
      })
      .catch(() => {
        if (!ignore) {
          setUser(null)
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    async login(body) {
      const result = await api('/auth/login', { method: 'POST', body })
      setUser(result.data.user)
      return result.data.user
    },
    async register(body) {
      const result = await api('/auth/register', { method: 'POST', body })
      setUser(result.data.user)
      return result.data.user
    },
    async logout() {
      await api('/auth/logout', { method: 'POST' })
      setUser(null)
    },
    async updateProfile(body) {
      const result = await api('/users/me', { method: 'PATCH', body })
      setUser(result.data.user)
      return result.data.user
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
