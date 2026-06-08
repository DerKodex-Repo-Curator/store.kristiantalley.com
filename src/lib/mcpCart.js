/**
 * MCP cart plumbing shared by the support bot and the on-page cart.
 *
 * The MCP server keeps a server-side cart per session (mcp-server/data/carts.json).
 * We manage a single session for the page lifetime. The React CartContext is the
 * source of truth; `reconcileBotCart` rewrites the MCP session to match it so the
 * bot and the visual cart drawer always agree.
 */

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || ''
const MCP_BASE = import.meta.env.VITE_MCP_TOOLS_URL || `${OLLAMA_URL}/mcp`
const MCP_ENDPOINT = `${MCP_BASE}/store`
const REQUEST_TIMEOUT = 30000

let cartSessionId = null

export function getCartSessionId() {
  return cartSessionId
}

function captureSessionId(text) {
  const match = typeof text === 'string' && text.match(/Session ID:\s*([\w-]+)/i)
  if (match) cartSessionId = match[1]
  return cartSessionId
}

/**
 * Execute a single MCP tool call over the HTTP JSON-RPC endpoint.
 * Auto-captures a session id from any result that contains one.
 */
export async function executeToolCall(toolName, toolArgs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        id: Date.now(),
        params: { name: toolName, arguments: toolArgs },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`MCP tool error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.result?.content?.[0]?.text || 'Tool executed successfully'
    captureSessionId(text)
    return text
  } catch (error) {
    console.error(`[mcpCart] Tool call failed for ${toolName}:`, error.message)
    return `Sorry, I couldn't execute that tool call. Please try again or contact talleykristian@gmail.com.`
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Ensure a cart session exists, creating one if needed. Returns the session id.
 */
export async function ensureCartSession() {
  if (cartSessionId) return cartSessionId
  const result = await executeToolCall('create_cart_session', {})
  return captureSessionId(result)
}

/**
 * Read all line-item ids from the current session's cart.
 */
async function getLineItemIds() {
  if (!cartSessionId) return []
  const text = await executeToolCall('view_cart', { sessionId: cartSessionId })
  // Match only line-item "ID:" lines, not the "Session ID:" line in empty carts
  return [...text.matchAll(/^\s*ID:\s*(\S+)/gm)].map((m) => m[1])
}

/**
 * Remove every item from the current MCP session.
 */
async function clearBotCart() {
  if (!cartSessionId) return
  const ids = await getLineItemIds()
  for (const id of ids) {
    await executeToolCall('remove_from_cart', { sessionId: cartSessionId, lineItemId: id })
  }
}

// Serialize reconciles so rapid cart edits can't interleave clear/add calls.
let syncChain = Promise.resolve()

async function doReconcile(items) {
  // Nothing to do, and no session to clean up
  if (!cartSessionId && items.length === 0) return

  const sid = await ensureCartSession()
  if (!sid) return

  await clearBotCart()
  for (const item of items) {
    await executeToolCall('add_to_cart', {
      sessionId: sid,
      productHandle: item.handle,
      quantity: item.quantity,
    })
  }
}

/**
 * Rewrite the MCP cart session to exactly match the given React cart items
 * (each `{ handle, quantity }`). Calls are serialized; safe to fire-and-forget.
 */
export function reconcileBotCart(items) {
  const snapshot = items.map((i) => ({ handle: i.handle, quantity: i.quantity }))
  syncChain = syncChain
    .then(() => doReconcile(snapshot))
    .catch((e) => console.warn('[mcpCart] reconcile failed:', e.message))
  return syncChain
}
