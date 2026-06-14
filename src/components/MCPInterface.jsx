import { useState, useEffect } from 'react'
import {
  generateProductGrid,
  generateProductDetail,
  generateCart,
  generateCommissionForm,
  generateStoreInfo,
  generateFilterPanel,
} from '../lib/mcpClient'
import {
  listProducts,
  searchProducts,
  getProductDetails,
  getAvailableTags,
  checkMcpServer,
} from '../lib/mcpApiClient'

/**
 * MCPInterface - React orchestrator for MCP UI components
 * Displays rich interactive components for product browsing, shopping, and commissions
 * Manages state across 7 different views with event delegation for component intents
 */
function MCPInterface({ initialIntent = null }) {
  const [view, setView] = useState('home')
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cart, setCart] = useState([])
  const [filters, setFilters] = useState({
    type: null,
    priceMin: 0,
    priceMax: 1000,
    tags: [],
    search: '',
  })
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [loading, setLoading] = useState(false)
  const [cartTotal, setCartTotal] = useState(0)
  const [mcpAvailable, setMcpAvailable] = useState(false)

  // Initialize view based on intent prop
  useEffect(() => {
    if (!initialIntent) return

    const intentViewMap = {
      PRODUCT_BROWSE: 'products',
      PRODUCT_SEARCH: 'products',
      PRODUCT_DETAILS: 'product-detail',
      SHOPPING: 'cart',
      COMMISSION: 'commission',
      STORE_INFO: 'store-info',
      GENERAL: 'home',
    }

    const newView = intentViewMap[initialIntent.type] || 'home'
    setView(newView)

    // If intent contains product data, set it
    if (initialIntent.product) {
      setSelectedProduct(initialIntent.product)
    }
    if (initialIntent.products) {
      setProducts(initialIntent.products)
      setFilteredProducts(initialIntent.products)
    }
  }, [initialIntent])

  // Check MCP server availability
  useEffect(() => {
    checkMcpServer().then(setMcpAvailable)
  }, [])

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [filters, products])

  // Calculate cart total
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    setCartTotal(total)
  }, [cart])

  // Load products from MCP server or local data
  const loadProducts = async () => {
    setLoading(true)
    try {
      const fetchedProducts = await listProducts()
      setProducts(fetchedProducts)
      setFilteredProducts(fetchedProducts)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search products
  const search = async (query) => {
    setLoading(true)
    try {
      const results = await searchProducts(query)
      setProducts(results)
      setFilteredProducts(results)
      setView('products')
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load product details
  const loadProductDetails = async (handle) => {
    setLoading(true)
    try {
      const product = await getProductDetails(handle)
      if (product) {
        setSelectedProduct(product)
        setView('product-detail')
      }
    } catch (error) {
      console.error('Failed to load product details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters to products
  const applyFilters = () => {
    let filtered = products

    if (filters.search) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.description?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.type) {
      filtered = filtered.filter((p) => p.type === filters.type)
    }

    filtered = filtered.filter((p) => p.price >= filters.priceMin && p.price <= filters.priceMax)

    if (filters.tags.length > 0) {
      filtered = filtered.filter((p) => filters.tags.some((tag) => p.tags?.includes(tag)))
    }

    setFilteredProducts(filtered)
  }

  // Handle component intents via event delegation
  const handleComponentIntent = (e) => {
    const intentAttr = e.target?.closest('[data-intent]')
    if (!intentAttr) return

    const intent = intentAttr.dataset.intent
    const data = intentAttr.dataset

    switch (intent) {
      case 'view-product':
        const product = products.find((p) => p.id === data.productId)
        if (product) {
          setSelectedProduct(product)
          setView('product-detail')
        }
        break

      case 'add-to-cart':
        addToCart(data.productId, parseInt(data.quantity || '1'))
        break

      case 'remove-from-cart':
        removeFromCart(data.lineItemId)
        break

      case 'view-cart':
        setView('cart')
        break

      case 'checkout':
        handleCheckout()
        break

      case 'submit-commission':
        handleCommissionSubmit(data)
        break

      case 'apply-filters':
        setView('filters')
        break

      case 'close-filters':
        setView('products')
        break

      case 'view-store-info':
        setView('store-info')
        break

      case 'back-to-home':
        setView('home')
        break

      case 'back-to-products':
        setView('products')
        break

      default:
        break
    }
  }

  // Add item to cart
  const addToCart = (productId, quantity = 1) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const existingItem = cart.find((item) => item.id === productId)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + quantity } : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          id: productId,
          handle: product.handle,
          title: product.title,
          price: product.price,
          quantity,
          image: product.image,
        },
      ])
    }
  }

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId))
  }

  // Handle checkout
  const handleCheckout = () => {
    // In real app, would initiate Shopify checkout
    alert(`Checkout for $${cartTotal.toFixed(2)} - implement payment integration`)
  }

  // Handle commission submission
  const handleCommissionSubmit = (data) => {
    // In real app, would call submit_commission_inquiry tool
    alert('Commission inquiry submitted! We will contact you soon.')
    setView('home')
  }

  // Render based on view state
  const renderView = () => {
    switch (view) {
      case 'products':
        return (
          <div onClick={handleComponentIntent}>
            <div dangerouslySetInnerHTML={{ __html: generateProductGrid(filteredProducts) }} />
            {filteredProducts.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                No products match your filters.
              </div>
            )}
          </div>
        )

      case 'product-detail':
        return (
          <div onClick={handleComponentIntent}>
            {selectedProduct && (
              <div dangerouslySetInnerHTML={{ __html: generateProductDetail(selectedProduct) }} />
            )}
          </div>
        )

      case 'cart':
        return (
          <div onClick={handleComponentIntent}>
            <div
              dangerouslySetInnerHTML={{
                __html: generateCart(cart, cartTotal),
              }}
            />
          </div>
        )

      case 'commission':
        return (
          <div onClick={handleComponentIntent}>
            <div dangerouslySetInnerHTML={{ __html: generateCommissionForm() }} />
          </div>
        )

      case 'store-info':
        return (
          <div onClick={handleComponentIntent}>
            <div dangerouslySetInnerHTML={{ __html: generateStoreInfo() }} />
          </div>
        )

      case 'filters':
        return (
          <div onClick={handleComponentIntent}>
            <div
              dangerouslySetInnerHTML={{
                __html: generateFilterPanel(filters, products),
              }}
            />
          </div>
        )

      case 'home':
      default:
        return (
          <div onClick={handleComponentIntent} style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Welcome to KTT Art Store</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Browse our collection of original artwork, illustrations, and prints.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                data-intent="view-products"
                onClick={() => setView('products')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Browse Products
              </button>
              <button
                data-intent="view-commission"
                onClick={() => setView('commission')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Request Commission
              </button>
              <button
                data-intent="view-store-info"
                onClick={() => setView('store-info')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Store Info
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Loading...</div>
      )}
      {!loading && renderView()}
    </div>
  )
}

export default MCPInterface
