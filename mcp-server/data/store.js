/**
 * Abstract data store interface
 * Supports both JSON (local) and Shopify (remote) backends
 */

import fs from 'fs/promises'
import path from 'path'
import { config } from '../config.js'

/**
 * Abstract base class for data storage
 */
export class DataStore {
  async getProducts(filters = {}) {
    throw new Error('getProducts not implemented')
  }

  async getProductByHandle(handle) {
    throw new Error('getProductByHandle not implemented')
  }

  async searchProducts(query) {
    throw new Error('searchProducts not implemented')
  }

  async createCart(sessionId) {
    throw new Error('createCart not implemented')
  }

  async getCart(sessionId) {
    throw new Error('getCart not implemented')
  }

  async addToCart(sessionId, productHandle, quantity) {
    throw new Error('addToCart not implemented')
  }

  async removeFromCart(sessionId, lineItemId) {
    throw new Error('removeFromCart not implemented')
  }

  async getProductTypes() {
    throw new Error('getProductTypes not implemented')
  }

  async getAvailableTags() {
    throw new Error('getAvailableTags not implemented')
  }

  async addInquiry(inquiry) {
    throw new Error('addInquiry not implemented')
  }
}

/**
 * JSON file-based data store
 * Reads from products.json and manages carts.json
 */
export class JSONDataStore extends DataStore {
  constructor() {
    super()
    this.dataPath = config.dataPath
    this.productsPath = path.join(this.dataPath, 'products.json')
    this.cartsPath = path.join(this.dataPath, 'carts.json')
    this.inquiriesPath = path.join(this.dataPath, 'inquiries.json')
    this.ordersPath = path.join(this.dataPath, 'orders.json')
    this.productCache = null
    this.cartCache = null
  }

  async loadProducts() {
    if (this.productCache) return this.productCache

    try {
      const data = await fs.readFile(this.productsPath, 'utf-8')
      this.productCache = JSON.parse(data)
      return this.productCache
    } catch (error) {
      console.error('Error loading products.json:', error)
      throw new Error('Failed to load products')
    }
  }

  /**
   * Decrement stock for one or more products and persist to disk.
   * If quantity reaches 0, mark available: false.
   * Used by the Stripe webhook after a purchase so inventory updates automatically.
   * Idempotent — won't go negative. Mutates the in-memory cache in place too.
   */
  async markProductsSold(handles) {
    if (!Array.isArray(handles) || handles.length === 0) return
    const products = await this.loadProducts()
    let changed = false
    for (const p of products) {
      if (handles.includes(p.handle)) {
        // Ensure quantity exists (backwards compat)
        if (p.quantity === undefined) p.quantity = 1
        if (p.quantity > 0) {
          p.quantity -= 1
          if (p.quantity === 0) {
            p.available = false
          }
          changed = true
        }
      }
    }
    if (!changed) return
    await fs.writeFile(this.productsPath, JSON.stringify(products, null, 2), 'utf-8')
    this.productCache = products
  }

  async loadCarts() {
    if (this.cartCache) return this.cartCache

    try {
      const data = await fs.readFile(this.cartsPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {}
      }
      console.error('Error loading carts.json:', error)
      return {}
    }
  }

  async saveCarts(carts) {
    try {
      await fs.writeFile(this.cartsPath, JSON.stringify(carts, null, 2), 'utf-8')
      this.cartCache = carts
    } catch (error) {
      console.error('Error saving carts.json:', error)
      throw new Error('Failed to save carts')
    }
  }

  async loadInquiries() {
    try {
      const data = await fs.readFile(this.inquiriesPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []
      }
      console.error('Error loading inquiries.json:', error)
      return []
    }
  }

  async saveInquiries(inquiries) {
    try {
      await fs.writeFile(this.inquiriesPath, JSON.stringify(inquiries, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error saving inquiries.json:', error)
      throw new Error('Failed to save inquiries')
    }
  }

  async getProducts(filters = {}) {
    const products = await this.loadProducts()
    let filtered = products

    if (filters.type) {
      filtered = filtered.filter((p) => p.productType === filters.type)
    }

    if (filters.tag) {
      filtered = filtered.filter((p) => p.tags.includes(filters.tag))
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => parseFloat(p.price) >= filters.minPrice)
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => parseFloat(p.price) <= filters.maxPrice)
    }

    if (filters.available !== undefined) {
      filtered = filtered.filter((p) => p.available === filters.available)
    }

    return filtered
  }

  async getProductByHandle(handle) {
    const products = await this.loadProducts()
    return products.find((p) => p.handle === handle) || null
  }

  async searchProducts(query) {
    const products = await this.loadProducts()
    const q = query.toLowerCase()

    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  async getProductTypes() {
    const products = await this.loadProducts()
    const types = {}

    products.forEach((p) => {
      types[p.productType] = (types[p.productType] || 0) + 1
    })

    return types
  }

  async getAvailableTags() {
    const products = await this.loadProducts()
    const tags = new Set()

    products.forEach((p) => {
      p.tags.forEach((t) => tags.add(t))
    })

    return Array.from(tags).sort()
  }

  async createCart(sessionId) {
    const carts = await this.loadCarts()
    const cart = {
      id: sessionId,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    carts[sessionId] = cart
    await this.saveCarts(carts)
    return cart
  }

  async getCart(sessionId) {
    const carts = await this.loadCarts()
    return carts[sessionId] || null
  }

  async addToCart(sessionId, productHandle, quantity) {
    const carts = await this.loadCarts()
    let cart = carts[sessionId]

    if (!cart) {
      cart = await this.createCart(sessionId)
    }

    const product = await this.getProductByHandle(productHandle)
    if (!product) {
      throw new Error(`Product not found: ${productHandle}`)
    }

    if (!product.available) {
      throw new Error(`Product not available: ${productHandle}`)
    }

    // Check if item already in cart
    const existingItem = cart.items.find((item) => item.handle === productHandle)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.items.push({
        id: `${productHandle}-${Date.now()}`,
        handle: productHandle,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity,
      })
    }

    cart.updatedAt = new Date().toISOString()
    carts[sessionId] = cart
    await this.saveCarts(carts)
    return cart
  }

  async removeFromCart(sessionId, lineItemId) {
    const carts = await this.loadCarts()
    const cart = carts[sessionId]

    if (!cart) {
      throw new Error(`Cart not found: ${sessionId}`)
    }

    cart.items = cart.items.filter((item) => item.id !== lineItemId)
    cart.updatedAt = new Date().toISOString()
    carts[sessionId] = cart
    await this.saveCarts(carts)
    return cart
  }

  async addInquiry(inquiry) {
    const inquiries = await this.loadInquiries()
    inquiries.push({
      ...inquiry,
      id: `inquiry-${Date.now()}`,
      createdAt: new Date().toISOString(),
    })
    await this.saveInquiries(inquiries)
    return inquiries[inquiries.length - 1]
  }

  async loadOrders() {
    try {
      const data = await fs.readFile(this.ordersPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      if (error.code === 'ENOENT') return []
      console.error('Error loading orders.json:', error)
      return []
    }
  }

  async addOrder(order) {
    const orders = await this.loadOrders()
    // Idempotency: Stripe may deliver the same event more than once
    if (order.sessionId && orders.some((o) => o.sessionId === order.sessionId)) {
      return orders.find((o) => o.sessionId === order.sessionId)
    }
    const record = { ...order, recordedAt: new Date().toISOString() }
    orders.push(record)
    try {
      await fs.writeFile(this.ordersPath, JSON.stringify(orders, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error saving orders.json:', error)
      throw new Error('Failed to save order')
    }
    return record
  }
}

/**
 * Shopify Storefront API data store (Phase 5)
 * Reads from Shopify API instead of local JSON
 * Requires VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN
 */
export class ShopifyDataStore extends DataStore {
  constructor() {
    super()
    this.storeDomain = config.shopify.storeDomain
    this.accessToken = config.shopify.storefrontAccessToken
    this.apiVersion = config.shopify.apiVersion
  }

  async getStorefrontUrl() {
    return `https://${this.storeDomain}/api/${this.apiVersion}/graphql.json`
  }

  async shopifyFetch(query, variables = {}) {
    if (!this.storeDomain || !this.accessToken) {
      throw new Error('Shopify credentials not configured')
    }

    try {
      const response = await fetch(await this.getStorefrontUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.accessToken,
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

  async getProducts(filters = {}) {
    // TODO: Implement Shopify product query with filters
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async getProductByHandle(handle) {
    // TODO: Implement Shopify product by handle query
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async searchProducts(query) {
    // TODO: Implement Shopify product search
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async getProductTypes() {
    // TODO: Aggregate product types from Shopify API
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async getAvailableTags() {
    // TODO: Aggregate tags from Shopify product metafields
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async createCart(sessionId) {
    // TODO: Create Shopify cart and link to session
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async getCart(sessionId) {
    // TODO: Fetch Shopify cart by session
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async addToCart(sessionId, productHandle, quantity) {
    // TODO: Use Shopify cart API to add items
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async removeFromCart(sessionId, lineItemId) {
    // TODO: Use Shopify cart API to remove items
    throw new Error('ShopifyDataStore not yet implemented')
  }

  async addInquiry(inquiry) {
    // Store inquiries locally even with Shopify backend
    // (Could also integrate with Shopify orders or custom app)
    throw new Error('ShopifyDataStore not yet implemented')
  }
}

/**
 * Factory function to create appropriate data store
 */
export function createDataStore() {
  if (config.dataSource === 'shopify') {
    console.warn(
      'Shopify data source not yet fully implemented. Ensure VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN are set.'
    )
    // TODO: Uncomment when implementation complete
    // return new ShopifyDataStore()
    return new JSONDataStore()
  }

  return new JSONDataStore()
}
