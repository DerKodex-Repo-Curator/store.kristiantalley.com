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
      title: 'Seated Figure I',
      handle: 'seated-figure-i',
      description: 'Expressive pen and ink drawing exploring weight and presence. Dense crosshatching builds form and shadow.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '450',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/a9ff8c69debdccb5e12eaf4bb6b651368deefab0.jpg`,
      imageAlt: 'Pen and ink figure drawing',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Pen and ink on paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/2',
      title: 'Her',
      handle: 'her',
      description: 'Mixed media portrait exploring texture and emotion through layered linework.',
      productType: 'Illustration',
      tags: ['original', 'mixed-media', 'portrait'],
      price: '650',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/571950118f110673e40acc9b1c4ded5310d5cc5b.jpg`,
      imageAlt: 'Mixed media portrait illustration',
      available: true,
      dimensions: '11" x 14"',
      medium: 'Ink and watercolor',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/3',
      title: 'Wave Form',
      handle: 'wave-form',
      description: 'Abstract organic forms rendered in bold black ink. Swirling lines suggest movement and natural forces.',
      productType: 'Illustration',
      tags: ['original', 'ink', 'abstract'],
      price: '550',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/cb59c617ea26a21062667b56325fe080ddb69c0c.jpg`,
      imageAlt: 'Abstract wave illustration',
      available: true,
      dimensions: '8" x 10"',
      medium: 'India ink on paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/4',
      title: 'Standing Figure',
      handle: 'standing-figure',
      description: 'Detailed pen work depicting solitude and contemplation. The figure rendered in fine crosshatching.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '400',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/7684220b92e91abf215949763f2244c2f4d82215.jpg`,
      imageAlt: 'Standing figure pen drawing',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Pen and ink on toned paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/5',
      title: 'Organic Study I',
      handle: 'organic-study-i',
      description: 'Intricate observation of organic form. Delicate linework captures the complexity of natural architecture.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'nature'],
      price: '350',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/9d71d77c38d29bd1e04b774aecdbc2c94a41542b.jpg`,
      imageAlt: 'Organic form study in ink',
      available: true,
      dimensions: '8" x 8"',
      medium: 'Ink on paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/6',
      title: 'Contemplation',
      handle: 'contemplation',
      description: 'Figure study exploring interior states through expressive mark-making.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '500',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/c41b68c2ba60060a3dc969c7c70e1f988968c0b8.jpg`,
      imageAlt: 'Contemplative figure drawing',
      available: true,
      dimensions: '11" x 14"',
      medium: 'Pen and ink',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/7',
      title: 'Study in Motion',
      handle: 'study-in-motion',
      description: 'Dynamic figure capturing movement and gesture through fluid linework.',
      productType: 'Illustration',
      tags: ['original', 'ink', 'figurative'],
      price: '425',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/9bc0e91025aa7c2d3287185e62d31af92c76d5ce.jpg`,
      imageAlt: 'Figure in motion study',
      available: true,
      dimensions: '9" x 12"',
      medium: 'India ink on paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/8',
      title: 'Threshold',
      handle: 'threshold',
      description: 'A figure at a doorway, caught between spaces. Heavy crosshatching creates depth and atmosphere.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '475',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/10fdd635b26fdd47aad05e9b2911328464b52849.jpg`,
      imageAlt: 'Figure at threshold',
      available: false,
      dimensions: '9" x 12"',
      medium: 'Pen and ink on toned paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/9',
      title: 'Forest Edge',
      handle: 'forest-edge',
      description: 'Landscape study capturing the boundary between light and shadow in dense woodland.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'landscape'],
      price: '375',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/efc7ca5f0cb9a147f371370cf7121c779398d909.jpg`,
      imageAlt: 'Forest landscape drawing',
      available: true,
      dimensions: '8" x 10"',
      medium: 'Ink on paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/10',
      title: 'Untitled Figure',
      handle: 'untitled-figure',
      description: 'Raw, expressive figure study. Gestural marks capture emotional weight.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '400',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/fe7f53057f2c466902f36b0d966c6b20a49f569f.jpg`,
      imageAlt: 'Untitled figure drawing',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Pen and ink',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/11',
      title: 'Interior I',
      handle: 'interior-i',
      description: 'Intimate interior scene rendered in detailed linework.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'interior'],
      price: '525',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/8d3d29b39cabd65fd10666d106812f4692d6d4ac.jpg`,
      imageAlt: 'Interior scene drawing',
      available: true,
      dimensions: '11" x 14"',
      medium: 'Pen and ink on paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/12',
      title: 'Texture Study',
      handle: 'texture-study',
      description: 'Close observation of organic texture and form.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'nature'],
      price: '300',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/c0d44b570ceea3a0ad1b147b779e2f06c085458e.jpg`,
      imageAlt: 'Texture study in ink',
      available: true,
      dimensions: '6" x 8"',
      medium: 'Ink on paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/13',
      title: 'Nest',
      handle: 'nest',
      description: 'Intricate study of natural architecture. Fine linework builds complex form.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'nature'],
      price: '350',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/356a448e67f53798897db0eab8bad5c1ce46578f.jpg`,
      imageAlt: 'Nest study in ink',
      available: true,
      dimensions: '5" x 5"',
      medium: 'Pen and ink',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/14',
      title: 'Digital Composition I',
      handle: 'digital-composition-i',
      description: 'Limited edition print of digital artwork. Bold colors and flowing forms.',
      productType: 'Print',
      tags: ['print', 'digital', 'limited-edition'],
      price: '150',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_p7xub15DW11qfchfvo1_1280.jpg`,
      imageAlt: 'Digital art print',
      available: true,
      dimensions: '12" x 16"',
      medium: 'Giclée print on archival paper',
      year: '2024',
      editionSize: '25',
    },
    {
      id: 'gid://shopify/Product/15',
      title: 'Figure Study II',
      handle: 'figure-study-ii',
      description: 'Expressive figure rendered with bold, confident strokes.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '475',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_p7xu93Py5V1qfchfvo1_1280.jpg`,
      imageAlt: 'Figure study drawing',
      available: true,
      dimensions: '9" x 12"',
      medium: 'India ink on paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/16',
      title: 'Botanical Study',
      handle: 'botanical-study',
      description: 'Detailed botanical observation with fine linework.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'botanical'],
      price: '325',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_p7xsyvetbj1qfchfvo1_r1_1280.jpg`,
      imageAlt: 'Botanical ink drawing',
      available: true,
      dimensions: '8" x 10"',
      medium: 'Pen and ink on paper',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/17',
      title: 'Portrait Study',
      handle: 'portrait-study',
      description: 'Intimate portrait rendered with expressive mark-making.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'portrait'],
      price: '550',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_oj3hd4twZJ1qfchfvo1_1280.jpg`,
      imageAlt: 'Portrait study in ink',
      available: false,
      dimensions: '11" x 14"',
      medium: 'Pen and ink',
      year: '2022',
    },
    {
      id: 'gid://shopify/Product/18',
      title: 'Landscape Fragment',
      handle: 'landscape-fragment',
      description: 'Abstract landscape exploring form and atmosphere.',
      productType: 'Illustration',
      tags: ['original', 'ink', 'landscape'],
      price: '400',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_lnc615B31s1qfchfvo1_1280.jpg`,
      imageAlt: 'Abstract landscape illustration',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Ink and wash',
      year: '2023',
    },
    {
      id: 'gid://shopify/Product/19',
      title: 'Seated Figure II',
      handle: 'seated-figure-ii',
      description: 'Second in series of seated figure studies.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'figurative'],
      price: '450',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_ljcxkmw5Kt1qfchfvo1_1280.jpg`,
      imageAlt: 'Seated figure drawing',
      available: true,
      dimensions: '9" x 12"',
      medium: 'Pen and ink on toned paper',
      year: '2024',
    },
    {
      id: 'gid://shopify/Product/20',
      title: 'Tree Study',
      handle: 'tree-study',
      description: 'Detailed observation of bark texture and organic form.',
      productType: 'Drawing',
      tags: ['original', 'ink', 'nature'],
      price: '300',
      currency: 'USD',
      image: `${IMAGE_BASE}/tumblr/tumblr_lmcfcfnDb51qfchfvo1_1280.jpg`,
      imageAlt: 'Tree bark study',
      available: true,
      dimensions: '6" x 8"',
      medium: 'Pen on paper',
      year: '2024',
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
