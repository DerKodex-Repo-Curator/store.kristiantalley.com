# KTT Art Store MCP Server

MCP (Model Context Protocol) server for exposing the KTT Art Store to AI tools like Claude. Enables AI to browse products, manage carts, and submit commissions.

## Quick Start

### Local Development (Claude Code)

```bash
cd mcp-server
npm install
node server.js --transport=stdio
```

### Manual Installation

1. **Install dependencies**
   ```bash
   cd mcp-server
   npm install --cache /tmp/npm-cache
   ```

2. **Sync product data** (if updating from shopifyClient)
   ```bash
   node ../scripts/sync-data.js
   ```

3. **Start server**
   ```bash
   node server.js --transport=stdio
   ```

## Tools Available (12 Total)

### Product Discovery (3 tools)

1. **list_products** - Browse with optional filters
   - Filters: `type`, `tag`, `minPrice`, `maxPrice`, `available`
   - Returns: List of matching products

2. **search_products** - Keyword search in titles and descriptions
   - Input: `query` string
   - Returns: Matching products

3. **get_product_details** - Full details for a single product
   - Input: `handle` (e.g., "seated-figure-i")
   - Returns: Complete product information including dimensions, medium, year

### Cart Management (4 tools)

4. **create_cart_session** - Create new AI exploration cart
   - Returns: Session ID for use with other cart tools
   - Note: Separate from frontend carts; 24-hour TTL

5. **add_to_cart** - Add product to cart
   - Inputs: `productHandle`, `quantity`
   - Returns: Updated cart

6. **view_cart** - View cart contents
   - Input: `sessionId`
   - Returns: Items and total

7. **remove_from_cart** - Remove item from cart
   - Inputs: `sessionId`, `lineItemId`
   - Returns: Updated cart

### Store Information (3 tools)

8. **get_store_info** - Artist bio, shipping, returns, commission info
   - Returns: Store policies and artist information

9. **get_product_types** - Product type taxonomy with counts
   - Returns: Types (Drawing, Illustration, Print) with quantities

10. **get_available_tags** - All tags in catalog
    - Returns: Organized list of tags (medium, subject, availability)

### Custom Requests (2 tools)

11. **submit_commission_inquiry** - Request custom commission
    - Inputs: `subject`, `details`, `budget` (optional), `deadline` (optional), `contactInfo` (optional)
    - Saves inquiry to `data/inquiries.json`

12. **get_contact_info** - Artist contact and commission process
    - Returns: Email, social media, response time, commission workflow

## Data Files

- `data/products.json` - Product catalog (20 items)
- `data/carts.json` - Active cart sessions (auto-created)
- `data/inquiries.json` - Commission inquiries (auto-created)
- `data/store.js` - Data access layer abstraction

## Configuration

### Environment Variables

```bash
# Transport
MCP_TRANSPORT=stdio|http  # Default: stdio
MCP_PORT=3001             # Default: 3001 (for HTTP)

# Data source
MCP_DATA_SOURCE=json|shopify  # Default: json
MCP_DATA_PATH=/path/to/data   # Default: ./data

# Shopify (future use)
VITE_SHOPIFY_STORE_DOMAIN=...
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
VITE_SHOPIFY_API_VERSION=2024-10
```

## Data Store Architecture

The server uses an abstract data store pattern for flexibility:

```javascript
DataStore (abstract)
├── JSONDataStore (current)
└── ShopifyDataStore (future)
```

**JSONDataStore** (current implementation):
- Reads products from `products.json`
- Persists carts to `carts.json`
- Persists inquiries to `inquiries.json`
- Suitable for development and small deployments

**ShopifyDataStore** (planned):
- Reads from Shopify Storefront API
- Real-time inventory tracking
- Direct checkout integration
- Requires API credentials

## Product Data Structure

Products conform to Shopify Storefront API format:

```javascript
{
  id: "gid://shopify/Product/1",
  title: "Seated Figure I",
  handle: "seated-figure-i",        // URL-friendly identifier
  description: "...",
  productType: "Drawing",            // Drawing | Illustration | Print
  tags: ["original", "ink", "figurative"],
  price: "450",
  currency: "USD",
  image: "https://...",
  imageAlt: "...",
  available: true,
  dimensions: "9\" x 12\"",
  medium: "Pen and ink on paper",
  year: "2024"
}
```

## Cart Session Structure

```javascript
{
  id: "uuid",                        // Session ID
  items: [
    {
      id: "line-item-id",
      handle: "seated-figure-i",
      title: "Seated Figure I",
      price: "450",
      image: "https://...",
      quantity: 1
    }
  ],
  createdAt: "2024-01-25T...",
  updatedAt: "2024-01-25T..."
}
```

**Note**: MCP cart sessions are separate from frontend shopping carts. They're for AI exploration only and don't affect actual user purchases.

## Commission Inquiry Structure

```javascript
{
  type: "commission",
  id: "inquiry-...",
  subject: "Custom Figure Drawing",
  details: "I want a 9x12 pen and ink drawing...",
  budget: "$500-$750",
  deadline: "2024-03-01",
  contactInfo: "john@example.com",
  submittedAt: "2024-01-25T...",
  createdAt: "2024-01-25T..."
}
```

## Product Catalog

**20 Total Items:**
- Drawing: 15 pieces
- Illustration: 4 pieces
- Print: 1 piece

**Price Range:** $150 - $650

**Availability:** 18 in stock, 2 sold out

**Common Tags:** original, ink, figurative, landscape, nature, portrait, botanical, abstract, interior, mixed-media, digital, limited-edition, print

## Deployment

### Local (Claude Code Integration)

1. In Claude Code settings, add MCP server:
   ```json
   {
     "mcpServers": {
       "ktt-store": {
         "command": "node",
         "args": [
           "/full/path/to/store.kristiantalley.com/mcp-server/server.js",
           "--transport=stdio"
         ]
       }
     }
   }
   ```

2. Restart Claude Code to load the server

### Remote (Phase 4 - Future)

HTTP transport will be implemented in Phase 4 for remote deployment to YOUR_MCP_DOMAIN

## Development

### Testing

```bash
# Start server
node server.js --transport=stdio

# In another terminal, test with curl (when HTTP implemented)
curl -X POST http://localhost:3001/mcp/store \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_products"}'
```

### Adding New Tools

1. Create new file in `tools/`
2. Implement `register*Tools(server, dataStore)` function
3. Import and call in `server.js`
4. Update this README

### Updating Products

```bash
# When shopifyClient.js changes:
node ../scripts/sync-data.js
```

## Limitations & Future Work

**Current (Phase 1-3):**
- JSON-based data (fast, version-controlled)
- stdio transport only (local development)
- No real Shopify integration

**Planned (Phase 4-5):**
- HTTP transport for remote access
- Shopify Storefront API integration
- Real inventory tracking
- Order history
- Product recommendations
- Advanced commission workflow

## Troubleshooting

### Server won't start
```bash
# Check dependencies installed
npm install

# Try with clean cache
npm install --cache /tmp/npm-cache

# Check Node version (requires 18+)
node --version
```

### Products not loading
```bash
# Regenerate products.json
node ../scripts/sync-data.js

# Verify file exists and is valid JSON
cat data/products.json | jq .
```

### Cart operations failing
```bash
# Ensure data directory is writable
chmod -R 755 data/

# Check file permissions
ls -la data/
```

## Architecture Diagrams

```
Claude Code / AI Tool
        ↓
    MCP Client
        ↓
MCP Server (stdio)
    ├── Data Store Layer
    │   ├── JSONDataStore (current)
    │   └── ShopifyDataStore (future)
    ├── Tool Handlers
    │   ├── products.js (discovery)
    │   ├── cart.js (sessions)
    │   ├── info.js (metadata)
    │   └── custom.js (commissions)
    └── Data Files
        ├── products.json
        ├── carts.json
        └── inquiries.json
```

## References

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Implementation Plan](../README.md#MCP-Server-Implementation-Plan)

## License

Proprietary - KTT Art Store

## Support

For issues or questions:
- Email: kristian@kristiantalley.com
- Website: https://kristiantalley.com
