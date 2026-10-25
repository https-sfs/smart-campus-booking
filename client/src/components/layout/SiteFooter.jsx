import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchHealth } from '../../api/client.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ApiStatus() {
  const [text, setText] = useState('Checking the API connection...')

  useEffect(() => {
    let ignore = false

    fetchHealth()
      .then((result) => {
        if (ignore) {
          return
        }

        const database = result.data?.database || 'unknown'
        setText(`API is running. Database: ${database}.`)
      })
      .catch(() => {
        if (!ignore) {
          setText('API is not reachable. Start the server to check the health endpoint.')
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  return <p className="api-status">{text}</p>
}

export function SiteFooter() {
  const { user } = useAuth()

  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <strong>Smart Campus</strong>
          <p>Service booking and management for college facilities.</p>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <Link to="/services">Services</Link>
          <Link to={user?.role === 'admin' ? '/admin' : '/app'}>Dashboard</Link>
        </div>
        <div>
          <p className="footer-label">Account</p>
          {user ? <Link to="/app/profile">Profile</Link> : <Link to="/login">Sign in</Link>}
          {!user ? <Link to="/register">Create account</Link> : null}
        </div>
      </div>
      <div className="wrap footer-meta">
        <ApiStatus />
      </div>
    </footer>
  )
}
