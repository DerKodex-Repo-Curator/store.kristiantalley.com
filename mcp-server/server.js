#!/usr/bin/env node
/**
 * MCP Server for KTT Art Store
 *
 * Exposes the art ecommerce store to AI tools via Model Context Protocol
 * Supports both local (stdio) and remote (HTTP) transports
 *
 * Usage:
 *   node server.js --transport=stdio        # Local Claude Code integration
 *   node server.js --transport=http --port=3001  # Remote HTTP endpoint
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { createStdioTransport } from './transports/stdio.js'
import { config } from './config.js'
import { createDataStore } from './data/store.js'
import { buildToolDefinitions, handleToolCall } from './tools/index.js'

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = {
    transport: 'stdio',
    port: 3001,
  }

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--transport=')) {
      args.transport = arg.split('=')[1]
    }
    if (arg.startsWith('--port=')) {
      args.port = parseInt(arg.split('=')[1], 10)
    }
  })

  return args
}

/**
 * Initialize and start MCP server
 */
async function main() {
  const args = parseArgs()
  config.transport = args.transport
  config.port = args.port

  console.error('🚀 Starting KTT Store MCP Server')
  console.error(`📡 Transport: ${config.transport}`)
  console.error(`📂 Data source: ${config.dataSource}`)

  // Initialize data store
  const dataStore = createDataStore()
  console.error('💾 Data store initialized')

  // Build tool definitions
  const toolDefinitions = buildToolDefinitions()
  console.error('🔧 Tools registered: 12 total')
  console.error('   Product Discovery: list_products, search_products, get_product_details')
  console.error('   Cart Management: create_cart_session, add_to_cart, view_cart, remove_from_cart')
  console.error('   Store Info: get_store_info, get_product_types, get_available_tags')
  console.error('   Custom Requests: submit_commission_inquiry, get_contact_info')

  // Set up transport
  if (config.transport === 'stdio') {
    // Create MCP server for stdio transport
    const server = new Server(
      {
        name: 'ktt-store',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    // Handle ListTools requests
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: toolDefinitions }
    })

    // Handle CallTool requests
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await handleToolCall(request.params.name, request.params.arguments || {}, dataStore)
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        }
      }
    })

    // Connect server to stdio transport and start
    const transport = await createStdioTransport()
    await server.connect(transport)
    console.error('✅ stdio transport ready for Claude Code')
    console.error('✅ MCP Server started successfully')
    console.error('📡 Listening for requests...')
  } else if (config.transport === 'http') {
    // For HTTP transport, handle MCP requests directly
    import('http').then(async (http) => {
      const server = http.createServer(async (req, res) => {
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

      server.listen(config.port, () => {
        console.error(`✅ HTTP server listening on port ${config.port}`)
        console.error(`📍 Endpoint: http://localhost:${config.port}/mcp/store`)
        console.error(`📍 Tools list: http://localhost:${config.port}/mcp/tools`)
        console.error('✅ HTTP transport ready for remote access')
        console.error('✅ MCP Server started successfully')
        console.error('📡 Listening for requests...')
      })

      server.on('error', (error) => {
        console.error('❌ HTTP server error:', error)
        process.exit(1)
      })
    })
  } else {
    console.error(`❌ Unknown transport: ${config.transport}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
