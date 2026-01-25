/**
 * Store information tools
 * Provides metadata about the store, products, and policies
 */

import { z } from 'zod'
import { config } from '../config.js'

const NoArgsSchema = z.object({})

/**
 * Register store info tools with MCP server
 */
export function registerInfoTools(server, dataStore) {
  // Tool 8: Get store info
  server.tool(
    'get_store_info',
    'Get store information including artist bio, shipping, returns, and contact',
    NoArgsSchema,
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: formatStoreInfo(),
          },
        ],
      }
    }
  )

  // Tool 9: Get product types
  server.tool(
    'get_product_types',
    'Get list of product types available in store',
    NoArgsSchema,
    async () => {
      try {
        const types = await dataStore.getProductTypes()
        return {
          content: [
            {
              type: 'text',
              text: formatProductTypes(types),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting product types: ${error.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 10: Get available tags
  server.tool(
    'get_available_tags',
    'Get list of all tags used in the product catalog',
    NoArgsSchema,
    async () => {
      try {
        const tags = await dataStore.getAvailableTags()
        return {
          content: [
            {
              type: 'text',
              text: formatAvailableTags(tags),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting tags: ${error.message}`,
            },
          ],
        }
      }
    }
  )
}

/**
 * Format store information
 */
function formatStoreInfo() {
  return `🎨 KTT Art Store Information

Artist: Kristian Talley
Website: https://${config.store.domain}
Email: ${config.store.email}
Response Time: Within ${config.store.responseTimeHours} hours

About the Artist:
I create expressive pen and ink drawings, illustrations, and prints. My work
explores human figures, landscapes, and organic forms through detailed linework
and careful observation. Each piece is created with intention and care.

Product Categories:
• Original Drawings - Pen and ink on paper
• Illustrations - Mixed media works
• Prints - Limited edition giclée prints

Pricing:
Originals range from $300-$650
Prints are $150

Shipping:
• Continental US: $10-$20 depending on size
• International: Quoted individually

Returns & Exchanges:
Original artwork is final sale. Prints may be exchanged if damaged.

Commissions:
Custom commissions are available. Use submit_commission_inquiry to inquire about
custom work.`
}

/**
 * Format product types with counts
 */
function formatProductTypes(types) {
  const entries = Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `  • ${type}: ${count} piece${count === 1 ? '' : 's'}`)
    .join('\n')

  const total = Object.values(types).reduce((a, b) => a + b, 0)

  return `📊 Product Type Breakdown

${entries}

Total: ${total} pieces available`
}

/**
 * Format available tags
 */
function formatAvailableTags(tags) {
  const grouped = groupTags(tags)

  const sections = Object.entries(grouped)
    .map(([category, categoryTags]) => {
      return `${category}:\n  ${categoryTags.join(', ')}`
    })
    .join('\n\n')

  return `🏷️  Available Tags

${sections}

Browse products by tag using list_products with tag filter`
}

/**
 * Group tags by category
 */
function groupTags(tags) {
  const groups = {
    'Medium': [],
    'Subject': [],
    'Availability': [],
    'Other': [],
  }

  tags.forEach((tag) => {
    if (['ink', 'mixed-media', 'digital'].includes(tag)) {
      groups['Medium'].push(tag)
    } else if (['figurative', 'portrait', 'landscape', 'botanical', 'abstract', 'nature', 'interior'].includes(tag)) {
      groups['Subject'].push(tag)
    } else if (['original', 'print', 'limited-edition'].includes(tag)) {
      groups['Availability'].push(tag)
    } else {
      groups['Other'].push(tag)
    }
  })

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key]
    } else {
      groups[key].sort()
    }
  })

  return groups
}
