/**
 * KTT Store Support Bot
 * LLM-powered assistant using Ollama API at YOUR_MCP_DOMAIN
 */

const OLLAMA_URL = 'https://YOUR_MCP_DOMAIN'
const MODEL = 'incept5/llama3.1-claude:latest'
const REQUEST_TIMEOUT = 30000

/**
 * System prompt providing context about the artist and store
 */
const SYSTEM_CONTEXT = `You are a helpful, professional support assistant for KTT (Kristian Talley), an artist who sells original drawings, illustrations, and prints.

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

TONE:
- Be helpful, concise, and professional
- Match the minimal, understated aesthetic of the site
- Keep responses brief (2-4 sentences when possible)
- If you don't know something, say so and suggest contacting via email
- Never make up information about specific artwork or prices not mentioned above`

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
  // Build the full prompt with conversation history
  let prompt = SYSTEM_CONTEXT + '\n\n'

  // Add conversation history (last 6 messages for context)
  const recentHistory = conversationHistory.slice(-6)
  if (recentHistory.length > 0) {
    prompt += 'CONVERSATION HISTORY:\n'
    recentHistory.forEach((msg) => {
      const role = msg.role === 'user' ? 'Customer' : 'Assistant'
      prompt += `${role}: ${msg.content}\n`
    })
    prompt += '\n'
  }

  prompt += `Customer: ${userMessage}\n\nAssistant:`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          num_predict: 200,
          temperature: 0.7,
          top_p: 0.9,
          stop: ['\n\nCustomer:', '\n\nAssistant:', 'Customer:', '\n\n'],
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const botResponse = data.response?.trim() || ''

    // Clean up the response
    return cleanResponse(botResponse) || getFallbackResponse(userMessage)
  } catch (error) {
    console.error('[SupportBot] Chat error:', error.message)
    return getFallbackResponse(userMessage)
  }
}

/**
 * Clean up the bot response
 */
function cleanResponse(text) {
  if (!text) return null

  let cleaned = text.trim()

  // Remove any leftover role prefixes
  cleaned = cleaned.replace(/^(Assistant|Bot|Support):\s*/i, '')

  // Remove quotes if the whole response is quoted
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1)
  }

  // Limit length
  if (cleaned.length > 500) {
    cleaned = cleaned.slice(0, 500) + '...'
  }

  return cleaned.length > 0 ? cleaned : null
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
