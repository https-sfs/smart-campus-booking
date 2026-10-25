import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Icon from '../icons/Icon.jsx'
import Sidebar from './Sidebar.jsx'

export default function DashboardLayout({ area }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="shell">
      <Sidebar area={area} open={open} onNavigate={() => setOpen(false)} />
      {open ? <button type="button" className="sidebar-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <div className="shell-main">
        <header className="topbar">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="dashboard-nav"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
            <span>Menu</span>
          </button>
          <p>{user ? `${user.name} · ${user.role}` : area === 'admin' ? 'Administration' : 'My campus'}</p>
        </header>
        <div className="shell-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
