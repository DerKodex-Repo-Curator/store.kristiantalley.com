import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { fetchLiveProductByHandle } from '../lib/shopifyClient'
import { reconcileBotCart } from '../lib/mcpCart'

const CartContext = createContext(null)

// Server endpoint that creates a Stripe Checkout Session (see mcp-server/checkout.js)
const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_URL || 'http://localhost:3001/checkout'

// Cart is persisted here so it survives reloads and the round-trip to Stripe.
const CART_STORAGE_KEY = 'ktt_cart_v1'

function loadStoredCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Cart provider managing cart state and Shopify checkout integration.
 * Handles adding/removing items, quantity updates, and checkout redirection.
 */
export function CartProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState(loadStoredCart)
  const [checkoutUrl, setCheckoutUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)

  // Persist the cart across reloads and the Stripe round-trip.
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // storage unavailable/full — non-fatal
    }
  }, [items])

  // Calculate cart totals
  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const cartTotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0),
    [items]
  )

  // Open/close cart drawer
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  // Keep the bot's MCP cart session in sync with the on-page cart. Any add,
  // remove, quantity change, or clear rewrites the MCP cart to match, so the
  // support bot and the drawer always show the same items (two-way sync).
  useEffect(() => {
    reconcileBotCart(items)
  }, [items])

  /**
   * Add item to cart. If item with same variant ID exists, increment quantity.
   * In production, this would also update the Shopify cart via API.
   */
  const addItem = useCallback((product, variant, quantity = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.variantId === variant.id
      )

      if (existingIndex > -1) {
        // Each piece is a unique 1/1 original — it's already in the cart, so
        // there's nothing to add or increment.
        return prevItems
      }

      // Check stock before adding
      const stock = product.quantity ?? 1
      if (stock <= 0) {
        console.warn(`[Cart] Cannot add ${product.title}: out of stock`)
        return prevItems
      }

      // Add new item (quantity is always 1 for one-of-a-kind originals)
      // Use variantId as the stable ID so the existing-item check above works
      // correctly — without it, Date.now() makes every add a new entry.
      return [
        ...prevItems,
        {
          id: variant.id,
          variantId: variant.id,
          productId: product.id,
          title: product.title,
          variantTitle: variant.title,
          price: variant.price,
          image: product.images[0]?.src || '',
          handle: product.handle,
          quantity: 1,
        },
      ]
    })

    // Open cart drawer after adding
    setIsOpen(true)
  }, [])

  /**
   * Add an item to the cart by product handle. Resolves the product (and its
   * first/default variant) via the Shopify client, then delegates to addItem.
   * Used by the support bot bridge so "add X to cart" in chat mirrors here.
   * @returns {Promise<boolean>} whether the item was added
   */
  const addItemByHandle = useCallback(
    async (handle, quantity = 1) => {
      try {
        // Resolve the full detail shape (variant + image) the product page uses.
        // fetchLiveProductByHandle returns the same detail shape ProductPage
        // consumes (with variants[]/images[]) and falls back to the baked
        // catalog when the live endpoint is unavailable. The previous code
        // called getProductByHandle/getMockProductByHandle, which weren't
        // imported here — a ReferenceError that made every bot-driven add
        // silently fail (caught below, returning false).
        const product = await fetchLiveProductByHandle(handle)
        const variant = product?.variants?.[0]
        if (!product || !variant) {
          console.warn(`[Cart] Could not resolve product for handle: ${handle}`)
          return false
        }
        addItem(product, variant, quantity)
        return true
      } catch (error) {
        console.error(`[Cart] addItemByHandle failed for ${handle}:`, error.message)
        return false
      }
    },
    [addItem]
  )

  /**
   * Remove item from cart by its line item ID.
   */
  const removeItem = useCallback((itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
  }, [])

  /**
   * Update item quantity. Removes item if quantity is 0 or less.
   * For one-of-a-kind originals, quantity is always 1 — clamp to prevent
   * incrementing beyond 1.
   */
  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.min(newQuantity, 1) } : item
      )
    )
  }, [removeItem])

  /**
   * Clear all items from cart.
   */
  const clearCart = useCallback(() => {
    setItems([])
    setCheckoutUrl(null)
  }, [])

  // When Stripe returns the buyer with ?checkout=success, empty the cart and
  // clean the URL so a refresh doesn't show stale items.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      clearCart()
      params.delete('checkout')
      params.delete('session_id')
      const qs = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
    }
  }, [clearCart])

  /**
   * Proceed to checkout. Sends the cart (product handles + quantities) to our
   * server, which creates a Stripe Checkout Session (looking up authoritative
   * prices server-side), then redirects the browser to Stripe's hosted page.
   * After a successful checkout, the server decrements stock automatically.
   */
  const goToCheckout = useCallback(async () => {
    if (items.length === 0) return

    setIsLoading(true)

    try {
      const response = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({ handle: item.handle, quantity: item.quantity })),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Checkout could not be started')
      }

      setCheckoutUrl(data.url)
      window.location.href = data.url
    } catch (error) {
      console.error('Checkout error:', error)
      alert(`Sorry, checkout couldn't start: ${error.message}. Please try again or email talleykristian@gmail.com.`)
    } finally {
      setIsLoading(false)
    }
  }, [items])

  const value = useMemo(
    () => ({
      isOpen,
      items,
      cartCount,
      cartTotal,
      checkoutUrl,
      isLoading,
      openCart,
      closeCart,
      addItem,
      addItemByHandle,
      removeItem,
      updateQuantity,
      clearCart,
      goToCheckout,
    }),
    [
      isOpen,
      items,
      cartCount,
      cartTotal,
      checkoutUrl,
      isLoading,
      openCart,
      closeCart,
      addItem,
      addItemByHandle,
      removeItem,
      updateQuantity,
      clearCart,
      goToCheckout,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/**
 * Hook to access cart context. Must be used within CartProvider.
 */
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
