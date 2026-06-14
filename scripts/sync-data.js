#!/usr/bin/env node
/**
 * Sync script - transforms mock products to MCP format
 * Usage: node scripts/sync-data.js
 *
 * Note: This contains a copy of getMockProducts to work without Vite
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mpcDataDir = path.join(__dirname, '..', 'mcp-server', 'data')
const publicDataDir = path.join(__dirname, '..', 'public', 'data')
const IMAGE_BASE = 'https://kristiantalley.com'

// Copy of mock products from src/lib/shopifyClient.js
function getMockProducts() {
  return [
    {
      id: 'gid://shopify/Product/1',
      title: '"Pyromancer"',
      handle: 'pyromancer',
      description: 'Original one-of-a-kind watercolor painting with ink linework. A lone pyromancer conjures fire in a tangled, rain-streaked forest, rendered in loose, expressive brushwork over dense ink. Signed by the artist.',
      productType: 'Painting',
      tags: ['original', 'watercolor', 'ink', '1-of-1'],
      price: '135',
      currency: 'USD',
      image: '/products/pyromancer.jpg',
      imageAlt: 'Pyromancer — original watercolor and ink painting',
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
      productType: 'Painting',
      tags: ['original', 'watercolor', '1-of-1', 'miniature'],
      price: '75',
      currency: 'USD',
      image: '/products/panoptic-serpent-coaster.jpg',
      imageAlt: 'Panoptic Serpent — original 1/1 miniature painting on a wood coaster',
      available: true,
      quantity: 1,
      dimensions: '3.5" x 3.5"',
      medium: 'Watercolor and colored pencil on wood coaster',
      year: '2018',
    },
  ]
}

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    console.error(`Failed to create directory ${dir}:`, error)
    throw error
  }
}

async function syncProducts() {
  console.log('🔄 Syncing products from shopifyClient.js to MCP format...')

  try {
    await ensureDirectoryExists(mpcDataDir)
    await ensureDirectoryExists(publicDataDir)

    const products = getMockProducts()
    const json = JSON.stringify(products, null, 2)

    // The catalog is served from two generated copies that must stay in lockstep:
    //   - mcp-server/data/products.json → the MCP/bot backend
    //   - public/data/products.json     → the storefront's local fallback (mcpApiClient)
    const targets = [
      path.join(mpcDataDir, 'products.json'),
      path.join(publicDataDir, 'products.json'),
    ]

    for (const productsPath of targets) {
      await fs.writeFile(productsPath, json, 'utf-8')
      console.log(`📁 Saved to: ${productsPath}`)
    }

    console.log(`✅ Successfully synced ${products.length} products`)

    // Count by type
    const typeCount = {}
    products.forEach((p) => {
      typeCount[p.productType] = (typeCount[p.productType] || 0) + 1
    })

    console.log('\n📊 Products by type:')
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })

    // List all tags
    const tags = new Set()
    products.forEach((p) => {
      p.tags.forEach((t) => tags.add(t))
    })

    console.log(`\n🏷️  Available tags: ${Array.from(tags).sort().join(', ')}`)
  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  }
}

syncProducts()
