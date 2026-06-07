/**
 * KTT Store Support Bot
 * LLM-powered assistant using Ollama API at YOUR_MCP_DOMAIN
 * Uses Qwen 3.6 with tool calling capabilities
 */

import { executeToolCall, ensureCartSession } from './mcpCart'

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'https://YOUR_MCP_DOMAIN'
const MODEL = import.meta.env.VITE_MODEL || 'qwen36-opus:latest'
const MCP_BASE = import.meta.env.VITE_MCP_TOOLS_URL || `${OLLAMA_URL}/mcp`
const MCP_TOOLS_URL = `${MCP_BASE}/tools`
const REQUEST_TIMEOUT = 30000

/**
 * System prompt providing context about the artist and store
 */
const SYSTEM_PROMPT = `You are a helpful, professional support assistant for KTT (Kristian Talley), an artist who sells original drawings, illustrations, and prints.

ABOUT THE ARTIST:
- Kristian Talley is a visual artist working primarily in pen and ink, illustration, and mixed media
- Based in the United States
- Work explores themes of solitude, introspection, and the human figure
- Uses expressive linework and crosshatching techniques
- Each piece is created by hand with careful attention to craft
- Portfolio available at kristiantalley.com

PRODUCTS AVAILABLE:
- Original drawings & illustrations (pen and ink, graphite, typically $350-$550)
- Paintings (oil and acrylic on panel, watercolor; typically $375-$650)
- Sculpture (cast bronze; typically $550-$650)
- Limited edition prints (etching, linocut, silkscreen; typically $275-$325)
- Most originals are one-of-a-kind pieces
- Dimensions vary, from small studies up to large 48"x66" panels
- Always look up exact titles, prices, and availability with the tools below

SHIPPING & HANDLING:
- Free shipping on orders over $200
- Originals are carefully packaged with acid-free materials
- Prints are shipped flat in rigid mailers
- US domestic shipping: 5-7 business days
- International shipping: 2-3 weeks, additional customs fees may apply
- All originals include a certificate of authenticity
- Tracking provided for all orders

RETURNS & CARE:
- Returns accepted within 14 days if artwork arrives damaged
- Contact talleykristian@gmail.com for any issues
- Keep artwork away from direct sunlight
- Frame under glass for protection
- Handle prints by edges only

COMMISSIONS:
- Custom commissions available upon request
- Contact via email to discuss
- Pricing depends on size and complexity
- Typical turnaround: 4-8 weeks

CONTACT:
- Email: talleykristian@gmail.com
- Response time: 2-3 business days

TOOLS:
You have access to tools that let you look up real-time store information. When a user asks about:
- Specific artwork, drawings, or prints → use list_products or search_products
- Product details or pricing → use get_product_details
- Cart/shopping → call add_to_cart or view_cart directly (the cart session is created and tracked for you automatically; you do NOT need to ask for or pass a session ID)
- Checkout / pay / buy / complete order → call the checkout tool. It returns a secure Stripe payment link and the buyer is taken there. NEVER ask the user for card or payment details yourself.
- Commission process → use submit_commission_inquiry or get_contact_info
- Store information → use get_store_info or get_product_types

When using tools:
- Always call the tool to get accurate, current information
- Never make up prices, availability, or product details
- After getting tool results, summarize them naturally in your response
- If a tool call fails, acknowledge the error and offer alternatives

TONE:
- Be helpful, concise, and professional
- Match the minimal, understated aesthetic of the site
- Keep responses brief (2-4 sentences when possible)
- If you don't know something, say so and suggest contacting via email
- Never make up information about specific artwork or prices not mentioned above`

/**
 * Fetch available tools from MCP server
 */
let cachedTools = null

export async function getAvailableTools() {
  if (cachedTools) return cachedTools

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(MCP_TOOLS_URL, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn('[SupportBot] Failed to fetch MCP tools:', response.status)
      cachedTools = []
      return cachedTools
    }

    const data = await response.json()
    cachedTools = data.tools || []
    return cachedTools
  } catch (error) {
    console.warn('[SupportBot] MCP tools fetch failed:', error.message)
    cachedTools = []
    return cachedTools
  }
}

/**
 * Cart tools require a sessionId. The shared mcpCart module manages a single
 * session for the page lifetime; we auto-inject it so the model needn't track IDs.
 */
const CART_TOOLS = new Set(['add_to_cart', 'view_cart', 'remove_from_cart', 'checkout'])

/**
 * Check if LLM server is available
 */
export async function checkConnection() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn('[SupportBot] Connection check failed:', error.message)
    return false
  }
}

/**
 * Send a message to the support bot and get a response.
 * @param {string} userMessage - The user's question
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<{text: string, cartActions: Array}>} Bot response text plus
 *   any cart mutations performed, so the UI can mirror them in CartContext.
 */
export async function chat(userMessage, conversationHistory = []) {
  // Build conversation messages array
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ]

  // Fetch available tools
  const tools = await getAvailableTools()

  // Cap the number of tool rounds so a misbehaving model can't loop forever.
  // Multi-step chains (e.g. create_cart_session -> add_to_cart) need >1 round.
  const MAX_TOOL_ROUNDS = 5

  // Cart mutations the bot performs this turn, surfaced to the UI for syncing.
  const cartActions = []
  // If the bot starts checkout, this holds the Stripe URL for the UI to redirect to.
  let checkoutUrl = null
  const reply = (text) => ({ text, cartActions, checkoutUrl })

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const data = await callModel(messages, tools)
      const assistantMessage = data.message
      messages.push(assistantMessage)

      const toolCalls = assistantMessage?.tool_calls || []

      // No tool calls (or out of rounds) - return the model's text answer
      if (toolCalls.length === 0 || round === MAX_TOOL_ROUNDS) {
        return reply(assistantMessage?.content || getFallbackResponse(userMessage))
      }

      // Execute each requested tool and feed results back for the next round
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name
        const toolArgs = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments || '{}')
          : toolCall.function.arguments || {}

        // Auto-manage the cart session so the model doesn't have to track IDs
        if (CART_TOOLS.has(toolName) && !toolArgs.sessionId) {
          toolArgs.sessionId = await ensureCartSession()
        }

        const result = await executeToolCall(toolName, toolArgs)

        // Mirror successful add-to-cart calls into the on-page cart. The server
        // resolves the product name to a handle and echoes it as "Handle: <x>".
        if (toolName === 'add_to_cart') {
          const handleMatch = result.match(/Handle:\s*(\S+)/)
          if (handleMatch && /✅|added/i.test(result)) {
            cartActions.push({
              type: 'add',
              handle: handleMatch[1],
              quantity: toolArgs.quantity || 1,
            })
          }
        }

        // Capture the Stripe checkout link so the UI can redirect the buyer.
        if (toolName === 'checkout') {
          const urlMatch = result.match(/Checkout:\s*(\S+)/)
          if (urlMatch) checkoutUrl = urlMatch[1]
        }

        messages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        })
      }
    }

    return reply(getFallbackResponse(userMessage))
  } catch (error) {
    console.error('[SupportBot] Chat error:', error.message)
    return reply(getFallbackResponse(userMessage))
  }
}

/**
 * Single call to the Ollama chat API with tools enabled.
 */
async function callModel(messages, tools) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        tools,
        options: {
          num_predict: 300,
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Fallback responses when LLM is unavailable
 */
function getFallbackResponse(userMessage) {
  const lower = userMessage.toLowerCase()

  if (lower.includes('shipping') || lower.includes('delivery')) {
    return 'Shipping is free on orders over $200. US orders typically arrive in 5-7 business days. International shipping takes 2-3 weeks. All orders include tracking.'
  }

  if (lower.includes('return') || lower.includes('refund')) {
    return 'Returns are accepted within 14 days if artwork arrives damaged. Please email talleykristian@gmail.com with photos of any damage.'
  }

  if (lower.includes('commission') || lower.includes('custom')) {
    return 'Custom commissions are available. Please email talleykristian@gmail.com to discuss your project, including desired size and subject matter.'
  }

  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    return 'Original drawings range from $300-$650 depending on size. Limited edition prints are $150-$250. View the shop for specific pricing on available work.'
  }

  if (lower.includes('contact') || lower.includes('email') || lower.includes('reach')) {
    return 'You can reach me at talleykristian@gmail.com. I typically respond within 2-3 business days.'
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! How can I help you today? I can answer questions about available artwork, shipping, commissions, or the artist.'
  }

  return 'I\'m happy to help with questions about available artwork, shipping, commissions, or anything else. For specific inquiries, you can also email talleykristian@gmail.com.'
}

/**
 * Suggested questions for users
 */
export const SUGGESTED_QUESTIONS = [
  'What kind of art do you make?',
  'How much is shipping?',
  'Do you take commissions?',
  'How should I care for my artwork?',
]

export default {
  checkConnection,
  chat,
  SUGGESTED_QUESTIONS,
}
