import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'

export default function NotFoundPage() {
  return (
    <section className="section">
      <div className="wrap narrow">
        <PageHeader
          title="Page not found"
          description="That address is not part of the campus booking site."
        />
        <div className="button-row">
          <Link className="btn btn-primary" to="/">
            Go to the home page
          </Link>
          <Link className="btn btn-secondary" to="/services">
            Browse services
          </Link>
        </div>
      </div>
    </section>
  )
}
