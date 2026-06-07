/**
 * KTT Store Support Bot
 * LLM-powered assistant using Ollama API at YOUR_MCP_DOMAIN
 * Uses Qwen 3.6 with tool calling capabilities
 */

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
- Original drawings (pen and ink, typically $300-$650)
- Illustrations (mixed media, typically $350-$650)
- Limited edition prints (giclée on archival paper, typically $150-$250)
- Most originals are one-of-a-kind pieces
- Dimensions vary, typically 5"x5" to 11"x14"
- Mediums include: pen and ink, India ink, ink and watercolor, ink and wash

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
- Cart/shopping → use create_cart_session, add_to_cart, view_cart
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
 * Execute a tool call via MCP server
 */
async function executeToolCall(toolName, toolArgs) {
  const MCP_BASE = import.meta.env.VITE_MCP_TOOLS_URL || `${OLLAMA_URL}/mcp`
  const MCP_ENDPOINT = `${MCP_BASE}/store`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        id: Date.now(),
        params: {
          name: toolName,
          arguments: toolArgs,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`MCP tool error: ${response.status}`)
    }

    const data = await response.json()
    return data.result?.content?.[0]?.text || 'Tool executed successfully'
  } catch (error) {
    console.error(`[SupportBot] Tool call failed for ${toolName}:`, error.message)
    return `Sorry, I couldn't execute that tool call. Please try again or contact talleykristian@gmail.com.`
  }
}

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
 * Send a message to the support bot and get a response
 * @param {string} userMessage - The user's question
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} Bot response
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

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

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

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.message

    // Handle tool calls if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = []

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name
        const toolArgs = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments || '{}')
          : toolCall.function.arguments || {}

        const result = await executeToolCall(toolName, toolArgs)
        toolResults.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        })
      }

      // Send tool results back to get final response
      const followUpMessages = [
        ...messages,
        assistantMessage,
        ...toolResults,
      ]

      const followUpResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: followUpMessages,
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

      if (!followUpResponse.ok) {
        throw new Error(`Follow-up API error: ${followUpResponse.status}`)
      }

      const followUpData = await followUpResponse.json()
      return followUpData.message?.content || getFallbackResponse(userMessage)
    }

    // No tool calls - return direct response
    return assistantMessage?.content || getFallbackResponse(userMessage)
  } catch (error) {
    console.error('[SupportBot] Chat error:', error.message)
    return getFallbackResponse(userMessage)
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
