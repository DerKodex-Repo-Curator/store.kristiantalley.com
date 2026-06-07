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
const IMAGE_BASE = 'https://kristiantalley.com'

// Copy of mock products from src/lib/shopifyClient.js
function getMockProducts() {
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

    const products = getMockProducts()
    const productsPath = path.join(mpcDataDir, 'products.json')

    await fs.writeFile(productsPath, JSON.stringify(products, null, 2), 'utf-8')

    console.log(`✅ Successfully synced ${products.length} products`)
    console.log(`📁 Saved to: ${productsPath}`)

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
