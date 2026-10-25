import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import ResponsiveTable from '../../components/ui/ResponsiveTable.jsx'
import { formatDate } from '../../utils/dates.js'

const filters = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function AdminBookingsPage() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('All')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(null)

  function load() {
    const params = new URLSearchParams({ limit: '50' })
    if (status !== 'All') params.set('status', status)
    return api(`/admin/bookings?${params}`).then((result) => setRows(result.data.items))
  }

  useEffect(() => { load().catch((reason) => setMessage(reason.message)) }, [status])

  async function applyStatus() {
    const result = await api(`/admin/bookings/${pending.id}/status`, { method: 'PATCH', body: { status: pending.next } })
    setMessage(result.message)
    setPending(null)
    await load()
  }

  return (
    <>
      <PageHeader title="Bookings" description="Update only the status changes the server allows." />
      {message ? <Alert tone="info">{message}</Alert> : null}
      <div className="chip-row" role="tablist" aria-label="Booking status">
        {filters.map((filter) => (
          <button key={filter} type="button" role="tab" aria-selected={status === filter} className={status === filter ? 'chip chip-active' : 'chip'} onClick={() => setStatus(filter)}>{filter}</button>
        ))}
      </div>
      {rows.length === 0 ? <EmptyState title="No bookings match" message="Choose another status filter." /> : (
        <ResponsiveTable rowKey="id" rows={rows} columns={[
          { key: 'service', header: 'Service', render: (row) => row.serviceName },
          { key: 'user', header: 'User', render: (row) => row.userName },
          { key: 'when', header: 'When', render: (row) => `${formatDate(row.bookingDate)} ${row.startTime}` },
          { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
          { key: 'actions', header: 'Actions', render: (row) => (
            <div className="table-actions">
              {row.status === 'Confirmed' ? <button type="button" className="btn btn-secondary" onClick={() => setPending({ ...row, next: 'Completed' })}>Mark completed</button> : null}
              {row.status === 'Pending' || row.status === 'Confirmed' ? <button type="button" className="btn btn-secondary" onClick={() => setPending({ ...row, next: 'Cancelled' })}>Cancel</button> : <span className="muted">Final</span>}
            </div>
          ) },
        ]} />
      )}
      {pending ? <ConfirmDialog title={`${pending.next === 'Completed' ? 'Complete' : 'Cancel'} this booking?`} message={`${pending.serviceName} for ${pending.userName}.`} confirmLabel={pending.next === 'Completed' ? 'Mark completed' : 'Cancel booking'} onConfirm={applyStatus} onClose={() => setPending(null)} /> : null}
    </>
  )
}
