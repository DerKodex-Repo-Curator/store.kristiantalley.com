# KTT Shop

Custom ecommerce storefront for KTT artwork, built with React, Tailwind CSS, and Shopify Storefront API. Design matches the minimal aesthetic of [kristiantalley.com](https://kristiantalley.com).

## Tech Stack

- **Build Tool**: Vite
- **Frontend**: React 18 (JavaScript)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Ecommerce**: Shopify Storefront API
- **Deployment**: Static SPA served by nginx

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Shopify credentials (optional for dev)

# Start development server
npm run dev

# Build for production
npm run build
```

The site runs at `http://localhost:5173`. Without Shopify configured, it displays mock artwork data.

## Project Structure

```
src/
├── main.jsx              # React entry point
├── App.jsx               # Routes
├── index.css             # Tailwind + custom styles
├── components/
│   ├── Layout.jsx        # Page wrapper
│   ├── Sidebar.jsx       # Left sidebar navigation
│   └── CartDrawer.jsx    # Slide-out cart
├── pages/
│   ├── HomePage.jsx      # Landing with featured work
│   ├── ShopPage.jsx      # Masonry product grid
│   ├── ProductPage.jsx   # Product detail
│   ├── AboutPage.jsx     # Artist bio
│   ├── ContactPage.jsx   # Contact form
│   └── NotFoundPage.jsx  # 404
├── context/
│   └── CartContext.jsx   # Cart state
└── lib/
    └── shopifyClient.js  # Shopify API
```

## Design

Matches kristiantalley.com:
- Fixed left sidebar with KTT logo and navigation
- Pure white background, black text
- System sans-serif fonts (Helvetica Neue, etc.)
- Masonry grid layout for artwork
- Minimal, no-frills aesthetic

## Shopify Setup

1. Create a Shopify store and add products
2. Create a Storefront API access token in Shopify Admin
3. Configure `.env`:

```bash
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
VITE_SHOPIFY_API_VERSION=2024-10
```

## Deployment

Build and deploy to nginx:

```bash
npm run build
rsync -avz --delete ./dist/ user@server:/var/www/kristiantalley.com/dist/
```

See `nginx.conf.example` for server configuration.

## Adding Artwork Images

Replace placeholder image URLs in `src/lib/shopifyClient.js` with actual artwork images, or configure Shopify with your product images.

## Contact

talleykristian@gmail.com
