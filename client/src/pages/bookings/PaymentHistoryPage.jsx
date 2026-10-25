import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import ResponsiveTable from '../../components/ui/ResponsiveTable.jsx'
import { formatDate, formatInr } from '../../utils/dates.js'

export default function PaymentHistoryPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    return api('/payments/mine')
      .then((result) => {
        setRows(result.data.items)
        setError('')
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let ignore = false
    api('/payments/mine')
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
  }, [])

  return (
    <>
      <PageHeader
        title="Payment history"
        description="These are demonstration records. No real money is collected, and a cancelled booking is not marked as refunded."
      />
      {error ? (
        <p className="field-error">
          {error}{' '}
          <button type="button" className="btn btn-secondary" onClick={load}>Retry</button>
        </p>
      ) : null}
      {loading ? <p className="muted">Loading payments...</p> : null}
      {!loading && rows.length === 0 ? (
        <EmptyState
          title="No payment records"
          message="A record appears after you simulate a payment for one of your bookings."
          action={<Link className="btn btn-primary" to="/app/bookings">View my bookings</Link>}
        />
      ) : null}
      {rows.length > 0 ? (
        <ResponsiveTable
          rowKey="id"
          rows={rows}
          columns={[
            { key: 'ref', header: 'Reference', render: (row) => row.transactionRef },
            { key: 'service', header: 'Service', render: (row) => row.serviceName },
            { key: 'when', header: 'Slot', render: (row) => row.bookingDate ? `${formatDate(row.bookingDate)} ${row.startTime}` : 'Booking' },
            { key: 'amount', header: 'Amount', render: (row) => formatInr(row.amount) },
            { key: 'method', header: 'Method', render: (row) => row.method === 'simulated_card' ? 'Simulated card' : 'Simulated UPI' },
            { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
            { key: 'booking', header: 'Booking', render: (row) => row.bookingId ? <Link to={`/app/bookings/${row.bookingId}`}>{row.bookingStatus || 'Open'}</Link> : 'Removed' },
          ]}
        />
      ) : null}
    </>
  )
}
