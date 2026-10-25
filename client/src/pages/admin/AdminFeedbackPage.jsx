import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StarRating from '../../components/ui/StarRating.jsx'

const ratings = ['All', '5', '4', '3', '2', '1']

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState([])
  const [rating, setRating] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50' })
    if (rating !== 'All') params.set('rating', rating)
    api(`/admin/feedback?${params}`)
      .then((result) => { setRows(result.data.items); setError('') })
      .catch((reason) => setError(reason.message))
  }, [rating])

  return (
    <>
      <PageHeader title="Feedback" description="Comments saved for completed bookings." />
      {error ? <p className="field-error">{error}</p> : null}
      <div className="chip-row" role="tablist" aria-label="Rating">
        {ratings.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={rating === item} className={rating === item ? 'chip chip-active' : 'chip'} onClick={() => setRating(item)}>
            {item === 'All' ? 'All ratings' : `${item} star`}
          </button>
        ))}
      </div>
      {rows.length === 0 ? <EmptyState title="No feedback at this rating" message="Completed bookings can receive one comment each." /> : (
        <ul className="feedback-list">
          {rows.map((item) => (
            <li key={item.id}>
              <StarRating value={item.rating} />
              <p>{item.comment}</p>
              <small>{item.userName} · {item.serviceName}</small>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
