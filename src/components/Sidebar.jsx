import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// Cart SVG icon
const CartIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
  >
    <path d="M3 4a1 1 0 0 1 1-1h3a1 1 0 0 1 .985.826L8.457 6.5H28a1 1 0 0 1 .979 1.206l-2 9.5A1 1 0 0 1 26 18H10.486l.353 2H25a1 1 0 1 1 0 2H10.017a1 1 0 0 1-1.005-.843L6.161 5H4a1 1 0 0 1-1-1m7.133 12H25.19l1.579-7.5H8.81zM7 26a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2M25 23a3 3 0 1 0 0 6 3 3 0 0 0 0-6m-1 3a1 1 0 1 1 2 0 1 1 0 0 1-2 0" />
  </svg>
)

/**
 * Fixed left sidebar matching ArtPortfolioSite layout
 * Logo at top, navigation, email/cart at bottom
 * Includes mobile header with hamburger menu
 */
function Sidebar() {
  const { cartCount, openCart } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Check if Store (root) is active
  const isStoreActive = location.pathname === '/'

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <NavLink to="/" className="mobile-header-logo" onClick={() => setMobileMenuOpen(false)}>
          KTT
        </NavLink>
        <div className="mobile-header-actions">
          {/* Cart button with icon */}
          <button
            onClick={openCart}
            className="mobile-cart-btn"
            aria-label="Open cart"
          >
            <CartIcon className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="text-xs text-gray-500">({cartCount})</span>
            )}
          </button>
          {/* Menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu - slide out from left */}
      <aside
        className={`mobile-menu ${mobileMenuOpen ? 'open' : 'closed'}`}
      >
        {/* Navigation */}
        <nav className="space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            Store
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setMobileMenuOpen(false)}
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
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </NavLink>
          <NavLink
            to="/help"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={() => setMobileMenuOpen(false)}
          >
            Help
          </NavLink>
        </nav>

        {/* Bottom section: Cart and Email */}
        <div className="mt-auto">
          {/* Cart button with icon */}
          <button
            onClick={openCart}
            className="nav-link flex items-center gap-2 w-full text-left"
          >
            <CartIcon className="w-4 h-4" />
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

      {/* Desktop Sidebar - shown on larger screens */}
      <aside className="sidebar hidden md:block">
        {/* Top section: Logo and Navigation */}
        <div>
          {/* Logo - KTT */}
          <NavLink to="/" className="block text-logo font-light tracking-wider mb-8">
            KTT
          </NavLink>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              Store
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
            <NavLink
              to="/help"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              Help
            </NavLink>
          </nav>
        </div>

        {/* Bottom section: Cart and Email */}
        <div>
          {/* Cart button with icon */}
          <button
            onClick={openCart}
            className="nav-link flex items-center gap-2 w-full text-left"
          >
            <CartIcon className="w-4 h-4" />
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
    </>
  )
}

export default Sidebar
