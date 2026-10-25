import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client.js'
import Alert from '../components/ui/Alert.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { TextField } from '../components/ui/TextField.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function update(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    if (form.role !== 'student' && form.role !== 'staff') {
      nextErrors.role = 'Choose Student or Staff.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setBusy(true)
    setMessage('')
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      })
      navigate(user.role === 'admin' ? '/admin' : '/app', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ ...nextErrors, ...(error.errors || {}) })
        setMessage(error.message)
      } else {
        setMessage('Registration failed.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-wrap auth-wide">
      <PageHeader
        title="Create an account"
        description="Students and staff can register. Administrator accounts are created separately by the college."
      />
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {message ? <Alert tone="error">{message}</Alert> : null}
        <div className="form-grid two">
          <TextField id="reg-name" name="name" label="Full name" required value={form.name} error={errors.name} onChange={update} />
          <TextField id="reg-email" name="email" label="Email" type="email" autoComplete="email" required value={form.email} error={errors.email} onChange={update} />
          <TextField id="reg-password" name="password" label="Password" type="password" autoComplete="new-password" required value={form.password} error={errors.password} onChange={update} />
          <TextField id="reg-confirm" name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required value={form.confirmPassword} error={errors.confirmPassword} onChange={update} />
          <TextField id="reg-phone" name="phone" label="Phone" inputMode="numeric" value={form.phone} error={errors.phone} hint="Optional. 10 digits." onChange={update} />
        </div>
        <fieldset className="choice-set">
          <legend>Role <span className="req">Required</span></legend>
          <div className="choice-row">
            <label className={form.role === 'student' ? 'choice choice-active' : 'choice'}>
              <input type="radio" name="role" value="student" checked={form.role === 'student'} onChange={update} />
              <span>Student</span>
              <small>Book rooms, labs, courts, and other campus services.</small>
            </label>
            <label className={form.role === 'staff' ? 'choice choice-active' : 'choice'}>
              <input type="radio" name="role" value="staff" checked={form.role === 'staff'} onChange={update} />
              <span>Staff</span>
              <small>Book campus services with a staff profile.</small>
            </label>
          </div>
          {errors.role ? <p className="field-error">{errors.role}</p> : null}
        </fieldset>
        <button className="btn btn-primary" type="submit" disabled={busy}>Create account</button>
      </form>
      <p className="form-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </section>
  )
}
