import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/icons/Icon.jsx'
import ServiceCard from '../components/ui/ServiceCard.jsx'
import { api } from '../api/client.js'
import { categories, categoryIcons } from '../data/categories.js'
import { formatInr } from '../utils/dates.js'

const steps = [
  {
    title: 'Choose a service',
    copy: 'Browse study rooms, shuttles, labs, courts, the auditorium, and printing.',
  },
  {
    title: 'Pick a date and time',
    copy: 'Select an open slot and add the purpose of the booking.',
  },
  {
    title: 'Review a simulated payment',
    copy: 'The payment screen is a demonstration. It does not collect real money.',
  },
]

export default function LandingPage() {
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let ignore = false
    api('/services?limit=12')
      .then((result) => {
        if (!ignore) setServices(result.data.items)
      })
      .catch((reason) => {
        if (!ignore) setError(reason.message)
      })
    return () => { ignore = true }
  }, [reload])

  const featured = services.slice(0, 3)

  useEffect(() => {
    document.title = 'Smart Campus Service Booking'
  }, [])

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">College campus services</p>
            <h1>Book campus facilities without waiting at the counter</h1>
            <p className="lede">
              Reserve a library room, shuttle seat, laboratory bench, sports court, auditorium slot, or print job from one campus portal.
            </p>
            <div className="button-row">
              <Link className="btn btn-primary" to="/services">
                Browse services
              </Link>
              <Link className="btn btn-secondary" to="/register">
                Create an account
              </Link>
            </div>
          </div>
          <aside className="hero-panel" aria-label="Available services">
            <p className="panel-label">Available on campus</p>
            <ul className="hero-list">
              {featured.map((service) => (
                <li key={service.id}>
                  <Link to={`/services/${service.id}`}>
                    <Icon name={service.icon} />
                    <span>
                      <strong>{service.name}</strong>
                      <small>{service.location}</small>
                    </span>
                    <b>{formatInr(service.price)}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-heading">
            <h2>Service categories</h2>
            <p>Filter the catalogue by the kind of campus service you need.</p>
          </div>
            {error ? (
              <p className="field-error">
                {error}{' '}
                <button type="button" className="btn btn-secondary" onClick={() => setReload((value) => value + 1)}>
                  Retry
                </button>
              </p>
            ) : null}
            <div className="category-grid">
            {categories.map((category) => {
              const count = services.filter((service) => service.category === category).length
              return (
                <Link key={category} className="category-card" to={`/services?category=${category}`}>
                  <Icon name={categoryIcons[category]} />
                  <strong>{category}</strong>
                  <span>
                    {count} service{count === 1 ? '' : 's'}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="wrap">
          <div className="section-heading">
            <h2>Featured campus services</h2>
            <Link to="/services">View all services</Link>
          </div>
          <div className="card-grid">
            {featured.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-heading">
            <h2>How booking works</h2>
            <p>Three steps from the catalogue to a saved booking.</p>
          </div>
          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
