import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Icon from '../icons/Icon.jsx'

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">SC</span>
          <span>
            <strong>Smart Campus</strong>
            <small>Service booking</small>
          </span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="public-nav"
          onClick={() => setOpen((current) => !current)}
        >
          <Icon name={open ? 'close' : 'menu'} />
          <span>{open ? 'Close' : 'Menu'}</span>
        </button>

        <nav id="public-nav" className={open ? 'nav-links open' : 'nav-links'} aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Home</NavLink>
          <NavLink to="/services" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Services</NavLink>
          {user ? (
            <>
              <NavLink to={user.role === 'admin' ? '/admin' : '/app'} className="nav-link">Dashboard</NavLink>
              <button className="btn btn-secondary" type="button" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Sign in</NavLink>
              <Link className="btn btn-primary nav-cta" to="/register">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
