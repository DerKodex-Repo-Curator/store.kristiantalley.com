/**
 * Product discovery tools
 * Provides browsing and search functionality for the art catalog
 */

import { z } from 'zod'

const ProductFilterSchema = z.object({
  type: z.string().optional().describe('Filter by product type (Drawing, Illustration, Print)'),
  tag: z.string().optional().describe('Filter by tag (e.g., original, ink, figurative)'),
  minPrice: z.number().optional().describe('Minimum price in USD'),
  maxPrice: z.number().optional().describe('Maximum price in USD'),
  available: z.boolean().optional().describe('Only show available items'),
})

const SearchSchema = z.object({
  query: z.string().min(1).describe('Search query for product titles and descriptions'),
})

const ProductHandleSchema = z.object({
  handle: z.string().min(1).describe('Product handle (e.g., seated-figure-i)'),
})

/**
 * Register product tools with MCP server
 */
export function registerProductTools(server, dataStore) {
  // Tool 1: List products with filters
  server.tool(
    'list_products',
    'Browse available art products with optional filters',
    ProductFilterSchema,
    async (filters) => {
      const products = await dataStore.getProducts(filters)

      return {
        content: [
          {
            type: 'text',
            text: formatProductList(products),
          },
        ],
      }
    }
  )

  // Tool 2: Search products
  server.tool(
    'search_products',
    'Search for products by keyword in title or description',
    SearchSchema,
    async ({ query }) => {
      const results = await dataStore.searchProducts(query)

      return {
        content: [
          {
            type: 'text',
            text:
              results.length === 0
                ? `No products found matching "${query}"`
                : formatProductList(results),
          },
        ],
      }
    }
  )

  // Tool 3: Get product details
  server.tool(
    'get_product_details',
    'Get detailed information about a specific product',
    ProductHandleSchema,
    async ({ handle }) => {
      const product = await dataStore.getProductByHandle(handle)

      if (!product) {
        return {
          content: [
            {
              type: 'text',
              text: `Product not found: ${handle}`,
            },
          ],
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: formatProductDetail(product),
          },
        ],
      }
    }
  )
}

/**
 * Format product list for display
 */
function formatProductList(products) {
  if (products.length === 0) {
    return 'No products found'
  }

  const formatted = products
    .map(
      (p) => `
📌 ${p.title}
   Handle: ${p.handle}
   Type: ${p.productType}
   Price: $${p.price} ${p.currency}
   Available: ${p.available ? '✅' : '❌'}
   Tags: ${p.tags.join(', ')}
   Summary: ${p.description.substring(0, 100)}...`
    )
    .join('\n')

  return `Found ${products.length} product(s):\n${formatted}`
}

/**
 * Format detailed product information
 */
function formatProductDetail(product) {
  const lines = [
    `🎨 ${product.title}`,
    `Handle: ${product.handle}`,
    `Type: ${product.productType}`,
    `Price: $${product.price} ${product.currency}`,
    `Available: ${product.available ? '✅ Yes' : '❌ No (Sold)'}`,
    `Tags: ${product.tags.join(', ')}`,
    '',
    '📝 Description:',
    product.description,
    '',
    '📐 Details:',
    `Dimensions: ${product.dimensions || 'Not specified'}`,
    `Medium: ${product.medium || 'Not specified'}`,
    `Year: ${product.year || 'Not specified'}`,
  ]

  if (product.editionSize) {
    lines.push(`Edition Size: ${product.editionSize}`)
  }

  if (product.image) {
    lines.push('', `Image: ${product.image}`)
  }

  return lines.join('\n')
}
