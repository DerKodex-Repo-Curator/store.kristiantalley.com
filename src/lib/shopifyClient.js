/**
 * Shopify Storefront API Client
 *
 * Abstracts all Shopify API interactions. When Shopify is not configured,
 * returns mock data with actual artwork from kristiantalley.com.
 */

const config = {
  storeDomain: import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || '',
  storefrontAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
  apiVersion: import.meta.env.VITE_SHOPIFY_API_VERSION || '2024-10',
}

// Base URL for artwork images
const IMAGE_BASE = 'https://kristiantalley.com'

// Live catalog endpoint on the MCP server. The storefront reads availability
// from here (not the baked mock array) so sold 1/1 originals disappear the
// moment they're purchased — no rebuild required.
const MCP_BASE = import.meta.env.VITE_MCP_TOOLS_URL || 'http://localhost:3001/mcp'

export const isShopifyConfigured = () => {
  return Boolean(config.storeDomain && config.storefrontAccessToken)
}

const getStorefrontUrl = () => {
  return `https://${config.storeDomain}/api/${config.apiVersion}/graphql.json`
}

/**
 * Execute GraphQL query against Shopify Storefront API
 */
async function shopifyFetch(query, variables = {}) {
  if (!isShopifyConfigured()) {
    console.warn('Shopify not configured - using mock data')
    return null
  }

  try {
    const response = await fetch(getStorefrontUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`)
    }

    const json = await response.json()

    if (json.errors) {
      console.error('Shopify GraphQL errors:', json.errors)
      throw new Error(json.errors[0]?.message || 'GraphQL error')
    }

    return json.data
  } catch (error) {
    console.error('Shopify fetch error:', error)
    throw error
  }
}

// ============================================================================
// PRODUCT QUERIES
// ============================================================================

export async function getProducts(first = 50) {
  const query = `
    query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            tags
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `

  const data = await shopifyFetch(query, { first })
  if (!data) return getMockProducts()
  return data.products.edges.map(({ node }) => transformProduct(node))
}

export async function getProductByHandle(handle) {
  const query = `
    query GetProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        productType
        tags
        vendor
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
              width
              height
            }
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
        options {
          id
          name
          values
        }
        metafields(identifiers: [
          { namespace: "custom", key: "dimensions" },
          { namespace: "custom", key: "medium" },
          { namespace: "custom", key: "year" }
        ]) {
          key
          value
        }
      }
    }
  `

  const data = await shopifyFetch(query, { handle })

  if (!data?.productByHandle) {
    const mockProducts = getMockProducts()
    return mockProducts.find((p) => p.handle === handle) || null
  }

  return transformProductDetail(data.productByHandle)
}

export async function createCart(lines) {
  const query = `
    mutation CreateCart($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart {
          id
          checkoutUrl
          estimatedCost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await shopifyFetch(query, { lines })

  if (!data) {
    console.warn('Cart creation skipped - Shopify not configured')
    return null
  }

  if (data.cartCreate.userErrors?.length > 0) {
    throw new Error(data.cartCreate.userErrors[0].message)
  }

  return data.cartCreate.cart
}

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

function transformProduct(node) {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description,
    productType: node.productType,
    tags: node.tags || [],
    price: node.priceRange?.minVariantPrice?.amount || '0',
    currency: node.priceRange?.minVariantPrice?.currencyCode || 'USD',
    image: node.images?.edges?.[0]?.node?.url || '',
    imageAlt: node.images?.edges?.[0]?.node?.altText || node.title,
    available: node.variants?.edges?.[0]?.node?.availableForSale ?? true,
  }
}

function transformProductDetail(node) {
  const metafields = {}
  node.metafields?.forEach((mf) => {
    if (mf?.key && mf?.value) {
      metafields[mf.key] = mf.value
    }
  })

  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    productType: node.productType,
    tags: node.tags || [],
    vendor: node.vendor,
    price: node.priceRange?.minVariantPrice?.amount || '0',
    currency: node.priceRange?.minVariantPrice?.currencyCode || 'USD',
    images: node.images?.edges?.map(({ node: img }) => ({
      src: img.url,
      alt: img.altText || node.title,
      width: img.width,
      height: img.height,
    })) || [],
    variants: node.variants?.edges?.map(({ node: v }) => ({
      id: v.id,
      title: v.title,
      available: v.availableForSale,
      price: v.price?.amount || '0',
      options: v.selectedOptions || [],
    })) || [],
    options: node.options || [],
    dimensions: metafields.dimensions || null,
    medium: metafields.medium || null,
    year: metafields.year || null,
  }
}

// ============================================================================
// MOCK DATA - Using actual artwork from kristiantalley.com
// ============================================================================

export function getMockProducts() {
  return [
    {
      id: 'gid://shopify/Product/3',
      title: '"Oracle"',
      handle: 'oracle',
      description: 'Original one-of-a-kind ink illustration on archival paper. A towering, robe-draped oracle stands sentinel above a scatter of debris washed up along a desolate shore, cradling a single glowing ember while a lone gabled house and dark mountains recede into a grey, ink-washed sky. Expressive pen-and-ink linework and tonal wash hold a quiet tension between the sacred and the spoiled. Signed by the artist.',
      productType: 'Illustration',
      tags: ['original', 'ink', 'illustration', '1-of-1'],
      price: '200',
      currency: 'USD',
      image: '/products/oracle.jpg',
      imageAlt: 'Oracle — original ink illustration on archival paper',
      available: true,
      quantity: 1,
      dimensions: '8" x 11"',
      medium: 'Ink on archival paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/1',
      title: '"Paranoid Pyromancer"',
      handle: 'pyromancer',
      description: 'Original one-of-a-kind watercolor painting with ink linework. A lone pyromancer conjures fire in a tangled, rain-streaked forest, rendered in loose, expressive brushwork over dense ink. Signed by the artist.',
      productType: 'Illustration',
      tags: ['original', 'watercolor', 'ink', 'illustration', '1-of-1'],
      price: '135',
      currency: 'USD',
      image: '/products/pyromancer.jpg',
      imageAlt: 'Paranoid Pyromancer — original watercolor and ink painting',
      available: true,
      quantity: 1,
      dimensions: '5.5" x 7"',
      medium: 'Watercolor and ink on paper',
      year: '2022',
    },
    {
      id: 'gid://shopify/Product/2',
      title: 'Panoptic Serpent Drink Coaster — Edition 1/1',
      handle: 'panoptic-serpent-coaster',
      description: 'Original one-of-a-kind miniature painting on a wood drink coaster: an all-seeing serpent coils around a single amber eye, drawn entirely by hand in fine watercolor and colored pencil and signed with the artist\'s monogram. Sealed and made to display as art — fully usable as a coaster, too.',
      productType: 'Illustration',
      tags: ['original', 'watercolor', 'illustration', '1-of-1', 'miniature'],
      price: '35',
      currency: 'USD',
      image: '/products/panoptic-serpent-coaster.jpg',
      imageAlt: 'Panoptic Serpent — original 1/1 miniature painting on a wood coaster',
      available: true,
      quantity: 1,
      dimensions: '3.5" x 3.5"',
      medium: 'Watercolor and colored pencil on wood coaster',
      year: '2018',
    },
    {
      id: 'gid://shopify/Product/4',
      title: '"Sunburnt Wook in Parking Lot"',
      handle: 'sunburnt-wook-in-parking-lot',
      description: 'Original one-of-a-kind acrylic painting on canvas. A large-scale portrait of a wind-blown, white-haired figure shielding its brow, built from loose, gestural strokes of coral, cobalt, and teal against a flushed pink-and-turquoise sky. Sun-scorched and dazed, the figure lingers in the bright, blown-out afterglow of a long day out in the open. Signed by the artist.',
      productType: 'Painting',
      tags: ['original', 'acrylic', 'painting', '1-of-1', 'large'],
      price: '550',
      currency: 'USD',
      image: '/products/sunburnt-wook-in-parking-lot.jpg',
      imageAlt: 'Sunburnt Wook in Parking Lot — original large-scale acrylic painting on canvas',
      available: true,
      quantity: 1,
      dimensions: '36" x 48"',
      medium: 'Acrylic on canvas',
      year: '2022',
    },
  ]
}

export function getMockProductByHandle(handle) {
  const products = getMockProducts()
  const product = products.find((p) => p.handle === handle)

  if (!product) return null

  return {
    ...product,
    descriptionHtml: `<p>${product.description}</p>`,
    images: [
      { src: product.image, alt: product.imageAlt },
    ],
    variants: [
      {
        id: `${product.id}-variant-1`,
        title: 'Default Title',
        available: product.available,
        price: product.price,
        options: [],
      },
    ],
    options: [],
  }
}

/**
 * Fetch the LIVE catalog from the MCP server so availability (sold-out) is
 * always current. Falls back to the baked catalog if the server is unreachable
 * (offline, local dev without the backend, etc.).
 */
export async function fetchLiveProducts() {
  try {
    const res = await fetch(`${MCP_BASE}/products`)
    if (!res.ok) throw new Error(`Products endpoint returned ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) throw new Error('Empty catalog')
    return data
  } catch (error) {
    console.warn('[catalog] live fetch failed, using baked catalog:', error.message)
    return getMockProducts()
  }
}

// Expand a flat catalog entry into the detail shape the product page expects
// (images[] / variants[]); mirrors getMockProductByHandle but for live data.
function toDetailShape(product) {
  if (!product) return null
  return {
    ...product,
    descriptionHtml: `<p>${product.description}</p>`,
    images: [{ src: product.image, alt: product.imageAlt }],
    variants: [
      {
        id: `${product.id}-variant-1`,
        title: 'Default Title',
        available: product.available,
        price: product.price,
        options: [],
      },
    ],
    options: [],
  }
}

export async function fetchLiveProductByHandle(handle) {
  const products = await fetchLiveProducts()
  return toDetailShape(products.find((p) => p.handle === handle) || null)
}

export default {
  isShopifyConfigured,
  getProducts,
  getProductByHandle,
  createCart,
  getMockProducts,
  getMockProductByHandle,
  fetchLiveProducts,
  fetchLiveProductByHandle,
}
