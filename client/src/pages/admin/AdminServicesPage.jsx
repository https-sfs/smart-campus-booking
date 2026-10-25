import { useEffect, useState } from 'react'
import { api, ApiError } from '../../api/client.js'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import ResponsiveTable from '../../components/ui/ResponsiveTable.jsx'
import { SelectField, TextField } from '../../components/ui/TextField.jsx'
import { categories } from '../../data/categories.js'
import { formatInr } from '../../utils/dates.js'

const emptyForm = { id: '', name: '', category: 'Library', price: '', durationMinutes: '60', capacity: '1', location: '', description: '', icon: 'library' }

export default function AdminServicesPage() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(null)

  function load() {
    const params = new URLSearchParams({ includeInactive: 'true', limit: '50' })
    if (category !== 'All') params.set('category', category)
    if (search.trim()) params.set('search', search.trim())
    return api(`/services?${params}`).then((result) => setRows(result.data.items))
  }

  useEffect(() => {
    const timer = setTimeout(() => { load().catch((reason) => setMessage(reason.message)) }, 200)
    return () => clearTimeout(timer)
  }, [search, category])

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const body = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      capacity: Number(form.capacity),
      location: form.location,
      description: form.description,
      icon: form.icon || 'library',
    }
    try {
      if (form.id) await api(`/admin/services/${form.id}`, { method: 'PATCH', body })
      else await api('/admin/services', { method: 'POST', body })
      setForm(emptyForm)
      setErrors({})
      setMessage(form.id ? 'Service updated.' : 'Service created.')
      await load()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors || {})
        setMessage(error.message)
      }
    }
  }

  async function deactivate() {
    await api(`/admin/services/${pending.id}/deactivate`, { method: 'PATCH' })
    setPending(null)
    setMessage('Service deactivated. Existing bookings were kept.')
    await load()
  }

  return (
    <>
      <PageHeader title="Services" description="Add, edit, or deactivate services. Deactivated services stay on old bookings." />
      {message ? <Alert tone="info">{message}</Alert> : null}
      <div className="toolbar">
        <div className="search-field">
          <label className="sr-only" htmlFor="admin-service-search">Search services</label>
          <input id="admin-service-search" type="search" value={search} placeholder="Search services" onChange={(event) => setSearch(event.target.value)} />
        </div>
        <label className="inline-select">Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="All">All</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {rows.length === 0 ? <EmptyState title="No services match" message="Add a service or clear the search." /> : (
        <ResponsiveTable rowKey="id" rows={rows} columns={[
          { key: 'name', header: 'Service', render: (row) => row.name },
          { key: 'category', header: 'Category', render: (row) => row.category },
          { key: 'price', header: 'Price', render: (row) => formatInr(row.price) },
          { key: 'location', header: 'Location', render: (row) => row.location },
          { key: 'status', header: 'Status', render: (row) => <Badge>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
          { key: 'actions', header: 'Actions', render: (row) => (
            <div className="table-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...row, price: String(row.price), durationMinutes: String(row.durationMinutes), capacity: String(row.capacity) })}>Edit</button>
              {row.isActive ? <button type="button" className="btn btn-secondary" onClick={() => setPending(row)}>Deactivate</button> : null}
            </div>
          ) },
        ]} />
      )}
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <h2>{form.id ? 'Edit service' : 'Add service'}</h2>
        <div className="form-grid two">
          <TextField id="svc-name" name="name" label="Name" required value={form.name} error={errors.name} onChange={update} />
          <SelectField id="svc-category" label="Category" required value={form.category} error={errors.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <TextField id="svc-price" name="price" label="Price (INR)" type="number" min="0" required value={form.price} error={errors.price} onChange={update} />
          <SelectField id="svc-duration" label="Duration" required value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </SelectField>
          <TextField id="svc-capacity" name="capacity" label="Capacity" type="number" min="1" required value={form.capacity} error={errors.capacity} onChange={update} />
          <TextField id="svc-location" name="location" label="Location" required value={form.location} error={errors.location} onChange={update} />
        </div>
        <TextField id="svc-description" name="description" label="Description" type="textarea" rows={4} required value={form.description} error={errors.description} onChange={update} />
        <div className="button-row">
          <button className="btn btn-primary" type="submit">{form.id ? 'Save changes' : 'Add service'}</button>
          <button className="btn btn-secondary" type="button" onClick={() => { setForm(emptyForm); setErrors({}) }}>Clear form</button>
        </div>
      </form>
      {pending ? <ConfirmDialog title={`Deactivate ${pending.name}?`} message="New bookings will stop. Older bookings stay in the database." confirmLabel="Deactivate" onConfirm={deactivate} onClose={() => setPending(null)} /> : null}
    </>
  )
}
