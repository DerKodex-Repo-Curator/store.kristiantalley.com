/**
 * Configuration management for MCP Server
 * Handles environment variables and defaults
 */

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
