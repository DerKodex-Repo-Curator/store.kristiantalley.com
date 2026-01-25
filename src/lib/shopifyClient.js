/**
 * Shopify Storefront API Client
 *
 * Abstracts all Shopify API interactions. When Shopify is not configured,
 * returns mock data representing KTT artwork style.
 */

const config = {
  storeDomain: import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || '',
  storefrontAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
  apiVersion: import.meta.env.VITE_SHOPIFY_API_VERSION || '2024-10',
}

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
// MOCK DATA - Reflects KTT artwork style (pen/ink, illustration, mixed media)
// Replace these image URLs with actual artwork images
// ============================================================================

export function getMockProducts() {
  return [
    {
      id: 'gid://shopify/Product/1',
      title: 'And If I Weren\'t Welcome',
      handle: 'and-if-i-werent-welcome',
      description: 'Pen and ink drawing on toned paper. A figure contemplates an uncertain threshold, caught between spaces.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '450',
      currency: 'USD',
      // Placeholder - replace with actual artwork URL
      image: 'https://64.media.tumblr.com/avatar_default_128.png',
      imageAlt: 'Pen and ink figure drawing',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Pen and ink on toned paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/2',
      title: 'Her',
      handle: 'her',
      description: 'Mixed media illustration exploring texture and form. Layers of crosshatching build depth and emotion.',
      productType: 'Illustration',
      tags: ['original', 'mixed-media', 'portrait'],
      price: '650',
      currency: 'USD',
      image: 'https://64.media.tumblr.com/avatar_default_128.png',
      imageAlt: 'Mixed media portrait illustration',
      available: true,
      dimensions: '11" x 14"',
      medium: 'Ink and watercolor',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/3',
      title: 'Then I\'d Stay',
      handle: 'then-id-stay',
      description: 'Detailed pen work depicting solitude and contemplation. The figure stands at a doorway, rendered in fine crosshatching.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '550',
      currency: 'USD',
      image: 'https://64.media.tumblr.com/avatar_default_128.png',
      imageAlt: 'Figure at doorway pen drawing',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Pen and ink on paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/4',
      title: 'Seated Figure Study',
      handle: 'seated-figure-study',
      description: 'Expressive ink drawing capturing weight and presence. Heavy crosshatching creates depth and shadow.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '400',
      currency: 'USD',
      image: 'https://64.media.tumblr.com/avatar_default_128.png',
      imageAlt: 'Seated figure ink study',
      available: true,
      dimensions: '8" x 10"',
      medium: 'India ink on paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/5',
      title: 'Wave Form',
      handle: 'wave-form',
      description: 'Abstract organic forms rendered in bold black ink. Swirling lines suggest movement and natural forces.',
      productType: 'Illustration',
      tags: ['original', 'ink', 'abstract'],
      price: '350',
      currency: 'USD',
      image: 'https://64.media.tumblr.com/avatar_default_128.png',
      imageAlt: 'Abstract wave illustration',
      available: true,
      dimensions: '8" x 8"',
      medium: 'Ink on paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/6',
      title: 'Tree Study',
      handle: 'tree-study',
      description: 'Detailed observation of bark texture and form. Careful linework captures the complexity of natural surfaces.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'nature'],
      price: '300',
      currency: 'USD',
      image: 'https://64.media.tumblr.com/avatar_default_128.png',
      imageAlt: 'Tree bark study in ink',
      available: true,
      dimensions: '6" x 8"',
      medium: 'Pen on paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/7',
      title: 'Digital Composition I',
      handle: 'digital-composition-i',
      description: 'Limited edition print of digital artwork. Bold colors and flowing forms create dynamic visual tension.',
      productType: 'Print',
      tags: ['print', 'digital', 'limited-edition'],
      price: '150',
      currency: 'USD',
      image: 'https://64.media.tumblr.com/avatar_default_128.png',
      imageAlt: 'Digital art print',
      available: true,
      dimensions: '12" x 16"',
      medium: 'Giclée print on archival paper',
      year: '2024',
      editionSize: '25',
    },
    {
      id: 'gid://shopify/Product/8',
      title: 'Nest Study',
      handle: 'nest-study',
      description: 'Intricate observation of organic form. Delicate linework captures the complexity of natural architecture.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'nature'],
      price: '275',
      currency: 'USD',
      image: 'https://64.media.tumblr.com/avatar_default_128.png',
      imageAlt: 'Nest study in ink',
      available: false,
      dimensions: '5" x 5"',
      medium: 'Pen and ink',
      year: '2023',
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

export default {
  isShopifyConfigured,
  getProducts,
  getProductByHandle,
  createCart,
  getMockProducts,
  getMockProductByHandle,
}
