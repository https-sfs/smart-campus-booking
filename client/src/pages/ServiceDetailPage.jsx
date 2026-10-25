import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import EmptyState from '../components/ui/EmptyState.jsx'
import Icon from '../components/icons/Icon.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import StarRating from '../components/ui/StarRating.jsx'
import { formatInr } from '../utils/dates.js'

export default function ServiceDetailPage() {
  const { serviceId } = useParams()
  const [service, setService] = useState(null)
  const [comments, setComments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    Promise.all([api(`/services/${serviceId}`), api(`/services/${serviceId}/feedback`)])
      .then(([serviceResult, feedbackResult]) => {
        if (ignore) return
        setService(serviceResult.data.service)
        setComments(feedbackResult.data.items)
        setError('')
      })
      .catch((reason) => {
        if (!ignore) setError(reason.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => { ignore = true }
  }, [serviceId])

  if (loading) {
    return <section className="section"><div className="wrap"><p className="muted">Loading service...</p></div></section>
  }

  if (!service) {
    return (
      <section className="section">
        <div className="wrap">
          <EmptyState
            title="Service not found"
            message={error || 'That service is not in the catalogue.'}
            action={<Link className="btn btn-primary" to="/services">Back to services</Link>}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="wrap detail-grid">
        <div>
          <PageHeader title={service.name} description={service.description} />
          <dl className="meta-list">
            <div><dt>Category</dt><dd>{service.category}</dd></div>
            <div><dt>Location</dt><dd>{service.location}</dd></div>
            <div><dt>Duration</dt><dd>{service.durationMinutes} minutes</dd></div>
            <div><dt>Capacity</dt><dd>{service.capacity} at one time</dd></div>
          </dl>
          <h2>Feedback</h2>
          {comments.length === 0 ? <p className="muted">No feedback for this service yet.</p> : (
            <ul className="feedback-list">
              {comments.map((item) => (
                <li key={item.id}>
                  <StarRating value={item.rating} />
                  <p>{item.comment}</p>
                  <small>{item.userName}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="detail-aside">
          <div className="service-icon"><Icon name={service.icon} /></div>
          <p className="price">{formatInr(service.price)}<span> / slot</span></p>
          <p className="muted">{service.location}</p>
          <Link className="btn btn-primary btn-block" to={`/app/bookings/new?service=${service.id}`}>Book this service</Link>
          <Link className="btn btn-secondary btn-block" to="/services">Back to catalogue</Link>
        </aside>
      </div>
    </section>
  )
}
