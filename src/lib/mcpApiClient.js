/**
 * MCP API Client for KTT Art Store
 * Frontend client for communicating with the MCP server via HTTP
 * Falls back to local product data if MCP server is unavailable
 */

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3001'
const LOCAL_PRODUCTS_PATH = '/data/products.json'

/**
 * Call an MCP tool via HTTP
 * @param {string} toolName - Tool to call
 * @param {object} params - Tool parameters
 * @returns {Promise<string>} Tool response
 */
async function callMcpTool(toolName, params = {}) {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/mcp/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params,
        },
        id: Date.now(),
      }),
    })

    if (!response.ok) {
      throw new Error(`MCP HTTP error: ${response.status}`)
    }

    const data = await response.json()
    // Extract text content from MCP response
    if (data.result?.content?.[0]?.text) {
      return data.result.content[0].text
    }
    return JSON.stringify(data)
  } catch (error) {
    console.warn('[MCP Client] HTTP call failed, using local data:', error.message)
    return null
  }
}

/**
 * Load products from local data file
 */
async function loadLocalProducts() {
  try {
    const response = await fetch('/data/products.json')
    if (!response.ok) throw new Error('Failed to load local products')
    return await response.json()
  } catch (error) {
    console.warn('[MCP Client] Local products not found:', error.message)
    return null
  }
}

/**
 * List products with optional filters
 * @param {object} filters - Filter options
 * @returns {Promise<Array>} Product list
 */
export async function listProducts(filters = {}) {
  // Try MCP server first
  const mcpResult = await callMcpTool('list_products', filters)
  if (mcpResult) {
    try {
      return JSON.parse(mcpResult)
    } catch {
      return []
    }
  }

  // Fallback to local data
  const localProducts = await loadLocalProducts()
  if (localProducts) {
    let products = [...localProducts]

    if (filters.type) {
      products = products.filter(p => p.productType === filters.type)
    }
    if (filters.tag) {
      products = products.filter(p => p.tags.includes(filters.tag))
    }
    if (filters.available !== undefined) {
      products = products.filter(p => p.available === filters.available)
    }
    if (filters.minPrice) {
      products = products.filter(p => parseInt(p.price) >= filters.minPrice)
    }
    if (filters.maxPrice) {
      products = products.filter(p => parseInt(p.price) <= filters.maxPrice)
    }

    return products.map(p => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      price: parseInt(p.price),
      currency: p.currency,
      image: p.image,
      type: p.productType,
      tags: p.tags,
      available: p.available,
      description: p.description,
      dimensions: p.dimensions,
      medium: p.medium,
      year: p.year,
    }))
  }

  return []
}

/**
 * Search products by keyword
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
export async function searchProducts(query) {
  const mcpResult = await callMcpTool('search_products', { query })
  if (mcpResult) {
    try {
      return JSON.parse(mcpResult)
    } catch {
      return []
    }
  }

  // Fallback to local search
  const localProducts = await loadLocalProducts()
  if (localProducts) {
    const lowerQuery = query.toLowerCase()
    return localProducts.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    )
  }

  return []
}

/**
 * Get product details by handle
 * @param {string} handle - Product handle
 * @returns {Promise<object|null>} Product details
 */
export async function getProductDetails(handle) {
  const mcpResult = await callMcpTool('get_product_details', { handle })
  if (mcpResult) {
    try {
      return JSON.parse(mcpResult)
    } catch {
      return null
    }
  }

  // Fallback to local data
  const localProducts = await loadLocalProducts()
  if (localProducts) {
    const product = localProducts.find(p => p.handle === handle)
    if (product) {
      return {
        id: product.id,
        handle: product.handle,
        title: product.title,
        price: parseInt(product.price),
        currency: product.currency,
        image: product.image,
        type: product.productType,
        tags: product.tags,
        available: product.available,
        description: product.description,
        dimensions: product.dimensions,
        medium: product.medium,
        year: product.year,
      }
    }
  }

  return null
}

/**
 * Get store information
 * @returns {Promise<string>} Store info
 */
export async function getStoreInfo() {
  const mcpResult = await callMcpTool('get_store_info', {})
  return mcpResult || 'Store information unavailable'
}

/**
 * Get product types
 * @returns {Promise<Array>} Product types
 */
export async function getProductTypes() {
  const mcpResult = await callMcpTool('get_product_types', {})
  if (mcpResult) {
    try {
      return JSON.parse(mcpResult)
    } catch {
      return []
    }
  }
  return []
}

/**
 * Get available tags
 * @returns {Promise<Array>} Available tags
 */
export async function getAvailableTags() {
  const mcpResult = await callMcpTool('get_available_tags', {})
  if (mcpResult) {
    try {
      return JSON.parse(mcpResult)
    } catch {
      return []
    }
  }
  return []
}

/**
 * Check if MCP server is available
 * @returns {Promise<boolean>} Server availability
 */
export async function checkMcpServer() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}

export default {
  listProducts,
  searchProducts,
  getProductDetails,
  getStoreInfo,
  getProductTypes,
  getAvailableTags,
  checkMcpServer,
}
