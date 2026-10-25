import { NavLink, useLocation } from 'react-router-dom'
import Icon from '../icons/Icon.jsx'

const studentLinks = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/bookings', label: 'My bookings', end: true, match: 'bookings' },
  { to: '/app/bookings/new', label: 'New booking', end: true },
  { to: '/app/payments', label: 'Payments', end: true },
  { to: '/app/profile', label: 'Profile', end: true },
]

const adminLinks = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/services', label: 'Services', end: false },
  { to: '/admin/bookings', label: 'Bookings', end: false },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/payments', label: 'Payments', end: false },
  { to: '/admin/feedback', label: 'Feedback', end: false },
]

export default function Sidebar({ area, open, onNavigate }) {
  const location = useLocation()
  const links = area === 'admin' ? adminLinks : studentLinks

  return (
    <aside id="dashboard-nav" className={open ? 'sidebar open' : 'sidebar'}>
      <p className="sidebar-kicker">{area === 'admin' ? 'Administration' : 'Your account'}</p>
      <p className="sidebar-title">Smart Campus</p>
      <nav aria-label={area === 'admin' ? 'Admin' : 'Student'}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end ?? false}
            onClick={onNavigate}
            className={({ isActive }) =>
              isBookingDetail(location.pathname, link) || isActive ? 'side-link active' : 'side-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        {area === 'admin' ? (
          <NavLink to="/app" className="side-link" onClick={onNavigate}>
            My bookings
          </NavLink>
        ) : null}
        <NavLink to="/" className="side-link" onClick={onNavigate}>
          <Icon name="building" size={18} />
          Campus site
        </NavLink>
      </div>
    </aside>
  )
}

function isBookingDetail(pathname, link) {
  if (link.match !== 'bookings') {
    return false
  }

  return /^\/app\/bookings\/(?!new(?:\/|$))/.test(pathname)
}
