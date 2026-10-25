import { Link } from 'react-router-dom'
import Icon from '../icons/Icon.jsx'
import { formatInr } from '../../utils/dates.js'
import Button from './Button.jsx'

export default function ServiceCard({ service }) {
  return (
    <article className="service-card">
      <div className="service-icon">
        <Icon name={service.icon} size={26} />
      </div>
      <p className="service-category">{service.category}</p>
      <h2>
        <Link to={`/services/${service.id}`}>{service.name}</Link>
      </h2>
      <p className="service-copy">{service.description}</p>
      <p className="service-location">{service.location}</p>
      <div className="service-card-footer">
        <p className="price">
          {formatInr(service.price)}
          <span> / slot</span>
        </p>
        <div className="service-card-actions">
          <Button to={`/services/${service.id}`} variant="secondary">
            Details
          </Button>
          <Button to={`/app/bookings/new?service=${service.id}`}>Book</Button>
        </div>
      </div>
    </article>
  )
}
