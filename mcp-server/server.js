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
  TextContent,
  ErrorCode,
  McpError,
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

  // Create MCP server
  const server = new Server({
    name: 'ktt-store',
    version: '1.0.0',
  })

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

  // Set up transport
  let transport

  if (config.transport === 'stdio') {
    transport = await createStdioTransport()
    console.error('✅ stdio transport ready for Claude Code')
  } else if (config.transport === 'http') {
    console.error('⚠️  HTTP transport not yet implemented')
    process.exit(1)
  } else {
    console.error(`❌ Unknown transport: ${config.transport}`)
    process.exit(1)
  }

  // Connect server to transport and start
  await server.connect(transport)
  console.error('✅ MCP Server started successfully')

  // Keep the server running
  console.error('📡 Listening for requests...')
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
