#!/bin/bash
# Deployment script for kristiantalley.com store
# Run this locally or on your server to build and deploy the site

set -e  # Exit on any error

# Configuration - adjust these for your server
REMOTE_USER="ubuntu"
REMOTE_HOST="your-server-ip"
REMOTE_PATH="/var/www/kristiantalley.com"

echo "=== Building React app ==="
npm run build

echo "=== Build complete! ==="
echo "The built files are in ./dist"

# Uncomment the following section for automated deployment to your server
# Make sure SSH keys are configured for passwordless login

# echo "=== Deploying to server ==="
# rsync -avz --delete ./dist/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/dist/

# echo "=== Reloading nginx ==="
# ssh ${REMOTE_USER}@${REMOTE_HOST} "sudo nginx -t && sudo systemctl reload nginx"

echo ""
echo "=== Next steps ==="
echo "1. Copy ./dist to your server's web directory"
echo "2. Configure nginx using nginx.conf.example as a template"
echo "3. Set up SSL certificates with Let's Encrypt"
echo ""
echo "Quick deploy command (after configuring SSH):"
echo "  rsync -avz --delete ./dist/ \${REMOTE_USER}@\${REMOTE_HOST}:\${REMOTE_PATH}/dist/"
