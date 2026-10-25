import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../../api/client.js'
import Alert from '../../components/ui/Alert.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { SelectField, TextField } from '../../components/ui/TextField.jsx'
import { campusToday, formatInr } from '../../utils/dates.js'

export default function BookingFormPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [serviceId, setServiceId] = useState(params.get('service') || '')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/services?limit=50')
      .then((result) => setServices(result.data.items))
      .catch((reason) => setMessage(reason.message))
  }, [])

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([])
      return
    }
    let ignore = false
    api(`/services/${serviceId}/slots?date=${date}`)
      .then((result) => {
        if (!ignore) setSlots(result.data.slots)
      })
      .catch((reason) => {
        if (!ignore) setMessage(reason.message)
      })
    return () => { ignore = true }
  }, [serviceId, date])

  const service = services.find((item) => item.id === serviceId)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const result = await api('/bookings', {
        method: 'POST',
        body: { serviceId, bookingDate: date, startTime: slot, purpose, notes },
      })
      navigate(`/app/bookings/${result.data.booking.id}`)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors || {})
        setMessage(error.message)
      } else {
        setMessage('The booking could not be saved.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="New booking" description="The price and availability are checked by the server when you submit." />
      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {message ? <Alert tone="error">{message}</Alert> : null}
        <SelectField id="booking-service" label="Service" required value={serviceId} error={errors.serviceId} onChange={(event) => { setServiceId(event.target.value); setSlot('') }}>
          <option value="">Select a service</option>
          {services.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatInr(item.price)}</option>)}
        </SelectField>
        {service ? <p className="muted">{service.location} · {service.durationMinutes} minutes · {formatInr(service.price)}</p> : null}
        <TextField id="booking-date" label="Date" type="date" required min={campusToday()} value={date} error={errors.bookingDate} onChange={(event) => { setDate(event.target.value); setSlot('') }} />
        <fieldset className="choice-set">
          <legend>Time slot <span className="req">Required</span></legend>
          {slots.length ? (
            <div className="slot-grid">
              {slots.map((item) => (
                <label key={item.start} className={slot === item.start ? 'slot slot-active' : 'slot'}>
                  <input type="radio" name="slot" value={item.start} checked={slot === item.start} disabled={!item.available} onChange={() => setSlot(item.start)} />
                  <span>{item.start}–{item.end}</span>
                  <small>{item.available ? `${item.remaining} left` : item.reason === 'past' ? 'Past' : 'Full'}</small>
                </label>
              ))}
            </div>
          ) : <p className="muted">Choose a service and date to see open slots.</p>}
          {errors.startTime ? <p className="field-error">{errors.startTime}</p> : null}
        </fieldset>
        <TextField id="booking-purpose" label="Purpose" required maxLength={200} value={purpose} error={errors.purpose} onChange={(event) => setPurpose(event.target.value)} />
        <TextField id="booking-notes" label="Notes" type="textarea" rows={4} maxLength={500} value={notes} error={errors.notes} hint="Optional." onChange={(event) => setNotes(event.target.value)} />
        <button className="btn btn-primary" type="submit" disabled={busy}>Save booking</button>
      </form>
      <p className="form-switch"><Link to="/app/bookings">Back to my bookings</Link></p>
    </>
  )
}
