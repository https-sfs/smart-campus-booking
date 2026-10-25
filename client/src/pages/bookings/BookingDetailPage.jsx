import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../../api/client.js'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { TextField } from '../../components/ui/TextField.jsx'
import { formatDate, formatInr } from '../../utils/dates.js'

export default function BookingDetailPage() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [feedbackError, setFeedbackError] = useState('')

  function load() {
    return api(`/bookings/${bookingId}`)
      .then((result) => {
        setBooking(result.data.booking)
        setError('')
      })
      .catch((reason) => setError(reason.message))
  }

  useEffect(() => {
    let ignore = false
    api(`/bookings/${bookingId}`)
      .then((result) => { if (!ignore) setBooking(result.data.booking) })
      .catch((reason) => { if (!ignore) setError(reason.message) })
    return () => { ignore = true }
  }, [bookingId])

  async function cancelBooking() {
    setMessage('')
    try {
      const result = await api(`/bookings/${bookingId}/cancel`, { method: 'PATCH' })
      setBooking(result.data.booking)
      setMessage(result.message)
      setConfirming(false)
    } catch (reason) {
      setMessage(reason.message)
      setConfirming(false)
    }
  }

  async function submitFeedback(event) {
    event.preventDefault()
    setFeedbackError('')
    try {
      await api('/feedback', { method: 'POST', body: { bookingId, rating: Number(rating), comment } })
      setMessage('Feedback saved.')
      setComment('')
      await load()
    } catch (reason) {
      if (reason instanceof ApiError) setFeedbackError(reason.message)
    }
  }

  if (error && !booking) {
    return <EmptyState title="Booking not found" message={error} action={<Link className="btn btn-primary" to="/app/bookings">Back to my bookings</Link>} />
  }

  if (!booking) return <p className="muted">Loading booking...</p>

  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed'

  return (
    <>
      <PageHeader title={booking.service?.name || 'Booking'} description="Saved booking details." actions={<Link className="btn btn-secondary" to="/app/bookings">All bookings</Link>} />
      {message ? <Alert tone="info">{message}</Alert> : null}
      <section className="panel">
        <div className="badge-row">
          <Badge>{booking.status}</Badge>
          <Badge>{booking.payment?.status || 'Unpaid'}</Badge>
        </div>
        <dl className="meta-list">
          <div><dt>When</dt><dd>{formatDate(booking.bookingDate)} · {booking.startTime}–{booking.endTime}</dd></div>
          <div><dt>Location</dt><dd>{booking.service?.location}</dd></div>
          <div><dt>Price</dt><dd>{formatInr(booking.amount)}</dd></div>
          <div><dt>Purpose</dt><dd>{booking.purpose}</dd></div>
          <div><dt>Notes</dt><dd>{booking.notes || 'None'}</dd></div>
          {booking.payment?.status === 'Paid' ? <div><dt>Payment reference</dt><dd>{booking.payment.transactionRef}</dd></div> : null}
        </dl>
        <div className="button-row">
          {booking.status === 'Pending' ? <Link className="btn btn-primary" to={`/app/bookings/${booking.id}/pay`}>Simulated payment</Link> : null}
          {canCancel ? <button className="btn btn-secondary" type="button" onClick={() => setConfirming(true)}>Cancel booking</button> : null}
        </div>
        {booking.payment?.status === 'Paid' && booking.status === 'Cancelled' ? <p className="muted">This simulated payment was not refunded.</p> : null}
      </section>
      {booking.status === 'Completed' ? (
        <section className="panel">
          <h2>Feedback</h2>
          <form className="stack-form" onSubmit={submitFeedback} noValidate>
            <fieldset className="choice-set">
              <legend>Rating</legend>
              <div className="rating-row">
                {[1, 2, 3, 4, 5].map((score) => (
                  <label key={score} className={rating === String(score) ? 'chip chip-active' : 'chip'}>
                    <input type="radio" name="rating" value={score} checked={rating === String(score)} onChange={(event) => setRating(event.target.value)} />
                    {score}
                  </label>
                ))}
              </div>
            </fieldset>
            <TextField id="feedback-comment" label="Written feedback" type="textarea" rows={4} required value={comment} onChange={(event) => setComment(event.target.value)} />
            {feedbackError ? <Alert tone="error">{feedbackError}</Alert> : null}
            <button className="btn btn-secondary" type="submit">Submit feedback</button>
          </form>
        </section>
      ) : <p className="muted">Feedback opens after an administrator marks the booking completed.</p>}
      {confirming ? (
        <ConfirmDialog
          title="Cancel this booking?"
          message={booking.payment?.status === 'Paid' ? 'The slot will be released. A paid demonstration is not refunded.' : 'The slot will be released for other students.'}
          confirmLabel="Cancel booking"
          onConfirm={cancelBooking}
          onClose={() => setConfirming(false)}
        />
      ) : null}
    </>
  )
}
