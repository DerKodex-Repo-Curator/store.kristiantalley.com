/**
 * Stripe Checkout — creates a hosted checkout session from cart line items.
 *
 * Prices are NOT trusted from the client: the cart sends product handles and
 * quantities, and we look up the authoritative price/title/image from our own
 * product catalog before building the Stripe session. This prevents a tampered
 * client from setting its own prices.
 */

import Stripe from 'stripe'
import { config, isStripeConfigured } from './config.js'

let stripeClient = null
function getStripe() {
  if (!stripeClient) {
    if (!isStripeConfigured()) throw new Error('Stripe is not configured (missing STRIPE_SECRET_KEY)')
    stripeClient = new Stripe(config.stripe.secretKey)
  }
  return stripeClient
}

/**
 * Build a Stripe Checkout Session from cart items and return its URL.
 * @param {Array<{handle?: string, quantity?: number}>} items
 * @param {object} dataStore - used to resolve authoritative product data
 * @returns {Promise<string>} hosted checkout URL
 */
export async function createCheckoutSession(items, dataStore) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty')
  }

  const lineItems = []
  for (const item of items) {
    const handle = item.handle
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1)
    if (!handle) throw new Error('Each cart item needs a product handle')

    const product = await dataStore.getProductByHandle(handle)
    if (!product) throw new Error(`Unknown product: ${handle}`)
    if (product.available === false) throw new Error(`"${product.title}" is no longer available`)

    const amount = Math.round(parseFloat(product.price) * 100)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid price for ${handle}`)
    }

    lineItems.push({
      quantity,
      price_data: {
        currency: config.stripe.currency,
        unit_amount: amount,
        product_data: {
          name: product.title,
          images: product.image ? [product.image] : [],
          metadata: { handle },
        },
      },
    })
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    billing_address_collection: 'auto',
    shipping_address_collection: { allowed_countries: config.stripe.shippingCountries },
    phone_number_collection: { enabled: true },
    success_url: `${config.stripe.siteUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.siteUrl}/?checkout=cancelled`,
  })

  return session.url
}

/**
 * Verify and handle a Stripe webhook. On `checkout.session.completed` we record
 * a durable order (item list, amount, buyer, shipping address) — this, not the
 * browser redirect, is the authoritative signal that money changed hands.
 * @param {string|Buffer} rawBody - the EXACT request body (needed for signature verification)
 * @param {string} signature - the `stripe-signature` header
 * @param {object} dataStore
 */
export async function handleStripeWebhook(rawBody, signature, dataStore) {
  const stripe = getStripe()
  if (!config.stripe.webhookSecret) {
    throw new Error('Webhook not configured (missing STRIPE_WEBHOOK_SECRET)')
  }

  // Throws if the signature is invalid — that's the security boundary.
  const event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })

    const order = {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: (session.amount_total ?? 0) / 100,
      currency: session.currency,
      email: session.customer_details?.email || null,
      phone: session.customer_details?.phone || null,
      shipping: session.shipping_details || session.customer_details?.address || null,
      items: lineItems.data.map((li) => ({
        title: li.description,
        quantity: li.quantity,
        amount: (li.amount_total ?? 0) / 100,
      })),
      createdAt: new Date((session.created || Date.now() / 1000) * 1000).toISOString(),
    }

    const saved = await dataStore.addOrder(order)
    const itemSummary = order.items.map((i) => `${i.quantity}× ${i.title}`).join(', ')
    console.error(
      `🧾 ORDER PAID — $${order.amountTotal} ${(order.currency || '').toUpperCase()} | ${order.email} | ${itemSummary}`
    )
    return { received: true, recorded: Boolean(saved) }
  }

  return { received: true }
}
