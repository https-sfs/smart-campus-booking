import { useEffect } from 'react'

export default function PageHeader({ title, description, actions }) {
  useEffect(() => {
    document.title = `${title} · Smart Campus`
  }, [title])

  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}
