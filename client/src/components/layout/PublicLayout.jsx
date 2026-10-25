import { Outlet } from 'react-router-dom'
import PublicNav from './PublicNav.jsx'
import { SiteFooter } from './SiteFooter.jsx'

export default function PublicLayout() {
  return (
    <div className="public-site">
      <PublicNav />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
