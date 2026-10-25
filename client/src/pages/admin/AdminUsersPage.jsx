import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import ResponsiveTable from '../../components/ui/ResponsiveTable.jsx'

const roles = ['All', 'Student', 'Staff', 'Administrator']

export default function AdminUsersPage() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(null)

  function load() {
    const params = new URLSearchParams({ limit: '50' })
    if (role !== 'All') params.set('role', role === 'Administrator' ? 'admin' : role.toLowerCase())
    if (search.trim()) params.set('search', search.trim())
    return api(`/admin/users?${params}`).then((result) => setRows(result.data.items))
  }

  useEffect(() => {
    const timer = setTimeout(() => { load().catch((reason) => setMessage(reason.message)) }, 200)
    return () => clearTimeout(timer)
  }, [search, role])

  async function toggleUser() {
    try {
      const result = await api(`/admin/users/${pending.id}/status`, {
        method: 'PATCH',
        body: { isActive: !pending.isActive },
      })
      setMessage(result.message)
      setPending(null)
      await load()
    } catch (reason) {
      setMessage(reason.message)
      setPending(null)
    }
  }

  return (
    <>
      <PageHeader title="Users" description="Roles are assigned at registration or by the administrator seed. This screen cannot grant admin access." />
      {message ? <Alert tone="info">{message}</Alert> : null}
      <div className="toolbar">
        <div className="search-field">
          <label className="sr-only" htmlFor="user-search">Search users</label>
          <input id="user-search" type="search" value={search} placeholder="Search name or email" onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="chip-row" role="tablist" aria-label="User role">
          {roles.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={role === item} className={role === item ? 'chip chip-active' : 'chip'} onClick={() => setRole(item)}>{item}</button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? <EmptyState title="No users match" message="Try another role or clear the search." /> : (
        <ResponsiveTable rowKey="id" rows={rows} columns={[
          { key: 'name', header: 'Name', render: (row) => row.name },
          { key: 'email', header: 'Email', render: (row) => row.email },
          { key: 'role', header: 'Role', render: (row) => <Badge>{row.role === 'admin' ? 'Administrator' : row.role === 'staff' ? 'Staff' : 'Student'}</Badge> },
          { key: 'status', header: 'Status', render: (row) => <Badge>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
          { key: 'actions', header: 'Actions', render: (row) => (
            <button type="button" className="btn btn-secondary" onClick={() => setPending(row)}>{row.isActive ? 'Deactivate' : 'Activate'}</button>
          ) },
        ]} />
      )}
      {pending ? <ConfirmDialog title={`${pending.isActive ? 'Deactivate' : 'Activate'} ${pending.name}?`} message="Inactive accounts cannot sign in." confirmLabel={pending.isActive ? 'Deactivate' : 'Activate'} onConfirm={toggleUser} onClose={() => setPending(null)} /> : null}
    </>
  )
}
