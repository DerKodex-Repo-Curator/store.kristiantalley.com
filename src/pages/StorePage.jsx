import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { fetchLiveProducts } from '../lib/shopifyClient'

/**
 * Store page with 2-column grid - matches product page desktop layout
 */
function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const activeFilter = searchParams.get('type') || 'all'

  // Derive filters from the actual products so new categories appear automatically
  const productTypes = useMemo(() => {
    const labels = {
      Drawing: 'Drawings',
      Illustration: 'Illustrations',
      Painting: 'Paintings',
      Sculpture: 'Sculpture',
      Print: 'Prints',
    }
    const present = [...new Set(products.map((p) => p.productType).filter(Boolean))]
    return [
      { value: 'all', label: 'All' },
      ...present.map((type) => ({ value: type, label: labels[type] || type })),
    ]
  }, [products])

  useEffect(() => {
    setLoading(true)
    fetchLiveProducts()
      .then(setProducts)
      .catch((error) => console.error('Error loading products:', error))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products
    return products.filter((p) => p.productType === activeFilter)
  }, [products, activeFilter])

  const handleFilterChange = (type) => {
    if (type === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ type })
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header — tight top padding on desktop, accounts for mobile header */}
      <div className="px-6 pt-4 pb-4 md:pt-20 border-b border-gray-200">
        <h1 className="text-xl font-normal mb-4">Store</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 text-sm">
          {productTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleFilterChange(type.value)}
              className={`uppercase tracking-wider text-xs transition-colors ${
                activeFilter === type.value
                  ? 'text-black'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid — 1 col mobile, 2 col desktop */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="bg-gray-100 aspect-[3/4]" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No work available in this category.</p>
            <button
              onClick={() => handleFilterChange('all')}
              className="mt-4 text-xs uppercase tracking-wider text-black hover:text-gray-600"
            >
              View all
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/${product.handle}`}
                className="product-card"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.imageAlt || product.title}
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="bg-gray-100 aspect-[3/4] flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
                <div className="product-info">
                  <div className="product-title">{product.title}</div>
                  <div className="product-price">
                    {product.available ? `$${product.price}` : 'Sold'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StorePage
