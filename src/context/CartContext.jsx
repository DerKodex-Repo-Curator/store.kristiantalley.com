import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { createCart, getProductByHandle, isShopifyConfigured } from '../lib/shopifyClient'
import { reconcileBotCart } from '../lib/mcpCart'

const CartContext = createContext(null)

/**
 * Cart provider managing cart state and Shopify checkout integration.
 * Handles adding/removing items, quantity updates, and checkout redirection.
 */
export function CartProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState([])
  const [checkoutUrl, setCheckoutUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

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
        // Update existing item quantity
        const newItems = [...prevItems]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        }
        return newItems
      }

      // Add new item
      return [
        ...prevItems,
        {
          id: `${variant.id}-${Date.now()}`,
          variantId: variant.id,
          productId: product.id,
          title: product.title,
          variantTitle: variant.title,
          price: variant.price,
          image: product.images[0]?.src || '',
          handle: product.handle,
          quantity,
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
        const product = await getProductByHandle(handle)
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
   */
  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
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

  /**
   * Proceed to Shopify checkout. Creates a Shopify cart from the line items
   * and redirects the browser to the hosted checkout URL.
   */
  const goToCheckout = useCallback(async () => {
    if (items.length === 0) return

    if (!isShopifyConfigured()) {
      alert('Checkout connects to Shopify once the store is configured.')
      return
    }

    setIsLoading(true)

    try {
      const lines = items.map((item) => ({
        merchandiseId: item.variantId,
        quantity: item.quantity,
      }))

      const cart = await createCart(lines)

      if (cart?.checkoutUrl) {
        setCheckoutUrl(cart.checkoutUrl)
        window.location.href = cart.checkoutUrl
      } else {
        throw new Error('No checkout URL returned from Shopify')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Sorry, something went wrong starting checkout. Please try again or email talleykristian@gmail.com.')
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
