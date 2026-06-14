/**
 * stdio transport for MCP server
 * Enables local integration with Claude Code via stdio
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

export async function createStdioTransport() {
  return new StdioServerTransport()
}
