# MCP Server Deployment Guide

## Overview

The MCP (Model Context Protocol) server exposes the KTT Art Store functionality via HTTP, enabling the frontend to access product data, manage carts, and handle commission inquiries.

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
cd mcp-server
npm install
```

## Running the Server

### Development (HTTP Transport)

```bash
node server.js --transport=http --port=3001
```

The server will be available at:
- MCP Endpoint: `http://localhost:3001/mcp/store`
- Tools List: `http://localhost:3001/mcp/tools`
- Health Check: `http://localhost:3001/health`

### Production (HTTP Transport)

For production deployment, use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name ktt-mcp -- --transport=http --port=3001
pm2 save
pm2 startup
```

### Local (stdio Transport)

For Claude Code integration:

```bash
node server.js --transport=stdio
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_products` | Browse products with filters |
| `search_products` | Search products by keyword |
| `get_product_details` | Get details for a specific product |
| `create_cart_session` | Create a new cart session |
| `add_to_cart` | Add product to cart |
| `view_cart` | View cart contents |
| `remove_from_cart` | Remove item from cart |
| `get_store_info` | Get store information |
| `get_product_types` | Get available product types |
| `get_available_tags` | Get available product tags |
| `submit_commission_inquiry` | Submit a commission request |
| `get_contact_info` | Get contact information |

## Example API Call

```bash
curl -X POST http://localhost:3001/mcp/store \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_products",
      "arguments": {
        "available": true
      }
    },
    "id": 1
  }'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `TRANSPORT` | Transport type | http |

## Troubleshooting

### CORS Issues

The server is configured to allow all origins (`*`). For production, consider restricting to your domain:

```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://kristiantalley.com')
```

### Product Data Not Loading

Ensure the `data/products.json` file exists in the mcp-server directory.

### Server Not Starting

Check that all dependencies are installed:

```bash
npm install
```

## Monitoring

Use the health endpoint to monitor server status:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "transport": "http"
}
```
