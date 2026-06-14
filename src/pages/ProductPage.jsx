import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchLiveProductByHandle } from '../lib/shopifyClient'
import { useCart } from '../context/CartContext'
import { useSeo } from '../lib/seo'

/**
 * Product detail page - minimal layout matching KTT style
 */
function ProductPage() {
  const { handle } = useParams()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchLiveProductByHandle(handle)

        if (!data) {
          setError('Product not found')
        } else {
          setProduct(data)
          if (data.variants?.length > 0) {
            setSelectedVariant(data.variants[0])
          }
        }
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Unable to load product')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [handle])

  useEffect(() => {
    if (addedToCart) {
      const timer = setTimeout(() => setAddedToCart(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [addedToCart])

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return
    addItem(product, selectedVariant, 1)
    setAddedToCart(true)
  }

  // Per-route SEO + Product structured data (live price/availability)
  const cleanTitle = product ? product.title.replace(/"/g, '') : ''
  const productImg = product
    ? `https://store.kristiantalley.com${product.images?.[0]?.src || product.image || ''}`
    : ''
  useSeo(
    product
      ? {
          title: `${cleanTitle} — Kristian Talley`,
          description: product.description,
          canonical: `https://store.kristiantalley.com/${product.handle}`,
          image: productImg,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: cleanTitle,
            image: productImg,
            description: product.description,
            ...(product.medium ? { material: product.medium } : {}),
            brand: { '@type': 'Person', name: 'Kristian Talley' },
            offers: {
              '@type': 'Offer',
              price: String(selectedVariant?.price ?? product.price),
              priceCurrency: 'USD',
              availability: (selectedVariant?.available ?? product.available)
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              url: `https://store.kristiantalley.com/${product.handle}`,
            },
          },
        }
      : { title: 'Kristian Talley - Art Store' }
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="bg-gray-100 aspect-[3/4] max-w-2xl mb-6" />
          <div className="h-6 bg-gray-100 w-48 mb-2" />
          <div className="h-4 bg-gray-100 w-24" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <p className="text-gray-500 mb-4">{error || 'Product not found'}</p>
        <Link to="/" className="text-xs uppercase tracking-wider hover:text-gray-500">
          Back to Store
        </Link>
      </div>
    )
  }

  const isAvailable = selectedVariant?.available ?? product.available
  const selectedImage = product.images?.[selectedImageIndex]

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-6">
        <Link to="/" className="hover:text-black">Store</Link>
        <span className="mx-2">/</span>
        <span className="text-black">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl">
        {/* Image */}
        <div>
          {selectedImage ? (
            <img
              src={selectedImage.src}
              alt={selectedImage.alt || product.title}
              className="w-full"
            />
          ) : (
            <div className="bg-gray-100 aspect-[3/4] flex items-center justify-center text-gray-400">
              No image
            </div>
          )}

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 mt-4">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-16 h-16 overflow-hidden border ${
                    selectedImageIndex === index ? 'border-black' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-xl font-normal mb-2">{product.title}</h1>
          <p className="text-sm font-light tracking-wide text-gray-500 font-mono mb-6">
            {isAvailable ? `$${selectedVariant?.price || product.price}` : 'Sold'}
          </p>

          {/* Artwork details */}
          <div className="border-t border-gray-200 py-4 space-y-2 text-sm">
            {product.medium && (
              <div className="flex justify-between">
                <span className="text-gray-500">Medium</span>
                <span>{product.medium}</span>
              </div>
            )}
            {product.dimensions && (
              <div className="flex justify-between">
                <span className="text-gray-500">Dimensions</span>
                <span>{product.dimensions}</span>
              </div>
            )}
            {product.year && (
              <div className="flex justify-between">
                <span className="text-gray-500">Year</span>
                <span>{product.year}</span>
              </div>
            )}
            {product.editionSize && (
              <div className="flex justify-between">
                <span className="text-gray-500">Edition</span>
                <span>Limited edition of {product.editionSize}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="border-t border-gray-200 py-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Variant selector */}
          {product.variants?.length > 1 && (
            <div className="border-t border-gray-200 py-4">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                Option
              </label>
              <select
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const variant = product.variants.find((v) => v.id === e.target.value)
                  setSelectedVariant(variant)
                }}
                className="input"
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id} disabled={!variant.available}>
                    {variant.title}
                    {!variant.available && ' (Sold)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add to cart */}
          <div className="border-t border-gray-200 pt-4">
            {isAvailable ? (
              <>
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className={`btn w-full ${addedToCart ? 'btn-filled' : ''}`}
                >
                  {addedToCart ? 'Added to Cart' : 'Add to Cart'}
                </button>
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-4">This piece has sold.</p>
                <Link to="/" className="btn">
                  View Other Work
                </Link>
              </div>
            )}
          </div>

          {/* Shipping info */}
          <p className="text-xs text-gray-400 mt-6">
            Free shipping on orders $200 and above.
            Questions? <Link to="/contact" className="underline">Contact me</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
