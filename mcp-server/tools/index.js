/**
 * Tools orchestrator
 * Builds tool definitions and routes tool calls to handlers
 */

import { v4 as uuidv4 } from 'uuid'
import {
  formatProductList,
  formatProductDetail,
  formatStoreInfo,
  formatProductTypes,
  formatAvailableTags,
  formatCommissionConfirmation,
  formatContactInfo,
  formatCartSession,
  formatAddedToCart,
  formatCartDetails,
} from './formatters.js'

/**
 * Build all tool definitions for MCP
 */
export function buildToolDefinitions() {
  return [
    // Product Discovery
    {
      name: 'list_products',
      description: 'Browse available art products with optional filters (type, tags, price, availability)',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Filter by product type: Drawing, Illustration, or Print',
          },
          tag: {
            type: 'string',
            description: 'Filter by tag (e.g., original, ink, figurative)',
          },
          minPrice: {
            type: 'number',
            description: 'Minimum price in USD',
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price in USD',
          },
          available: {
            type: 'boolean',
            description: 'Only show available items',
          },
        },
      },
    },
    {
      name: 'search_products',
      description: 'Search for products by keyword in title or description',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_product_details',
      description: 'Get detailed information about a specific product',
      inputSchema: {
        type: 'object',
        properties: {
          handle: {
            type: 'string',
            description: 'Product handle (e.g., seated-figure-i)',
          },
        },
        required: ['handle'],
      },
    },

    // Cart Management
    {
      name: 'create_cart_session',
      description: 'Create a new AI cart session for exploring products',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'add_to_cart',
      description: 'Add a product to a cart session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Cart session ID',
          },
          productHandle: {
            type: 'string',
            description: 'Product handle (e.g., seated-figure-i)',
          },
          quantity: {
            type: 'number',
            description: 'Quantity to add (default: 1)',
            default: 1,
          },
        },
        required: ['sessionId', 'productHandle'],
      },
    },
    {
      name: 'view_cart',
      description: 'View contents of a cart session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Cart session ID',
          },
        },
        required: ['sessionId'],
      },
    },
    {
      name: 'remove_from_cart',
      description: 'Remove an item from a cart session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Cart session ID',
          },
          lineItemId: {
            type: 'string',
            description: 'Line item ID to remove',
          },
        },
        required: ['sessionId', 'lineItemId'],
      },
    },

    // Store Information
    {
      name: 'get_store_info',
      description: 'Get store information including artist bio, shipping, returns, and contact',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_product_types',
      description: 'Get list of product types available in store with counts',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_available_tags',
      description: 'Get list of all tags used in the product catalog',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },

    // Custom Requests
    {
      name: 'submit_commission_inquiry',
      description: 'Submit a custom commission request',
      inputSchema: {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
            description: 'Brief description of the commission',
          },
          details: {
            type: 'string',
            description: 'Detailed description of what you want commissioned',
          },
          budget: {
            type: 'string',
            description: 'Budget range if known (e.g., "$500-$1000")',
          },
          deadline: {
            type: 'string',
            description: 'Desired completion date if any',
          },
          contactInfo: {
            type: 'string',
            description: 'Your name and email if you want a response',
          },
        },
        required: ['subject', 'details'],
      },
    },
    {
      name: 'get_contact_info',
      description: 'Get artist contact information and commission process',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ]
}

/**
 * Route tool calls to appropriate handlers
 */
export async function handleToolCall(toolName, args, dataStore) {
  try {
    switch (toolName) {
      // Product Discovery
      case 'list_products':
        return await handleListProducts(args, dataStore)
      case 'search_products':
        return await handleSearchProducts(args, dataStore)
      case 'get_product_details':
        return await handleGetProductDetails(args, dataStore)

      // Cart Management
      case 'create_cart_session':
        return await handleCreateCartSession(dataStore)
      case 'add_to_cart':
        return await handleAddToCart(args, dataStore)
      case 'view_cart':
        return await handleViewCart(args, dataStore)
      case 'remove_from_cart':
        return await handleRemoveFromCart(args, dataStore)

      // Store Information
      case 'get_store_info':
        return await handleGetStoreInfo(dataStore)
      case 'get_product_types':
        return await handleGetProductTypes(dataStore)
      case 'get_available_tags':
        return await handleGetAvailableTags(dataStore)

      // Custom Requests
      case 'submit_commission_inquiry':
        return await handleSubmitCommissionInquiry(args, dataStore)
      case 'get_contact_info':
        return await handleGetContactInfo(dataStore)

      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  } catch (error) {
    throw error
  }
}

// ============================================================================
// PRODUCT DISCOVERY HANDLERS
// ============================================================================

async function handleListProducts(args, dataStore) {
  const products = await dataStore.getProducts(args)
  return formatProductList(products)
}

async function handleSearchProducts(args, dataStore) {
  const results = await dataStore.searchProducts(args.query)
  return results.length === 0 ? `No products found matching "${args.query}"` : formatProductList(results)
}

async function handleGetProductDetails(args, dataStore) {
  const product = await dataStore.getProductByHandle(args.handle)
  return product ? formatProductDetail(product) : `Product not found: ${args.handle}`
}

// ============================================================================
// CART MANAGEMENT HANDLERS
// ============================================================================

async function handleCreateCartSession(dataStore) {
  const sessionId = uuidv4()
  const cart = await dataStore.createCart(sessionId)
  return formatCartSession(cart)
}

async function handleAddToCart(args, dataStore) {
  try {
    const cart = await dataStore.addToCart(args.sessionId, args.productHandle, args.quantity || 1)
    return formatAddedToCart(cart, args.productHandle, args.quantity || 1)
  } catch (error) {
    throw error
  }
}

async function handleViewCart(args, dataStore) {
  try {
    const cart = await dataStore.getCart(args.sessionId)
    return cart ? formatCartDetails(cart) : `Cart not found: ${args.sessionId}`
  } catch (error) {
    throw error
  }
}

async function handleRemoveFromCart(args, dataStore) {
  try {
    const cart = await dataStore.removeFromCart(args.sessionId, args.lineItemId)
    return formatCartDetails(cart)
  } catch (error) {
    throw error
  }
}

// ============================================================================
// STORE INFORMATION HANDLERS
// ============================================================================

async function handleGetStoreInfo(dataStore) {
  return formatStoreInfo()
}

async function handleGetProductTypes(dataStore) {
  const types = await dataStore.getProductTypes()
  return formatProductTypes(types)
}

async function handleGetAvailableTags(dataStore) {
  const tags = await dataStore.getAvailableTags()
  return formatAvailableTags(tags)
}

// ============================================================================
// CUSTOM REQUEST HANDLERS
// ============================================================================

async function handleSubmitCommissionInquiry(args, dataStore) {
  try {
    const saved = await dataStore.addInquiry({
      type: 'commission',
      subject: args.subject,
      details: args.details,
      budget: args.budget,
      deadline: args.deadline,
      contactInfo: args.contactInfo,
      submittedAt: new Date().toISOString(),
    })
    return formatCommissionConfirmation(saved)
  } catch (error) {
    throw error
  }
}

async function handleGetContactInfo(dataStore) {
  return formatContactInfo()
}
