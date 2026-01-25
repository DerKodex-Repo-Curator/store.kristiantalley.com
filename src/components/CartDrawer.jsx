import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

/**
 * Slide-out cart drawer - minimal matching KTT style
 */
function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    cartTotal,
    updateQuantity,
    removeItem,
    goToCheckout,
    isLoading,
  } = useCart()

  const drawerRef = useRef(null)

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeCart])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const formatPrice = (price) => `$${parseFloat(price).toFixed(0)}`

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 border-l border-gray-200 transform transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <span className="text-sm font-normal">Cart</span>
            <button
              onClick={closeCart}
              className="text-gray-500 hover:text-black text-xs uppercase tracking-wider"
            >
              Close
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500 mb-4">Your cart is empty</p>
                <Link
                  to="/shop"
                  onClick={closeCart}
                  className="btn"
                >
                  Shop
                </Link>
              </div>
            ) : (
              <ul className="space-y-6">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    {/* Image */}
                    <Link
                      to={`/shop/${item.handle}`}
                      onClick={closeCart}
                      className="w-16 h-16 flex-shrink-0 bg-gray-100 overflow-hidden"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/shop/${item.handle}`}
                        onClick={closeCart}
                        className="text-sm hover:text-gray-500 block truncate"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>

                      {/* Quantity */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 border border-gray-300 flex items-center justify-center text-xs hover:border-black"
                        >
                          -
                        </button>
                        <span className="text-xs w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 border border-gray-300 flex items-center justify-center text-xs hover:border-black"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-gray-400 hover:text-black ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <p className="text-xs text-gray-400">
                Shipping calculated at checkout
              </p>
              <button
                onClick={goToCheckout}
                disabled={isLoading}
                className="btn btn-filled w-full"
              >
                {isLoading ? 'Loading...' : 'Checkout'}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default CartDrawer
