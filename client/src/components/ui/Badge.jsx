export default function Badge({ children }) {
  const tone = String(children).toLowerCase().replace(/\s+/g, '-')

  return <span className={`badge badge-${tone}`}>{children}</span>
}
