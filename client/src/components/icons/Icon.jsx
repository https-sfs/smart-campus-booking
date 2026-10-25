const glyphs = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </>
  ),
  library: (
    <>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5z" />
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 8H19" />
    </>
  ),
  shuttle: (
    <>
      <rect x="4" y="4" width="16" height="12" rx="2" />
      <path d="M4 11h16M7 20v-4M17 20v-4" />
      <circle cx="8" cy="16" r="0.8" fill="currentColor" />
      <circle cx="16" cy="16" r="0.8" fill="currentColor" />
    </>
  ),
  lab: <path d="M9 3h6M10 3v6L5.5 19a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9V3" />,
  sports: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16M4.8 8.5h14.4M4.8 15.5h14.4" />
    </>
  ),
  auditorium: (
    <>
      <path d="M4 20V7l8-3 8 3v13" />
      <path d="M9 20v-6h6v6M4 20h16" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V3h10v5" />
      <rect x="5" y="8" width="14" height="7" rx="1.5" />
      <path d="M7 13h10v8H7z" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  building: (
    <>
      <path d="M4 20V5h10v15" />
      <path d="M14 9h6v11M4 20h16M7 8h3M7 12h3M7 16h3" />
    </>
  ),
}

export default function Icon({ name, size = 22 }) {
  const glyph = glyphs[name]

  if (!glyph) {
    return null
  }

  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  )
}

export function StarIcon({ filled = false, size = 18 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3.6l2.3 4.7 5.2.8-3.8 3.6.9 5.2L12 15.6 7.4 18l.9-5.2L4.5 9.1l5.2-.8L12 3.6z" />
    </svg>
  )
}
