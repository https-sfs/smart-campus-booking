import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client.js'
import Alert from '../components/ui/Alert.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import { TextField } from '../components/ui/TextField.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const signedIn = await login({ email, password })
      const destination = location.state?.from || (signedIn.role === 'admin' ? '/admin' : '/app')
      navigate(destination, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors || {})
        setMessage(error.message)
      } else {
        setMessage('Sign-in failed.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-wrap">
      <PageHeader title="Sign in" description="Use the email and password for your campus account." />
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {message ? <Alert tone="error">{message}</Alert> : null}
        <TextField id="login-email" label="Email" type="email" autoComplete="email" required value={email} error={errors.email} onChange={(event) => setEmail(event.target.value)} />
        <TextField id="login-password" label="Password" type="password" autoComplete="current-password" required value={password} error={errors.password} onChange={(event) => setPassword(event.target.value)} />
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>Sign in</button>
      </form>
      <p className="form-switch">New to the portal? <Link to="/register">Create an account</Link></p>
    </section>
  )
}
