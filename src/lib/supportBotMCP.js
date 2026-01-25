/**
 * Support Bot MCP Bridge
 * Bridges LLM responses to MCP UI components
 * Detects user intent and routes to appropriate interactive component
 */

export const SUGGESTED_QUESTIONS = [
  'Show me all drawings',
  'What portrait pieces do you have?',
  'I want to commission a portrait',
  'Tell me about shipping',
  'What are your prices?',
]

// Intent types
const INTENTS = {
  PRODUCT_BROWSE: 'PRODUCT_BROWSE',
  PRODUCT_SEARCH: 'PRODUCT_SEARCH',
  PRODUCT_DETAILS: 'PRODUCT_DETAILS',
  SHOPPING: 'SHOPPING',
  COMMISSION: 'COMMISSION',
  STORE_INFO: 'STORE_INFO',
  GENERAL: 'GENERAL',
}

/**
 * Detect intent from user message
 */
function detectIntent(message) {
  const msg = message.toLowerCase()

  // Commission intent
  if (
    msg.includes('commission') ||
    msg.includes('custom') ||
    msg.includes('order') ||
    msg.includes('create')
  ) {
    return INTENTS.COMMISSION
  }

  // Shopping intent
  if (msg.includes('add to cart') || msg.includes('buy') || msg.includes('purchase')) {
    return INTENTS.SHOPPING
  }

  // Store info intent
  if (
    msg.includes('shipping') ||
    msg.includes('return') ||
    msg.includes('policy') ||
    msg.includes('price') ||
    msg.includes('cost') ||
    msg.includes('hours') ||
    msg.includes('contact')
  ) {
    return INTENTS.STORE_INFO
  }

  // Specific product detail intent
  if (msg.includes('details') || msg.includes('about this') || msg.includes('more about')) {
    return INTENTS.PRODUCT_DETAILS
  }

  // Search intent
  if (msg.includes('search') || msg.includes('find') || msg.includes('look for')) {
    return INTENTS.PRODUCT_SEARCH
  }

  // Browse intent (show, display, available, etc.)
  if (
    msg.includes('show') ||
    msg.includes('display') ||
    msg.includes('have') ||
    msg.includes('available') ||
    msg.includes('drawing') ||
    msg.includes('portrait') ||
    msg.includes('illustration') ||
    msg.includes('product') ||
    msg.includes('artwork')
  ) {
    return INTENTS.PRODUCT_BROWSE
  }

  return INTENTS.GENERAL
}

/**
 * Get component intent based on detected intent
 */
function getComponentIntent(intent, message) {
  const componentIntentMap = {
    [INTENTS.PRODUCT_BROWSE]: {
      type: 'PRODUCT_BROWSE',
      view: 'products',
    },
    [INTENTS.PRODUCT_SEARCH]: {
      type: 'PRODUCT_SEARCH',
      view: 'products',
    },
    [INTENTS.PRODUCT_DETAILS]: {
      type: 'PRODUCT_DETAILS',
      view: 'product-detail',
    },
    [INTENTS.SHOPPING]: {
      type: 'SHOPPING',
      view: 'cart',
    },
    [INTENTS.COMMISSION]: {
      type: 'COMMISSION',
      view: 'commission',
    },
    [INTENTS.STORE_INFO]: {
      type: 'STORE_INFO',
      view: 'store-info',
    },
    [INTENTS.GENERAL]: null,
  }

  return componentIntentMap[intent] || null
}

/**
 * Get suggested actions based on current context
 */
function getSuggestedActions(intent) {
  const actionMap = {
    [INTENTS.PRODUCT_BROWSE]: [
      { text: 'View Details', intent: INTENTS.PRODUCT_DETAILS },
      { text: 'Add to Cart', intent: INTENTS.SHOPPING },
      { text: 'Request Commission', intent: INTENTS.COMMISSION },
    ],
    [INTENTS.PRODUCT_SEARCH]: [
      { text: 'Browse All', intent: INTENTS.PRODUCT_BROWSE },
      { text: 'Filter Products', intent: INTENTS.PRODUCT_BROWSE },
    ],
    [INTENTS.SHOPPING]: [
      { text: 'Continue Shopping', intent: INTENTS.PRODUCT_BROWSE },
      { text: 'Checkout', intent: INTENTS.SHOPPING },
    ],
    [INTENTS.COMMISSION]: [
      { text: 'Browse Existing Work', intent: INTENTS.PRODUCT_BROWSE },
      { text: 'View Policies', intent: INTENTS.STORE_INFO },
    ],
    [INTENTS.STORE_INFO]: [
      { text: 'Browse Products', intent: INTENTS.PRODUCT_BROWSE },
      { text: 'Contact Artist', intent: INTENTS.GENERAL },
    ],
  }

  return actionMap[intent] || []
}

/**
 * Main chat function - processes user message and returns response with optional component
 */
export async function chatWithMCP(userMessage, previousMessages = []) {
  // Detect user intent
  const intent = detectIntent(userMessage)

  // Get component intent
  const componentIntent = getComponentIntent(intent, userMessage)

  // Generate response text
  let responseText = ''
  const timestamp = new Date().toISOString()

  switch (intent) {
    case INTENTS.PRODUCT_BROWSE:
      responseText = `I'll show you our available artwork. Here's a grid of all our current pieces. You can click on any artwork to see full details, or use the filters to narrow down by type or tags.`
      break

    case INTENTS.PRODUCT_SEARCH:
      responseText = `Let me search for that. I'm filtering our collection to find what you're looking for.`
      break

    case INTENTS.PRODUCT_DETAILS:
      responseText = `Here are the full details for this piece, including dimensions, medium, and pricing information.`
      break

    case INTENTS.SHOPPING:
      responseText = `Here's your shopping cart. You can review items, adjust quantities, or proceed to checkout when you're ready.`
      break

    case INTENTS.COMMISSION:
      responseText = `I'd love to help you start a commission project. Please fill out the form below with your project details and requirements. Kristian will review your inquiry and get back to you within 24 hours.`
      break

    case INTENTS.STORE_INFO:
      responseText = `Here's information about the KTT Art Store, including shipping policies, return options, pricing information, and how to contact Kristian directly.`
      break

    case INTENTS.GENERAL:
    default:
      responseText = `I'm here to help! You can ask me about available artwork, request details about specific pieces, inquire about commissions, or learn about shipping and policies. What would you like to know?`
      break
  }

  // Determine if we should show a component
  const shouldShowComponent = componentIntent !== null

  return {
    text: responseText,
    intent,
    componentIntent,
    shouldShowComponent,
    timestamp,
    suggestedActions: getSuggestedActions(intent),
  }
}

/**
 * Format message for display
 */
export function formatMessage(message) {
  return {
    role: message.role || 'assistant',
    content: message.content || '',
    timestamp: message.timestamp || new Date().toISOString(),
  }
}
