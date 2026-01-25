/**
 * Cart management tools
 * Provides cart session management for AI exploration
 */

import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const CreateCartSchema = z.object({})

const AddToCartSchema = z.object({
  productHandle: z.string().min(1).describe('Product handle (e.g., seated-figure-i)'),
  quantity: z.number().int().min(1).default(1).describe('Quantity to add'),
})

const ViewCartSchema = z.object({
  sessionId: z.string().min(1).describe('Cart session ID'),
})

const RemoveFromCartSchema = z.object({
  sessionId: z.string().min(1).describe('Cart session ID'),
  lineItemId: z.string().min(1).describe('Line item ID to remove'),
})

/**
 * Register cart tools with MCP server
 */
export function registerCartTools(server, dataStore) {
  // Tool 4: Create cart session
  server.tool(
    'create_cart_session',
    'Create a new AI cart session for exploring products',
    CreateCartSchema,
    async () => {
      const sessionId = uuidv4()
      const cart = await dataStore.createCart(sessionId)

      return {
        content: [
          {
            type: 'text',
            text: formatCartSession(cart),
          },
        ],
      }
    }
  )

  // Tool 5: Add to cart
  server.tool(
    'add_to_cart',
    'Add a product to a cart session',
    AddToCartSchema,
    async (args) => {
      const { productHandle, quantity } = args

      // Extract sessionId from context if available, otherwise create new session
      let sessionId = args.sessionId
      if (!sessionId) {
        sessionId = uuidv4()
      }

      try {
        const cart = await dataStore.addToCart(sessionId, productHandle, quantity)
        return {
          content: [
            {
              type: 'text',
              text: formatAddedToCart(cart, productHandle, quantity),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error adding to cart: ${error.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 6: View cart
  server.tool(
    'view_cart',
    'View contents of a cart session',
    ViewCartSchema,
    async ({ sessionId }) => {
      try {
        const cart = await dataStore.getCart(sessionId)

        if (!cart) {
          return {
            content: [
              {
                type: 'text',
                text: `Cart not found: ${sessionId}`,
              },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: formatCartDetails(cart),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error viewing cart: ${error.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 7: Remove from cart
  server.tool(
    'remove_from_cart',
    'Remove an item from a cart session',
    RemoveFromCartSchema,
    async ({ sessionId, lineItemId }) => {
      try {
        const cart = await dataStore.removeFromCart(sessionId, lineItemId)

        return {
          content: [
            {
              type: 'text',
              text: formatCartDetails(cart),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error removing from cart: ${error.message}`,
            },
          ],
        }
      }
    }
  )
}

/**
 * Format cart session info
 */
function formatCartSession(cart) {
  return `✅ Cart session created
Session ID: ${cart.id}
Created: ${new Date(cart.createdAt).toLocaleString()}

Use this session ID to add items:
  add_to_cart with sessionId: ${cart.id}`
}

/**
 * Format addition confirmation
 */
function formatAddedToCart(cart, productHandle, quantity) {
  const item = cart.items.find((i) => i.handle === productHandle)
  return `✅ Added ${quantity}x ${item.title} to cart
Session: ${cart.id}
Current cart total: $${calculateTotal(cart).toFixed(2)}`
}

/**
 * Format detailed cart information
 */
function formatCartDetails(cart) {
  if (cart.items.length === 0) {
    return `🛒 Cart ${cart.id} is empty

Session ID: ${cart.id}
Created: ${new Date(cart.createdAt).toLocaleString()}
Updated: ${new Date(cart.updatedAt).toLocaleString()}`
  }

  const total = calculateTotal(cart)
  const itemsList = cart.items
    .map(
      (item, idx) => `  ${idx + 1}. ${item.title}
     Qty: ${item.quantity} × $${item.price} = $${(parseFloat(item.price) * item.quantity).toFixed(2)}
     ID: ${item.id}`
    )
    .join('\n')

  return `🛒 Cart ${cart.id}

Items:
${itemsList}

Total: $${total.toFixed(2)}
Created: ${new Date(cart.createdAt).toLocaleString()}
Updated: ${new Date(cart.updatedAt).toLocaleString()}`
}

/**
 * Calculate cart total
 */
function calculateTotal(cart) {
  return cart.items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity
  }, 0)
}
