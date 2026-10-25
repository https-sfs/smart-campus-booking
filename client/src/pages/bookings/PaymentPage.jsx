import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../../api/client.js'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { formatDate, formatInr } from '../../utils/dates.js'

export default function PaymentPage() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('simulated_upi')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let ignore = false
    api(`/bookings/${bookingId}`)
      .then((response) => { if (!ignore) setBooking(response.data.booking) })
      .catch((reason) => { if (!ignore) setError(reason.message) })
    return () => { ignore = true }
  }, [bookingId])

  async function pay(outcome) {
    setBusy(true)
    setResult('')
    try {
      const response = await api('/payments/simulate', {
        method: 'POST',
        body: { bookingId, outcome, method },
      })
      setResult(response.message)
      const refreshed = await api(`/bookings/${bookingId}`)
      setBooking(refreshed.data.booking)
    } catch (reason) {
      setResult(reason instanceof ApiError ? reason.message : 'The payment could not be recorded.')
    } finally {
      setBusy(false)
    }
  }

  if (error && !booking) {
    return <EmptyState title="Booking not found" message={error} action={<Link className="btn btn-primary" to="/app/bookings">Back to my bookings</Link>} />
  }
  if (!booking) return <p className="muted">Loading payment...</p>

  return (
    <>
      <PageHeader title="Simulated payment" description="This demonstration does not collect money or card details." />
      <section className="pay-banner">
        <h2>Demonstration payment</h2>
        <p>No real money is collected. Do not enter a card number, CVV, or UPI ID. Nothing on this screen is sent to a bank.</p>
      </section>
      <section className="panel">
        <h2>{booking.service?.name}</h2>
        <p>{formatDate(booking.bookingDate)} · {booking.startTime}–{booking.endTime}</p>
        <p className="price">{formatInr(booking.amount)}</p>
        <p className="muted">The amount comes from the saved booking, not from a value typed here.</p>
        <div className="badge-row">
          <Badge>{booking.status}</Badge>
          <Badge>{booking.payment?.status || 'Unpaid'}</Badge>
        </div>
      </section>
      {booking.payment?.status === 'Paid' ? <Alert tone="success">This booking is already paid. Reference {booking.payment.transactionRef}.</Alert> : (
        <form className="form-card" onSubmit={(event) => event.preventDefault()}>
          <fieldset className="choice-set">
            <legend>Demonstration method</legend>
            <div className="choice-row">
              <label className={method === 'simulated_upi' ? 'choice choice-active' : 'choice'}>
                <input type="radio" name="method" checked={method === 'simulated_upi'} onChange={() => setMethod('simulated_upi')} />
                <span>Simulated UPI</span>
                <small>No UPI ID is requested.</small>
              </label>
              <label className={method === 'simulated_card' ? 'choice choice-active' : 'choice'}>
                <input type="radio" name="method" checked={method === 'simulated_card'} onChange={() => setMethod('simulated_card')} />
                <span>Simulated card</span>
                <small>No card number is requested.</small>
              </label>
            </div>
          </fieldset>
          <div className="button-row">
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => pay('success')}>Simulate successful payment</button>
            <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => pay('failure')}>Simulate failed payment</button>
          </div>
        </form>
      )}
      {result ? <Alert tone="info">{result}</Alert> : null}
      <p className="form-switch"><Link to={`/app/bookings/${booking.id}`}>Back to booking details</Link></p>
    </>
  )
}
