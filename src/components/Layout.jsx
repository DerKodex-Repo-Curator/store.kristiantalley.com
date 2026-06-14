import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import CartDrawer from './CartDrawer'
import SupportChat from './SupportChat'
import Footer from './Footer'

/**
 * Main layout with fixed left sidebar matching ArtPortfolioSite
 */
function Layout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Sidebar />
      <main className="main-content flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <SupportChat />
    </div>
  )
}

export default Layout
