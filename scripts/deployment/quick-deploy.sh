#!/bin/bash

# Quick Deployment Script
# This script automates the entire deployment process
# Usage: ./quick-deploy.sh [domain-name] [vps-ip]

set -e

DOMAIN=$1
VPS_IP=$2

if [ -z "$DOMAIN" ] || [ -z "$VPS_IP" ]; then
    echo "Usage: ./quick-deploy.sh <domain-name> <vps-ip>"
    echo "Example: ./quick-deploy.sh pdfreview.com 123.456.789.0"
    exit 1
fi

echo "=========================================="
echo "Quick Deployment - PDF Review Application"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "VPS IP: $VPS_IP"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Upload setup script
echo "Step 1: Uploading setup script..."
scp setup-server.sh root@$VPS_IP:/root/

# Step 2: Run setup
echo "Step 2: Running server setup..."
ssh root@$VPS_IP "chmod +x /root/setup-server.sh && /root/setup-server.sh"

# Step 3: Clone repository (you need to provide repo URL)
echo ""
echo "Step 3: Repository setup"
echo "Please provide your Git repository URL:"
read REPO_URL

ssh root@$VPS_IP "cd /var/www && git clone $REPO_URL pdf-review-app"

# Step 4: Upload deployment script
echo "Step 4: Uploading deployment script..."
scp deploy.sh root@$VPS_IP:/var/www/pdf-review-app/

# Step 5: Configure Nginx
echo "Step 5: Configuring Nginx..."
sed "s/yourdomain.com/$DOMAIN/g" nginx-config.conf > /tmp/nginx-config.conf
scp /tmp/nginx-config.conf root@$VPS_IP:/etc/nginx/sites-available/pdf-review
ssh root@$VPS_IP "ln -sf /etc/nginx/sites-available/pdf-review /etc/nginx/sites-enabled/ && nginx -t && systemctl restart nginx"

echo ""
echo "=========================================="
echo "Deployment setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Configure server/.env on the server"
echo "2. Run: ssh root@$VPS_IP 'cd /var/www/pdf-review-app && ./deploy.sh'"
echo "3. Setup SSL: ssh root@$VPS_IP 'certbot --nginx -d $DOMAIN -d www.$DOMAIN'"
echo ""

