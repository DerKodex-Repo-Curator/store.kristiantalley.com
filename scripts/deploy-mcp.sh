#!/bin/bash
# Deploy MCP Server to llm.kristiantalley.com
# Usage: ./scripts/deploy-mcp.sh [--sync-only] [--no-restart]

set -e

# Configuration
REMOTE_HOST="${REMOTE_HOST:-ubuntu@llm.kristiantalley.com}"
REMOTE_PATH="/home/ubuntu/store.kristiantalley.com"
LOCAL_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/id_rsa}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
SYNC_ONLY=false
NO_RESTART=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --sync-only)
      SYNC_ONLY=true
      shift
      ;;
    --no-restart)
      NO_RESTART=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${YELLOW}🚀 Deploying MCP Server to $REMOTE_HOST${NC}"

# Step 1: Sync product data
echo -e "${YELLOW}📦 Step 1: Syncing product data...${NC}"
node scripts/sync-data.js

if [ "$SYNC_ONLY" = true ]; then
  echo -e "${GREEN}✅ Sync complete. Exiting (--sync-only)${NC}"
  exit 0
fi

# Step 2: Create remote directory
echo -e "${YELLOW}📁 Step 2: Creating remote directories...${NC}"
ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

# Step 3: Sync MCP server files
echo -e "${YELLOW}🔄 Step 3: Syncing MCP server files...${NC}"
rsync -ave "ssh -i $DEPLOY_KEY" \
  --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='data' \
  "$LOCAL_PATH/mcp-server/" \
  "$REMOTE_HOST:$REMOTE_PATH/mcp-server/"

# Step 4: Sync ONLY the product catalog. We deliberately do NOT --delete or sync
# the rest of data/ — carts.json, orders.json and inquiries.json are runtime
# state living on the server and must never be overwritten by a deploy.
echo -e "${YELLOW}📊 Step 4: Syncing product catalog (products.json only)...${NC}"
ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "mkdir -p $REMOTE_PATH/mcp-server/data"
rsync -ave "ssh -i $DEPLOY_KEY" \
  "$LOCAL_PATH/mcp-server/data/products.json" \
  "$REMOTE_HOST:$REMOTE_PATH/mcp-server/data/products.json"

# Step 5: Install dependencies (if package.json changed)
echo -e "${YELLOW}📦 Step 5: Installing dependencies on remote...${NC}"
ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "cd $REMOTE_PATH/mcp-server && npm install --production --cache /tmp/npm-cache"

# Step 6: Update nginx config
echo -e "${YELLOW}⚙️  Step 6: Updating nginx configuration...${NC}"
ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "sudo cp $REMOTE_PATH/mcp-server/deploy/nginx/mcp.conf /etc/nginx/conf.d/mcp.conf && sudo nginx -t"

# Step 7: Restart services
if [ "$NO_RESTART" = false ]; then
  echo -e "${YELLOW}🔄 Step 7: Restarting services...${NC}"

  # Restart MCP server
  ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "sudo systemctl restart mcp-server"

  # Reload nginx
  ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "sudo systemctl reload nginx"

  # Wait for startup
  echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
  sleep 3

  # Health check
  echo -e "${YELLOW}🏥 Step 8: Health check...${NC}"
  STATUS=$(ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "sudo systemctl is-active mcp-server")

  if [ "$STATUS" = "active" ]; then
    echo -e "${GREEN}✅ MCP Server is running${NC}"
  else
    echo -e "${RED}❌ MCP Server failed to start${NC}"
    ssh -i "$DEPLOY_KEY" "$REMOTE_HOST" "sudo systemctl status mcp-server"
    exit 1
  fi
else
  echo -e "${YELLOW}⏭️  Skipping restart (--no-restart)${NC}"
fi

# Final status
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📍 MCP Server endpoint: https://llm.kristiantalley.com/mcp/store"
echo "🏥 Health check: https://llm.kristiantalley.com/health"
echo ""
echo "Remote logs:"
echo "  journalctl -u mcp-server -f"
echo ""
echo "Restart manually:"
echo "  systemctl restart mcp-server"
