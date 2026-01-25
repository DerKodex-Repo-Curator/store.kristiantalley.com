import { createContext, useContext, useState, useCallback, useMemo } from 'react'

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

    // TODO: In production, sync with Shopify cart API
    // shopifyClient.addToCart(variant.id, quantity)
  }, [])

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
   * Proceed to Shopify checkout.
   * In production, this creates a checkout via Shopify API and redirects.
   */
  const goToCheckout = useCallback(async () => {
    if (items.length === 0) return

    setIsLoading(true)

    try {
      // TODO: In production, create Shopify checkout and get URL
      // const checkout = await shopifyClient.createCheckout(items)
      // window.location.href = checkout.webUrl

      // For now, log and show placeholder behavior
      console.log('Proceeding to checkout with items:', items)
      alert('Checkout functionality will connect to Shopify when configured.')
    } catch (error) {
      console.error('Checkout error:', error)
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
