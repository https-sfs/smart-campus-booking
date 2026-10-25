import { useState } from 'react'
import { ApiError } from '../api/client.js'
import Alert from '../components/ui/Alert.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { TextField } from '../components/ui/TextField.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await updateProfile({ name, phone })
      setErrors({})
      setMessage('Profile updated.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors || {})
        setMessage(error.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Profile" description="Email and role stay fixed. You can update your name and phone." />
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {message ? <Alert tone={errors && Object.keys(errors).length ? 'error' : 'info'}>{message}</Alert> : null}
        <TextField id="profile-name" label="Name" required value={name} error={errors.name} onChange={(event) => setName(event.target.value)} />
        <TextField id="profile-phone" label="Phone" inputMode="numeric" value={phone} error={errors.phone} onChange={(event) => setPhone(event.target.value)} />
        <div className="readonly-grid">
          <p><span>Email</span><strong>{user?.email}</strong></p>
          <p><span>Role</span><strong>{user?.role}</strong></p>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>Save profile</button>
      </form>
    </>
  )
}
