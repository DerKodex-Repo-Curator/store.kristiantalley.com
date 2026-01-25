import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import CartDrawer from './CartDrawer'
import SupportChat from './SupportChat'

/**
 * Main layout with fixed left sidebar matching kristiantalley.com
 */
function Layout() {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <CartDrawer />
      <SupportChat />
    </div>
  )
}

export default Layout
