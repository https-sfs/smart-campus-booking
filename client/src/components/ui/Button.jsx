import { Link } from 'react-router-dom'

export default function Button({ to, variant = 'primary', className = '', children, ...rest }) {
  const classes = `btn btn-${variant} ${className}`.trim()

  if (to) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
