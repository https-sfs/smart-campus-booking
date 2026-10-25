import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { formatDate, formatInr } from '../../utils/dates.js'

const filters = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function BookingListPage() {
  const [status, setStatus] = useState('All')
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const params = new URLSearchParams({ limit: '50' })
    if (status !== 'All') params.set('status', status)
    setLoading(true)
    api(`/bookings?${params}`)
      .then((result) => {
        if (!ignore) {
          setRows(result.data.items)
          setError('')
        }
      })
      .catch((reason) => {
        if (!ignore) setError(reason.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => { ignore = true }
  }, [status])

  return (
    <>
      <PageHeader
        title="My bookings"
        description="Reservations saved to your campus account."
        actions={<Link className="btn btn-primary" to="/app/bookings/new">New booking</Link>}
      />
      <div className="chip-row" role="tablist" aria-label="Booking status">
        {filters.map((filter) => (
          <button key={filter} type="button" role="tab" aria-selected={status === filter} className={status === filter ? 'chip chip-active' : 'chip'} onClick={() => setStatus(filter)}>
            {filter}
          </button>
        ))}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      {loading ? <p className="muted">Loading bookings...</p> : null}
      {!loading && rows.length === 0 ? (
        <EmptyState title="No bookings in this view" message="Book a campus service, or choose another status." action={<Link className="btn btn-primary" to="/services">Browse services</Link>} />
      ) : (
        <div className="stack">
          {rows.map((booking) => (
            <article key={booking.id} className="booking-card">
              <div>
                <h2>{booking.service?.name}</h2>
                <p>{formatDate(booking.bookingDate)} · {booking.startTime}–{booking.endTime}</p>
                <p>{booking.purpose}</p>
                <p className="muted">{formatInr(booking.amount)}</p>
              </div>
              <div className="booking-card-side">
                <Badge>{booking.status}</Badge>
                <Badge>{booking.payment?.status || 'Unpaid'}</Badge>
                <Link className="btn btn-secondary" to={`/app/bookings/${booking.id}`}>View details</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
