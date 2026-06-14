/**
 * MCP Client - HTML Generator for Rich Interactive Components
 * Zero external dependencies, pure HTML + CSS + event delegation
 * Follows Shopify MCP UI conventions with intent-based architecture
 */

// Shared CSS styles for all components
const SHARED_STYLES = `
  * {
    box-sizing: border-box;
  }

  .mcp-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
    margin: 0;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Grid and Layout */
  .mcp-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    padding: 1.5rem;
  }

  @media (max-width: 640px) {
    .mcp-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }
  }

  /* Product Card */
  .mcp-product-card {
    border: 1px solid #e5e5e5;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .mcp-product-card:hover {
    border-color: #000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .mcp-product-image {
    width: 100%;
    height: 280px;
    object-fit: cover;
    display: block;
    background: #f5f5f5;
  }

  .mcp-product-info {
    padding: 1rem;
  }

  .mcp-product-title {
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .mcp-product-type {
    font-size: 0.75rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .mcp-product-price {
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .mcp-product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .mcp-tag {
    font-size: 0.75rem;
    background: #f5f5f5;
    padding: 0.25rem 0.5rem;
    border: 1px solid #e5e5e5;
  }

  .mcp-button {
    padding: 0.75rem 1.5rem;
    background: #000;
    color: #fff;
    border: 1px solid #000;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mcp-button:hover:not(:disabled) {
    background: #fff;
    color: #000;
  }

  .mcp-button-secondary {
    background: #f5f5f5;
    color: #000;
    border: 1px solid #e5e5e5;
  }

  .mcp-button-secondary:hover:not(:disabled) {
    background: #000;
    color: #fff;
    border-color: #000;
  }

  /* Detail View */
  .mcp-detail-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .mcp-detail-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  .mcp-detail-image {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
    background: #f5f5f5;
  }

  .mcp-detail-info h2 {
    font-size: 1.75rem;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
  }

  .mcp-detail-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 1.5rem;
    padding: 1.5rem 0;
    border-top: 1px solid #e5e5e5;
    border-bottom: 1px solid #e5e5e5;
  }

  .mcp-meta-item {
    font-size: 0.875rem;
  }

  .mcp-meta-label {
    color: #999;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .mcp-meta-value {
    font-weight: 600;
    font-size: 1rem;
  }

  .mcp-detail-description {
    margin-top: 1.5rem;
    font-size: 0.95rem;
    line-height: 1.7;
  }

  .mcp-detail-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }

  .mcp-detail-actions button {
    flex: 1;
  }

  /* Cart */
  .mcp-cart-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .mcp-cart-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #999;
  }

  .mcp-cart-items {
    border-top: 1px solid #e5e5e5;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 1.5rem;
  }

  .mcp-cart-item {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e5e5;
    align-items: start;
  }

  .mcp-cart-item:last-child {
    border-bottom: none;
  }

  .mcp-cart-item-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    background: #f5f5f5;
  }

  .mcp-cart-item-details h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .mcp-cart-item-details p {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: #999;
  }

  .mcp-cart-item-quantity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .mcp-quantity-btn {
    width: 24px;
    height: 24px;
    border: 1px solid #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
  }

  .mcp-cart-item-price {
    text-align: right;
    font-weight: 600;
  }

  .mcp-cart-summary {
    margin-bottom: 1.5rem;
  }

  .mcp-summary-line {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
  }

  .mcp-summary-total {
    display: flex;
    justify-content: space-between;
    padding: 1rem 0;
    border-top: 2px solid #000;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .mcp-cart-actions {
    display: flex;
    gap: 1rem;
    flex-direction: column;
  }

  .mcp-cart-actions button {
    padding: 1rem;
    font-size: 1rem;
    width: 100%;
  }

  /* Forms */
  .mcp-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }

  .mcp-form-group {
    margin-bottom: 1.5rem;
  }

  .mcp-form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .mcp-form-input,
  .mcp-form-textarea,
  .mcp-form-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e5e5e5;
    font-family: inherit;
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }

  .mcp-form-input:focus,
  .mcp-form-textarea:focus,
  .mcp-form-select:focus {
    outline: none;
    border-color: #000;
  }

  .mcp-form-textarea {
    resize: vertical;
    min-height: 120px;
  }

  .mcp-form-submit {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
  }

  /* Info Sections */
  .mcp-info-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .mcp-info-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e5e5e5;
  }

  .mcp-info-section:last-child {
    border-bottom: none;
  }

  .mcp-info-section h3 {
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
    font-weight: 600;
  }

  .mcp-info-section p {
    margin: 0.5rem 0;
    line-height: 1.7;
    font-size: 0.95rem;
  }

  .mcp-info-section ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .mcp-info-section li {
    margin-bottom: 0.5rem;
  }

  /* Filters */
  .mcp-filters-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }

  .mcp-filter-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e5e5;
  }

  .mcp-filter-section:last-child {
    border-bottom: none;
  }

  .mcp-filter-title {
    font-weight: 600;
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
  }

  .mcp-filter-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .mcp-filter-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .mcp-filter-option input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .mcp-filter-option label {
    cursor: pointer;
    flex: 1;
  }

  /* Utility */
  .mcp-section-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .mcp-spacing {
    margin: 1rem 0;
  }

  .mcp-back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    color: #000;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .mcp-back-button:hover {
    opacity: 0.7;
  }
`

/**
 * Generate product grid HTML
 */
export function generateProductGrid(products = []) {
  if (!products || products.length === 0) {
    return `
      <div class="mcp-container">
        <style>${SHARED_STYLES}</style>
        <div class="mcp-grid" style="text-align: center; padding: 2rem;">
          <p style="grid-column: 1 / -1; color: #999;">No products available</p>
        </div>
      </div>
    `
  }

  const productCards = products
    .map(
      (product) => `
    <article class="mcp-product-card" data-intent="view-product" data-product-id="${product.id}">
      <img
        src="${product.image}"
        alt="${product.title}"
        class="mcp-product-image"
      />
      <div class="mcp-product-info">
        <div class="mcp-product-type">${product.type || 'Artwork'}</div>
        <h3 class="mcp-product-title">${product.title}</h3>
        <div class="mcp-product-price">$${product.price.toFixed(2)}</div>
        ${
          product.tags && product.tags.length > 0
            ? `
          <div class="mcp-product-tags">
            ${product.tags.map((tag) => `<span class="mcp-tag">${tag}</span>`).join('')}
          </div>
        `
            : ''
        }
        <button
          class="mcp-button"
          data-intent="add-to-cart"
          data-product-id="${product.id}"
          data-quantity="1"
        >
          Add to Cart
        </button>
      </div>
    </article>
  `
    )
    .join('')

  return `
    <div class="mcp-container">
      <style>${SHARED_STYLES}</style>
      <div class="mcp-grid">
        ${productCards}
      </div>
    </div>
  `
}

/**
 * Generate product detail HTML
 */
export function generateProductDetail(product = {}) {
  if (!product || !product.id) {
    return `<div class="mcp-container" style="padding: 2rem; text-align: center;">No product selected</div>`
  }

  return `
    <div class="mcp-container">
      <style>${SHARED_STYLES}</style>
      <div style="padding: 1.5rem;">
        <button class="mcp-back-button" data-intent="back-to-products">
          ← Back to Products
        </button>
      </div>
      <div class="mcp-detail-container">
        <div>
          <img
            src="${product.image}"
            alt="${product.title}"
            class="mcp-detail-image"
          />
        </div>
        <div class="mcp-detail-info">
          <div class="mcp-product-type">${product.type || 'Artwork'}</div>
          <h2>${product.title}</h2>
          <div class="mcp-product-price" style="font-size: 1.5rem; margin: 1rem 0;">$${product.price.toFixed(2)}</div>

          ${
            product.dimensions || product.medium || product.year
              ? `
            <div class="mcp-detail-meta">
              ${product.medium ? `<div class="mcp-meta-item"><div class="mcp-meta-label">Medium</div><div class="mcp-meta-value">${product.medium}</div></div>` : ''}
              ${product.dimensions ? `<div class="mcp-meta-item"><div class="mcp-meta-label">Dimensions</div><div class="mcp-meta-value">${product.dimensions}</div></div>` : ''}
              ${product.year ? `<div class="mcp-meta-item"><div class="mcp-meta-label">Year</div><div class="mcp-meta-value">${product.year}</div></div>` : ''}
              <div class="mcp-meta-item"><div class="mcp-meta-label">Status</div><div class="mcp-meta-value">${product.available ? 'Available' : 'Sold'}</div></div>
            </div>
          `
              : ''
          }

          ${
            product.description
              ? `<div class="mcp-detail-description"><p>${product.description}</p></div>`
              : ''
          }

          <div class="mcp-detail-actions">
            <button
              class="mcp-button"
              data-intent="add-to-cart"
              data-product-id="${product.id}"
              data-quantity="1"
              ${!product.available ? 'disabled' : ''}
            >
              ${product.available ? 'Add to Cart' : 'Sold Out'}
            </button>
            <button
              class="mcp-button mcp-button-secondary"
              data-intent="view-store-info"
            >
              Contact Artist
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate shopping cart HTML
 */
export function generateCart(cartItems = [], total = 0) {
  const itemsHTML =
    cartItems.length === 0
      ? `<div class="mcp-cart-empty">Your cart is empty. <a href="#" data-intent="back-to-products" style="text-decoration: underline;">Continue shopping</a></div>`
      : `
    <div class="mcp-cart-items">
      ${cartItems
        .map(
          (item) => `
        <div class="mcp-cart-item">
          <img
            src="${item.image}"
            alt="${item.title}"
            class="mcp-cart-item-image"
          />
          <div class="mcp-cart-item-details">
            <h3>${item.title}</h3>
            <p>$${item.price.toFixed(2)} each</p>
            <div class="mcp-cart-item-quantity">
              <button class="mcp-quantity-btn" data-intent="update-quantity" data-product-id="${item.id}" data-quantity="-1">−</button>
              <span>${item.quantity}</span>
              <button class="mcp-quantity-btn" data-intent="update-quantity" data-product-id="${item.id}" data-quantity="1">+</button>
              <button style="margin-left: auto; color: #999; font-size: 0.75rem; text-decoration: underline;" data-intent="remove-from-cart" data-product-id="${item.id}">Remove</button>
            </div>
          </div>
          <div class="mcp-cart-item-price">
            $${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="mcp-cart-summary">
      <div class="mcp-summary-line">
        <span>Subtotal</span>
        <span>$${total.toFixed(2)}</span>
      </div>
      <div class="mcp-summary-line">
        <span>Shipping</span>
        <span>Calculated at checkout</span>
      </div>
      <div class="mcp-summary-total">
        <span>Total</span>
        <span>$${total.toFixed(2)}</span>
      </div>
    </div>

    <div class="mcp-cart-actions">
      <button class="mcp-button" data-intent="checkout">
        Proceed to Checkout
      </button>
      <button class="mcp-button mcp-button-secondary" data-intent="back-to-products">
        Continue Shopping
      </button>
    </div>
  `

  return `
    <div class="mcp-container">
      <style>${SHARED_STYLES}</style>
      <div class="mcp-cart-container">
        <h2 class="mcp-section-title">Shopping Cart</h2>
        ${itemsHTML}
      </div>
    </div>
  `
}

/**
 * Generate commission form HTML
 */
export function generateCommissionForm() {
  return `
    <div class="mcp-container">
      <style>${SHARED_STYLES}</style>
      <div class="mcp-form">
        <h2 class="mcp-section-title">Commission Inquiry</h2>
        <p style="text-align: center; color: #666; margin-bottom: 1.5rem;">
          Tell me about your project. I'll review your inquiry and get back to you within 24 hours.
        </p>

        <form id="commission-form">
          <div class="mcp-form-group">
            <label class="mcp-form-label">Your Name *</label>
            <input type="text" class="mcp-form-input" name="name" required />
          </div>

          <div class="mcp-form-group">
            <label class="mcp-form-label">Email Address *</label>
            <input type="email" class="mcp-form-input" name="email" required />
          </div>

          <div class="mcp-form-group">
            <label class="mcp-form-label">Project Type *</label>
            <select class="mcp-form-select" name="type" required>
              <option value="">Select a project type</option>
              <option value="portrait">Portrait</option>
              <option value="figure">Figure Drawing</option>
              <option value="illustration">Illustration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="mcp-form-group">
            <label class="mcp-form-label">Project Description *</label>
            <textarea class="mcp-form-textarea" name="description" required placeholder="Tell me about your vision..."></textarea>
          </div>

          <div class="mcp-form-group">
            <label class="mcp-form-label">Budget Range</label>
            <select class="mcp-form-select" name="budget">
              <option value="">Select a budget range</option>
              <option value="under-500">Under $500</option>
              <option value="500-1000">$500 - $1000</option>
              <option value="1000-2000">$1000 - $2000</option>
              <option value="2000+">$2000+</option>
            </select>
          </div>

          <div class="mcp-form-group">
            <label class="mcp-form-label">Timeline</label>
            <select class="mcp-form-select" name="timeline">
              <option value="">Select a timeline</option>
              <option value="flexible">Flexible</option>
              <option value="1-month">Within 1 month</option>
              <option value="2-3-months">2-3 months</option>
              <option value="3-6-months">3-6 months</option>
            </select>
          </div>

          <button type="button" class="mcp-button mcp-form-submit" data-intent="submit-commission">
            Submit Inquiry
          </button>
        </form>
      </div>
    </div>
  `
}

/**
 * Generate store info HTML
 */
export function generateStoreInfo() {
  return `
    <div class="mcp-container">
      <style>${SHARED_STYLES}</style>
      <div class="mcp-info-container">
        <h2 class="mcp-section-title">KTT Art Store</h2>

        <div class="mcp-info-section">
          <h3>About Kristian</h3>
          <p>
            Kristian is a contemporary artist specializing in figure drawing, portraiture, and illustration.
            With a focus on capturing human emotion and movement, each piece is created with careful attention to detail and genuine artistic expression.
          </p>
        </div>

        <div class="mcp-info-section">
          <h3>Shipping & Delivery</h3>
          <ul>
            <li>Original artworks are carefully packaged and shipped within 2-3 business days</li>
            <li>Domestic shipping: $15-30 depending on size (included in large orders)</li>
            <li>International shipping available - contact for rates</li>
            <li>Tracking provided for all orders</li>
            <li>Insurance included on all shipments</li>
          </ul>
        </div>

        <div class="mcp-info-section">
          <h3>Returns & Exchanges</h3>
          <ul>
            <li>30-day return policy for items not as described</li>
            <li>Damage during shipping covered 100%</li>
            <li>Exchanges available for size/style preferences</li>
            <li>Custom and commissioned works are final sale</li>
          </ul>
        </div>

        <div class="mcp-info-section">
          <h3>Pricing</h3>
          <p>
            Original artworks range from $150-$650 depending on size, complexity, and medium.
            Custom commissions start at $300 and vary based on project scope and timeline.
            Prints and limited editions available at reduced prices.
          </p>
        </div>

        <div class="mcp-info-section">
          <h3>Contact Information</h3>
          <p>
            <strong>Email:</strong> talleykristian@gmail.com<br>
            <strong>Response Time:</strong> 24 hours<br>
            <strong>Available for:</strong> Commissions, inquiries, and collaborations
          </p>
          <button class="mcp-button" style="margin-top: 1rem;" onclick="window.location.href='mailto:talleykristian@gmail.com'">
            Send Email
          </button>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <button class="mcp-button mcp-button-secondary" data-intent="back-to-products">
            Back to Products
          </button>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate filter panel HTML
 */
export function generateFilterPanel(filters = {}, products = []) {
  // Get unique types and tags from products
  const types = [...new Set(products.map((p) => p.type).filter(Boolean))]
  const allTags = [...new Set(products.flatMap((p) => p.tags || []))]

  return `
    <div class="mcp-container">
      <style>${SHARED_STYLES}</style>
      <div class="mcp-filters-container">
        <h2 class="mcp-section-title">Filter Products</h2>

        <form id="filter-form">
          <div class="mcp-filter-section">
            <div class="mcp-filter-title">Product Type</div>
            <div class="mcp-filter-options">
              ${types
                .map(
                  (type) => `
                <div class="mcp-filter-option">
                  <input type="checkbox" id="type-${type}" name="type" value="${type}" />
                  <label for="type-${type}">${type}</label>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="mcp-filter-section">
            <div class="mcp-filter-title">Tags</div>
            <div class="mcp-filter-options">
              ${allTags
                .slice(0, 8)
                .map(
                  (tag) => `
                <div class="mcp-filter-option">
                  <input type="checkbox" id="tag-${tag}" name="tag" value="${tag}" />
                  <label for="tag-${tag}">${tag}</label>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="mcp-filter-section">
            <div class="mcp-filter-title">Price Range</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="mcp-form-group" style="margin-bottom: 0;">
                <label class="mcp-form-label" style="font-size: 0.875rem;">Min</label>
                <input type="number" class="mcp-form-input" name="priceMin" value="0" />
              </div>
              <div class="mcp-form-group" style="margin-bottom: 0;">
                <label class="mcp-form-label" style="font-size: 0.875rem;">Max</label>
                <input type="number" class="mcp-form-input" name="priceMax" value="1000" />
              </div>
            </div>
          </div>

          <div class="mcp-filter-section" style="border-bottom: none;">
            <button type="button" class="mcp-button" style="width: 100%; margin-bottom: 0.5rem;" data-intent="apply-filters">
              Apply Filters
            </button>
            <button type="button" class="mcp-button mcp-button-secondary" style="width: 100%;" data-intent="close-filters">
              View Results
            </button>
          </div>
        </form>
      </div>
    </div>
  `
}
