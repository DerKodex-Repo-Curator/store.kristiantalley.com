/**
 * Output formatters for MCP tools
 * Formats tool responses for display to AI and users
 */

import { config } from '../config.js'

// ============================================================================
// PRODUCT FORMATTING
// ============================================================================

export function formatProductList(products) {
  if (products.length === 0) {
    return 'No products found'
  }

  const formatted = products
    .map(
      (p) => `
📌 ${p.title}
   Handle: ${p.handle}
   Type: ${p.productType}
   Price: $${p.price} ${p.currency}
   Available: ${p.available ? '✅' : '❌'}
   Tags: ${p.tags.join(', ')}
   Summary: ${p.description.substring(0, 100)}...`
    )
    .join('\n')

  return `Found ${products.length} product(s):\n${formatted}`
}

export function formatProductDetail(product) {
  const lines = [
    `🎨 ${product.title}`,
    `Handle: ${product.handle}`,
    `Type: ${product.productType}`,
    `Price: $${product.price} ${product.currency}`,
    `Available: ${product.available ? '✅ Yes' : '❌ No (Sold)'}`,
    `Tags: ${product.tags.join(', ')}`,
    '',
    '📝 Description:',
    product.description,
    '',
    '📐 Details:',
    `Dimensions: ${product.dimensions || 'Not specified'}`,
    `Medium: ${product.medium || 'Not specified'}`,
    `Year: ${product.year || 'Not specified'}`,
  ]

  if (product.editionSize) {
    lines.push(`Edition Size: ${product.editionSize}`)
  }

  if (product.image) {
    lines.push('', `Image: ${product.image}`)
  }

  return lines.join('\n')
}

// ============================================================================
// STORE INFO FORMATTING
// ============================================================================

export function formatStoreInfo() {
  return `🎨 KTT Art Store Information

Artist: Kristian Talley
Website: https://${config.store.domain}
Email: ${config.store.email}
Response Time: Within ${config.store.responseTimeHours} hours

About the Artist:
I create expressive pen and ink drawings, illustrations, and prints. My work
explores human figures, landscapes, and organic forms through detailed linework
and careful observation. Each piece is created with intention and care.

Product Categories:
• Original Drawings - Pen and ink on paper
• Illustrations - Mixed media works
• Prints - Limited edition giclée prints

Pricing:
Originals range from $300-$650
Prints are $150

Shipping:
• Continental US: $10-$20 depending on size
• International: Quoted individually

Returns & Exchanges:
Original artwork is final sale. Prints may be exchanged if damaged.

Commissions:
Custom commissions are available. Use submit_commission_inquiry to inquire about
custom work.`
}

export function formatProductTypes(types) {
  const entries = Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `  • ${type}: ${count} piece${count === 1 ? '' : 's'}`)
    .join('\n')

  const total = Object.values(types).reduce((a, b) => a + b, 0)

  return `📊 Product Type Breakdown

${entries}

Total: ${total} pieces available`
}

export function formatAvailableTags(tags) {
  const grouped = groupTags(tags)

  const sections = Object.entries(grouped)
    .map(([category, categoryTags]) => {
      return `${category}:\n  ${categoryTags.join(', ')}`
    })
    .join('\n\n')

  return `🏷️  Available Tags

${sections}

Browse products by tag using list_products with tag filter`
}

function groupTags(tags) {
  const groups = {
    'Medium': [],
    'Subject': [],
    'Availability': [],
    'Other': [],
  }

  tags.forEach((tag) => {
    if (['ink', 'mixed-media', 'digital'].includes(tag)) {
      groups['Medium'].push(tag)
    } else if (['figurative', 'portrait', 'landscape', 'botanical', 'abstract', 'nature', 'interior'].includes(tag)) {
      groups['Subject'].push(tag)
    } else if (['original', 'print', 'limited-edition'].includes(tag)) {
      groups['Availability'].push(tag)
    } else {
      groups['Other'].push(tag)
    }
  })

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key]
    } else {
      groups[key].sort()
    }
  })

  return groups
}

// ============================================================================
// CART FORMATTING
// ============================================================================

export function formatCartSession(cart) {
  return `✅ Cart session created
Session ID: ${cart.id}
Created: ${new Date(cart.createdAt).toLocaleString()}

Use this session ID to add items:
  add_to_cart with sessionId: ${cart.id}`
}

export function formatAddedToCart(cart, productHandle, quantity) {
  const item = cart.items.find((i) => i.handle === productHandle)
  return `✅ Added ${quantity}x ${item.title} to cart
Session: ${cart.id}
Current cart total: $${calculateTotal(cart).toFixed(2)}`
}

export function formatCartDetails(cart) {
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

function calculateTotal(cart) {
  return cart.items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity
  }, 0)
}

// ============================================================================
// COMMISSION INQUIRY FORMATTING
// ============================================================================

export function formatCommissionConfirmation(inquiry) {
  return `✅ Commission Inquiry Submitted

Inquiry ID: ${inquiry.id}
Submitted: ${new Date(inquiry.submittedAt).toLocaleString()}

Subject: ${inquiry.subject}
Details: ${inquiry.details}
${inquiry.budget ? `Budget: ${inquiry.budget}` : ''}
${inquiry.deadline ? `Deadline: ${inquiry.deadline}` : ''}

Response:
Kristian typically responds to commission inquiries within ${config.store.responseTimeHours} hours.
${inquiry.contactInfo ? `Contact info on file: ${inquiry.contactInfo}` : 'Please include your email if you want a response.'}

Next Steps:
1. Kristian will review your inquiry
2. She will contact you to discuss details
3. You'll receive a custom quote and timeline`
}

export function formatContactInfo() {
  return `📧 Contact Information

Email: ${config.store.email}
Website: https://${config.store.domain}

Response Time: Within ${config.store.responseTimeHours} hours

Social Media:
• Instagram: @kristiantalley (typically has links to latest work)
• Portfolio: https://kristiantalley.com

For Inquiries:
✉️  Commission Work: Use submit_commission_inquiry tool
📧 General Questions: Email ${config.store.email}
🛍️  Purchase Support: Check order confirmation email

Available for:
• Custom pen and ink commissions
• Illustration work
• Print requests
• Licensing inquiries

Commission Process:
1. Submit inquiry with details and budget
2. Artist responds with availability and pricing
3. Discuss design and timeline
4. 50% deposit required to start
5. Completion with remaining balance due before delivery`
}
