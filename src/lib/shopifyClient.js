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
      id: 'gid://shopify/Product/1',
      title: '"And if I weren’t welcome–"',
      handle: 'and-if-i-werent-welcome',
      description: 'Part of a four-panel pen-and-ink narrative series. Expressive figure work in dense linework.',
      productType: 'Illustration',
      tags: ['original', 'ink', 'figurative'],
      price: '450',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/a9ff8c69debdccb5e12eaf4bb6b651368deefab0.jpg`,
      imageAlt: 'And if I weren’t welcome–',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Pen and ink on paper',
      year: '2016',
    },
    {
      id: 'gid://shopify/Product/2',
      title: 'Track Pants',
      handle: 'track-pants',
      description: 'Ink-on-paper study of a seated figure, rendered in confident line.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '350',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/9d71d77c38d29bd1e04b774aecdbc2c94a41542b.jpg`,
      imageAlt: 'Track Pants',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Ink on paper',
      year: '2016',
    },
    {
      id: 'gid://shopify/Product/3',
      title: 'Cynicism',
      handle: 'cynicism',
      description: 'Bold ink-on-paper figure study.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '400',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/9bc0e91025aa7c2d3287185e62d31af92c76d5ce.jpg`,
      imageAlt: 'Cynicism',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Ink on paper',
      year: '2016',
    },
    {
      id: 'gid://shopify/Product/4',
      title: '"Masks" Album Cover',
      handle: 'masks-album-cover',
      description: 'Original ink illustration created as an album cover design.',
      productType: 'Illustration',
      tags: ['original', 'ink', 'illustration'],
      price: '550',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_p7xub15DW11qfchfvo1_1280.jpg`,
      imageAlt: 'Masks Album Cover',
      available: true,
      dimensions: '11" x 14"',
      medium: 'Ink on paper',
      year: '2016',
    },
    {
      id: 'gid://shopify/Product/5',
      title: '"Holy Man"',
      handle: 'holy-man',
      description: 'Intimate ink drawing worked directly on a manila envelope.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '375',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_p7xt018g491qfchfvo1_640.jpg`,
      imageAlt: 'Holy Man',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Ink on manila envelope',
      year: '2016',
    },
    {
      id: 'gid://shopify/Product/6',
      title: '"I Myself Am Made Entirely of Flaws"',
      handle: 'made-entirely-of-flaws',
      description: 'Text-and-image ink piece on cardstock exploring self and intention.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'text'],
      price: '425',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_oj3h8bo0qF1qfchfvo1_1280.jpg`,
      imageAlt: 'I Myself Am Made Entirely of Flaws',
      available: true,
      dimensions: '8" x 10"',
      medium: 'Ink on cardstock',
      year: '2016',
    },
    {
      id: 'gid://shopify/Product/7',
      title: 'Black Star White Sky',
      handle: 'black-star-white-sky',
      description: 'Graphite and ink on toned paper, balancing light and shadow.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'graphite'],
      price: '500',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_oj3hd4twZJ1qfchfvo1_1280.jpg`,
      imageAlt: 'Black Star White Sky',
      available: true,
      dimensions: '11" x 14"',
      medium: 'Graphite and ink on toned paper',
      year: '2016',
    },
    {
      id: 'gid://shopify/Product/8',
      title: 'Ego',
      handle: 'ego',
      description: 'Expressive ink-on-paper figure study.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '400',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_o6buie7FKx1qfchfvo1_1280.jpg`,
      imageAlt: 'Ego',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Ink on paper',
      year: '2015',
    },
    {
      id: 'gid://shopify/Product/9',
      title: '"Entity"',
      handle: 'entity',
      description: 'Digital painting, offered as an archival giclée print.',
      productType: 'Painting',
      tags: ['print', 'digital', 'limited-edition'],
      price: '250',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_p7xsibd5Je1qfchfvo1_1280.jpg`,
      imageAlt: 'Entity',
      available: true,
      dimensions: 'Giclée print, 12" x 16"',
      medium: 'Digital',
      year: '2017',
    },
    {
      id: 'gid://shopify/Product/10',
      title: '"Hade’s Game"',
      handle: 'hades-game',
      description: 'Oil painting on panel.',
      productType: 'Painting',
      tags: ['original', 'painting', 'oil'],
      price: '650',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_nfc218WzgY1qfchfvo1_1280.jpg`,
      imageAlt: 'Hade’s Game',
      available: true,
      dimensions: '16" x 20"',
      medium: 'Oil on panel',
      year: '2014',
    },
    {
      id: 'gid://shopify/Product/11',
      title: '"Caulfield"',
      handle: 'caulfield',
      description: 'Acrylic painting on panel.',
      productType: 'Painting',
      tags: ['original', 'painting', 'acrylic'],
      price: '600',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_na4ehzqr7B1qfchfvo1_1280.jpg`,
      imageAlt: 'Caulfield',
      available: true,
      dimensions: '16" x 20"',
      medium: 'Acrylic on panel',
      year: '2015',
    },
    {
      id: 'gid://shopify/Product/12',
      title: 'Happier Times',
      handle: 'happier-times',
      description: 'Watercolor and pen on paper.',
      productType: 'Painting',
      tags: ['original', 'watercolor', 'ink'],
      price: '375',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_nce3mwJvEc1qfchfvo1_r1_1280.jpg`,
      imageAlt: 'Happier Times',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Watercolor and pen on paper',
      year: '2013',
    },
    {
      id: 'gid://shopify/Product/13',
      title: '"Damascus"',
      handle: 'damascus',
      description: 'Large-scale acrylic painting on panel, roughly four by five-and-a-half feet.',
      productType: 'Painting',
      tags: ['original', 'painting', 'acrylic', 'large'],
      price: '650',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_n2f1ajiBYu1qfchfvo1_r1_1280.jpg`,
      imageAlt: 'Damascus',
      available: true,
      dimensions: '48" x 66"',
      medium: 'Acrylic on panel',
      year: '2014',
    },
    {
      id: 'gid://shopify/Product/14',
      title: '"Telluric"',
      handle: 'telluric',
      description: 'Cast bronze sculpture.',
      productType: 'Sculpture',
      tags: ['original', 'sculpture', 'bronze'],
      price: '650',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_p7xtt86my71qfchfvo1_1280.jpg`,
      imageAlt: 'Telluric',
      available: true,
      dimensions: 'Bronze',
      medium: 'Cast bronze',
      year: '2017',
    },
    {
      id: 'gid://shopify/Product/15',
      title: 'Full Circle',
      handle: 'full-circle',
      description: 'Cast bronze sculpture incorporating a human tooth.',
      productType: 'Sculpture',
      tags: ['original', 'sculpture', 'bronze'],
      price: '600',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_o1jy9uxD3O1qfchfvo1_r1_1280.jpg`,
      imageAlt: 'Full Circle',
      available: true,
      dimensions: 'Bronze',
      medium: 'Cast bronze with human tooth',
      year: '2015',
    },
    {
      id: 'gid://shopify/Product/16',
      title: 'Pride',
      handle: 'pride',
      description: 'Cast bronze sculpture.',
      productType: 'Sculpture',
      tags: ['original', 'sculpture', 'bronze'],
      price: '550',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_o07jutp8iO1qfchfvo1_1280.jpg`,
      imageAlt: 'Pride',
      available: true,
      dimensions: 'Bronze',
      medium: 'Cast bronze',
      year: '2015',
    },
    {
      id: 'gid://shopify/Product/17',
      title: 'Reconciliation',
      handle: 'reconciliation',
      description: 'Cast bronze sculpture mounted on a walnut base.',
      productType: 'Sculpture',
      tags: ['original', 'sculpture', 'bronze'],
      price: '575',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_ngn048pkZr1qfchfvo1_r1_1280.jpg`,
      imageAlt: 'Reconciliation',
      available: true,
      dimensions: 'Bronze on walnut base',
      medium: 'Cast bronze on walnut base',
      year: '2014',
    },
    {
      id: 'gid://shopify/Product/18',
      title: 'Love in the Time of Cholera',
      handle: 'love-in-the-time-of-cholera',
      description: 'Copper etching, first state. Limited edition.',
      productType: 'Print',
      tags: ['print', 'etching', 'limited-edition'],
      price: '300',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_noxxuoKOyR1qfchfvo1_1280.jpg`,
      imageAlt: 'Love in the Time of Cholera',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Copper etching',
      year: '2015',
    },
    {
      id: 'gid://shopify/Product/19',
      title: 'Seraph',
      handle: 'seraph',
      description: 'Multi-block linocut print.',
      productType: 'Print',
      tags: ['print', 'linocut', 'limited-edition'],
      price: '325',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_nf0zcuecWj1qfchfvo1_1280.jpg`,
      imageAlt: 'Seraph',
      available: true,
      dimensions: '11" x 14"',
      medium: 'Multi-block linocut',
      year: '2014',
    },
    {
      id: 'gid://shopify/Product/20',
      title: 'Star Eater',
      handle: 'star-eater',
      description: 'Two-layer silkscreen on felt fabric. Limited edition.',
      productType: 'Print',
      tags: ['print', 'screenprint', 'limited-edition'],
      price: '275',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_netlg81UUH1qfchfvo1_1280.jpg`,
      imageAlt: 'Star Eater',
      available: true,
      dimensions: '12" x 16"',
      medium: 'Two-layer silkscreen on felt',
      year: '2014',
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
