import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getProducts, getMockProducts, isShopifyConfigured } from '../lib/shopifyClient'

/**
 * Home page - minimal landing with featured artwork
 * Matches kristiantalley.com aesthetic
 */
function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        if (isShopifyConfigured()) {
          const data = await getProducts(6)
          setProducts(data)
        } else {
          setProducts(getMockProducts().slice(0, 6))
        }
      } catch (error) {
        console.error('Error loading products:', error)
        setProducts(getMockProducts().slice(0, 6))
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero - Simple text intro */}
      <section className="px-6 py-16 max-w-2xl">
        <h1 className="text-2xl font-normal mb-4">KTT Shop</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Original drawings, illustrations, and prints.
          Each piece is handmade with care.
        </p>
        <Link to="/shop" className="btn">
          View All Work
        </Link>
      </section>

      {/* Featured Work Grid */}
      <section className="px-6 pb-16">
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-6">
          Featured
        </h2>

        {loading ? (
          <div className="masonry-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="masonry-item animate-pulse">
                <div className="bg-gray-100 aspect-[3/4]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="masonry-grid">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/shop/${product.handle}`}
                className="product-card"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.imageAlt || product.title}
                    loading="lazy"
                    className="w-full"
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

        <div className="mt-8">
          <Link to="/shop" className="btn">
            See All
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
