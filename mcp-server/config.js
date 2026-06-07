/**
 * Configuration management for MCP Server
 * Handles environment variables and defaults
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load the repo-root .env (shared with the frontend). Real env vars set by the
// process/systemd take precedence — dotenv does not override existing ones.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

export const config = {
  // Transport configuration
  transport: process.env.MCP_TRANSPORT || 'stdio',
  port: parseInt(process.env.MCP_PORT || '3001', 10),

  // Data source configuration
  dataSource: process.env.MCP_DATA_SOURCE || 'json',
  dataPath: process.env.MCP_DATA_PATH || new URL('data', import.meta.url).pathname,

  // Shopify configuration (reuses frontend env vars when available)
  shopify: {
    storeDomain: process.env.VITE_SHOPIFY_STORE_DOMAIN || '',
    storefrontAccessToken: process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
    apiVersion: process.env.VITE_SHOPIFY_API_VERSION || '2024-10',
  },

  // Stripe configuration (server-side only — secret key never reaches the client)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    // Where Stripe sends the buyer back after checkout
    siteUrl: process.env.SITE_URL || 'http://localhost:5173',
    currency: process.env.STRIPE_CURRENCY || 'usd',
    // Countries offered in the shipping-address selector
    shippingCountries: (process.env.STRIPE_SHIPPING_COUNTRIES || 'US,CA,GB,AU,DE,FR,NL,IE,NZ')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
  },

  // Store information
  store: {
    name: 'KTT Art Store',
    domain: 'kristiantalley.com',
    email: 'kristian@kristiantalley.com',
    responseTimeHours: 24,
    currency: 'USD',
  },

  // Cart configuration
  cart: {
    sessionTtlHours: 24,
    maxItemsPerCart: 100,
  },
}

export function isShopifyConfigured() {
  return Boolean(config.shopify.storeDomain && config.shopify.storefrontAccessToken)
}

export function isStripeConfigured() {
  return Boolean(config.stripe.secretKey)
}
