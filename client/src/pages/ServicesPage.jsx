import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/icons/Icon.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import ServiceCard from '../components/ui/ServiceCard.jsx'
import { api } from '../api/client.js'
import { categories } from '../data/categories.js'

export default function ServicesPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('category')
  const category = categories.includes(requested) ? requested : 'All'
  const [search, setSearch] = useState('')
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ limit: '12' })
      if (category !== 'All') params.set('category', category)
      if (search.trim()) params.set('search', search.trim())
      setLoading(true)
      api(`/services?${params}`)
        .then((result) => {
          setServices(result.data.items)
          setError('')
        })
        .catch((reason) => {
          if (reason.name !== 'AbortError') setError(reason.message)
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [category, search, reload])

  function selectCategory(next) {
    if (next === 'All') {
      setParams({})
      return
    }

    setParams({ category: next })
  }

  return (
    <section className="section">
      <div className="wrap">
        <PageHeader
          title="Campus services"
          description="Search the live catalogue by name, description, or location. Prices are stored in Indian rupees."
        />

        <div className="toolbar">
          <div className="search-field">
            <Icon name="search" size={18} />
            <label className="sr-only" htmlFor="service-search">
              Search services
            </label>
            <input
              id="service-search"
              type="search"
              value={search}
              placeholder="Search by name or location"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="chip-row" role="tablist" aria-label="Service categories">
            <FilterChip label="All" active={category === 'All'} onClick={() => selectCategory('All')} />
            {categories.map((item) => (
              <FilterChip
                key={item}
                label={item}
                active={category === item}
                onClick={() => selectCategory(item)}
              />
            ))}
          </div>
        </div>

        <p className="result-count" aria-live="polite">
          {loading ? 'Loading services...' : `${services.length} service${services.length === 1 ? '' : 's'}`}
        </p>
        {error ? (
          <p className="field-error">
            {error}{' '}
            <button type="button" className="btn btn-secondary" onClick={() => setReload((value) => value + 1)}>
              Retry
            </button>
          </p>
        ) : null}

        {!loading && services.length === 0 ? (
          <EmptyState
            title="No services match"
            message="Try another category or clear the search text."
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearch('')
                  selectCategory('All')
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="card-grid">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={active ? 'chip chip-active' : 'chip'}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
