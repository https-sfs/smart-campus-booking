import { StarIcon } from '../icons/Icon.jsx'

export default function StarRating({ value }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= value} />
      ))}
    </span>
  )
}
