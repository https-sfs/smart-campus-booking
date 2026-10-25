import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import Badge from '../../components/ui/Badge.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { formatDate, formatInr } from '../../utils/dates.js'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/stats')
      .then((result) => setStats(result.data))
      .catch((reason) => setError(reason.message))
  }, [])

  return (
    <>
      <PageHeader title="Admin overview" description="Counts are calculated from the database." />
      {error ? <p className="field-error">{error}</p> : null}
      <div className="stat-grid">
        <Stat label="Users" value={stats?.users ?? '–'} hint="Registered accounts" to="/admin/users" />
        <Stat label="Services" value={stats?.services ?? '–'} hint="Active services" to="/admin/services" />
        <Stat label="Bookings" value={stats?.bookings ?? '–'} hint="All reservations" to="/admin/bookings" />
        <Stat label="Payments" value={stats?.payments ?? '–'} hint="Stored payment records" to="/admin/payments" />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Recent bookings</h2>
          <Link to="/admin/bookings">Open bookings</Link>
        </div>
        <ul className="plain-list">
          {(stats?.recentBookings || []).map((booking) => (
            <li key={booking.id}>
              <div>
                <strong>{booking.serviceName}</strong>
                <p>{booking.userName} · {formatDate(booking.bookingDate)} · {formatInr(booking.amount)}</p>
              </div>
              <Badge>{booking.status}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Stat({ label, value, hint, to }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
      <Link to={to}>View</Link>
    </article>
  )
}
