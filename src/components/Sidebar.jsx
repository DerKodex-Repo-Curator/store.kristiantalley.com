import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

/**
 * Fixed left sidebar matching kristiantalley.com layout
 * Logo at top, navigation, email/cart at bottom
 */
function Sidebar() {
  const { cartCount, openCart } = useCart()

  return (
    <aside className="sidebar">
      {/* Top section: Logo and Navigation */}
      <div>
        {/* Logo - KTT */}
        <NavLink to="/" className="block text-logo font-normal tracking-wide mb-8">
          KTT
        </NavLink>

        {/* Navigation */}
        <nav className="space-y-1">
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Shop
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            About
          </NavLink>
          <a
            href="https://kristiantalley.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            Portfolio
          </a>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            Contact
          </NavLink>
        </nav>
      </div>

      {/* Bottom section: Cart and Email */}
      <div>
        {/* Cart button */}
        <button
          onClick={openCart}
          className="nav-link flex items-center gap-2 w-full text-left"
        >
          Cart
          {cartCount > 0 && (
            <span className="text-xs text-gray-500">({cartCount})</span>
          )}
        </button>

        <div className="separator" />

        {/* Email */}
        <a
          href="mailto:talleykristian@gmail.com"
          className="text-xs text-gray-600 hover:text-black transition-colors"
        >
          talleykristian@gmail.com
        </a>
      </div>
    </aside>
  )
}

export default Sidebar
