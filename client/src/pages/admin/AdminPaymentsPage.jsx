import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import ResponsiveTable from '../../components/ui/ResponsiveTable.jsx'
import { formatInr } from '../../utils/dates.js'

const filters = ['All', 'Pending', 'Paid', 'Failed']

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50' })
    if (status !== 'All') params.set('status', status)
    api(`/admin/payments?${params}`)
      .then((result) => { setRows(result.data.items); setError('') })
      .catch((reason) => setError(reason.message))
  }, [status])

  return (
    <>
      <PageHeader title="Payments" description="Demonstration records only. No real charges are stored." />
      {error ? <p className="field-error">{error}</p> : null}
      <div className="chip-row" role="tablist" aria-label="Payment status">
        {filters.map((filter) => (
          <button key={filter} type="button" role="tab" aria-selected={status === filter} className={status === filter ? 'chip chip-active' : 'chip'} onClick={() => setStatus(filter)}>{filter}</button>
        ))}
      </div>
      {rows.length === 0 ? <EmptyState title="No payment records" message="Payments appear after a simulated payment is submitted." /> : (
        <ResponsiveTable rowKey="id" rows={rows} columns={[
          { key: 'ref', header: 'Reference', render: (row) => row.transactionRef },
          { key: 'booking', header: 'Booking', render: (row) => row.serviceName },
          { key: 'user', header: 'User', render: (row) => row.userName },
          { key: 'amount', header: 'Amount', render: (row) => formatInr(row.amount) },
          { key: 'method', header: 'Method', render: (row) => row.method === 'simulated_card' ? 'Simulated card' : 'Simulated UPI' },
          { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
        ]} />
      )}
    </>
  )
}
