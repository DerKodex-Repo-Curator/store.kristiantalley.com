/**
 * HTTP transport for MCP server
 * Enables remote access via HTTP/HTTPS
 * Uses SSE (Server-Sent Events) for streaming responses
 */

import http from 'http'
import { config } from '../config.js'
import { createDataStore } from '../data/store.js'
import { handleToolCall } from '../tools/index.js'

/**
 * Create HTTP transport for MCP
 * Implements simple HTTP server with MCP protocol support
 */
export async function createHttpTransport(server) {
  // Initialize data store for HTTP transport
  const dataStore = createDataStore()

  return new Promise((resolve, reject) => {
    const httpServer = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      // Handle preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      // MCP endpoint
      if (req.method === 'POST' && req.url === '/mcp/store') {
        let body = ''

        req.on('data', (chunk) => {
          body += chunk.toString()
        })

        req.on('end', async () => {
          try {
            const request = JSON.parse(body)

            // Extract tool name and arguments from MCP request
            const toolName = request.params?.name
            const toolArgs = request.params?.arguments || {}

            if (!toolName) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                error: { code: -32600, message: 'Invalid request: missing tool name' }
              }))
              return
            }

            // Process the tool call
            const result = await handleToolCall(toolName, toolArgs, dataStore)

            // Send MCP response
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: result }]
              }
            }))
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: 0,
              error: { code: -32603, message: error.message }
            }))
          }
        })

        return
      }

      // MCP tools list endpoint
      if (req.method === 'GET' && req.url === '/mcp/tools') {
        const toolDefinitions = [
          {
            name: 'list_products',
            description: 'Browse available art products with optional filters (type, tags, price, availability)',
            inputSchema: {
              type: 'object',
              properties: {
                type: { type: 'string', description: 'Filter by product type: Drawing, Illustration, or Print' },
                tag: { type: 'string', description: 'Filter by tag (e.g., original, ink, figurative)' },
                minPrice: { type: 'number', description: 'Minimum price in USD' },
                maxPrice: { type: 'number', description: 'Maximum price in USD' },
                available: { type: 'boolean', description: 'Only show available items' },
              },
            },
          },
          {
            name: 'search_products',
            description: 'Search for products by keyword in title or description',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
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
                handle: { type: 'string', description: 'Product handle (e.g., seated-figure-i)' },
              },
              required: ['handle'],
            },
          },
          {
            name: 'create_cart_session',
            description: 'Create a new AI cart session for exploring products',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'add_to_cart',
            description: 'Add a product to a cart session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Cart session ID' },
                productHandle: { type: 'string', description: 'Product handle (e.g., seated-figure-i)' },
                quantity: { type: 'number', description: 'Quantity to add (default: 1)', default: 1 },
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
                sessionId: { type: 'string', description: 'Cart session ID' },
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
                sessionId: { type: 'string', description: 'Cart session ID' },
                lineItemId: { type: 'string', description: 'Line item ID to remove' },
              },
              required: ['sessionId', 'lineItemId'],
            },
          },
          {
            name: 'get_store_info',
            description: 'Get store information including artist bio, shipping, returns, and contact',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'get_product_types',
            description: 'Get list of product types available in store with counts',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'get_available_tags',
            description: 'Get list of all tags used in the product catalog',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'submit_commission_inquiry',
            description: 'Submit a custom commission request',
            inputSchema: {
              type: 'object',
              properties: {
                subject: { type: 'string', description: 'Brief description of the commission' },
                details: { type: 'string', description: 'Detailed description of what you want commissioned' },
                budget: { type: 'string', description: 'Budget range if known (e.g., "$500-$1000")' },
                deadline: { type: 'string', description: 'Desired completion date if any' },
                contactInfo: { type: 'string', description: 'Your name and email if you want a response' },
              },
              required: ['subject', 'details'],
            },
          },
          {
            name: 'get_contact_info',
            description: 'Get artist contact information and commission process',
            inputSchema: { type: 'object', properties: {} },
          },
        ]

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ tools: toolDefinitions }))
        return
      }

      // Health check
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'healthy', transport: 'http' }))
        return
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    })

    httpServer.listen(config.port, () => {
      console.error(`✅ HTTP server listening on port ${config.port}`)
      console.error(`📍 Endpoint: http://localhost:${config.port}/mcp/store`)
      console.error(`📍 Tools list: http://localhost:${config.port}/mcp/tools`)
      resolve({ server: httpServer })
    })

    httpServer.on('error', reject)
  })
}

/**
 * Simple HTTP transport adapter for MCP SDK
 * (This is a placeholder - full SSE/HTTP support requires deeper MCP SDK integration)
 */
export class HttpTransport {
  constructor(server) {
    this.server = server
  }

  async connect() {
    return this
  }

  async disconnect() {
    if (this.server) {
      this.server.close()
    }
  }

  send() {
    // Implementation depends on MCP SDK patterns
  }

  receive() {
    // Implementation depends on MCP SDK patterns
  }
}
