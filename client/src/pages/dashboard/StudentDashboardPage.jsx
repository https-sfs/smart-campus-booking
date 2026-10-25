import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import Badge from '../../components/ui/Badge.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { campusToday, formatDate } from '../../utils/dates.js'

export default function StudentDashboardPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    api('/bookings?limit=50')
      .then((result) => {
        if (!ignore) setRows(result.data.items)
      })
      .catch((reason) => {
        if (!ignore) setError(reason.message)
      })
    return () => { ignore = true }
  }, [])

  const today = campusToday()
  const upcoming = rows.filter((booking) => (
    (booking.status === 'Pending' || booking.status === 'Confirmed') && booking.bookingDate >= today
  ))
  const counts = {
    upcoming: upcoming.length,
    pending: rows.filter((booking) => booking.status === 'Pending').length,
    completed: rows.filter((booking) => booking.status === 'Completed').length,
    cancelled: rows.filter((booking) => booking.status === 'Cancelled').length,
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your bookings and shortcuts."
        actions={<Link className="btn btn-primary" to="/app/bookings/new">New booking</Link>}
      />
      {error ? <p className="field-error">{error}</p> : null}
      <div className="stat-grid">
        <Stat label="Upcoming" value={counts.upcoming} hint="Pending or confirmed" />
        <Stat label="Pending" value={counts.pending} hint="Waiting for payment" />
        <Stat label="Completed" value={counts.completed} hint="Ready for feedback" />
        <Stat label="Cancelled" value={counts.cancelled} hint="No longer active" />
      </div>
      <div className="split">
        <section className="panel">
          <div className="panel-heading">
            <h2>Upcoming bookings</h2>
            <Link to="/app/bookings">View all</Link>
          </div>
          {upcoming.length === 0 ? <p className="muted">No upcoming bookings.</p> : (
            <ul className="plain-list">
              {upcoming.map((booking) => (
                <li key={booking.id}>
                  <div>
                    <strong>{booking.service?.name}</strong>
                    <p>{formatDate(booking.bookingDate)} · {booking.startTime}–{booking.endTime}</p>
                  </div>
                  <Badge>{booking.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>Quick actions</h2>
          <div className="quick-grid">
            <Link to="/services">Browse services</Link>
            <Link to="/app/bookings/new">New booking</Link>
            <Link to="/app/bookings">Review bookings</Link>
            <Link to="/app/payments">Payment history</Link>
            <Link to="/app/profile">Edit profile</Link>
          </div>
        </section>
      </div>
    </>
  )
}

function Stat({ label, value, hint }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  )
}
