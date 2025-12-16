#!/bin/bash

# Server Setup Script for PDF Review Application
# Run this script on a fresh Ubuntu 22.04 VPS

set -e

echo "=========================================="
echo "PDF Review Application - Server Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_info "Starting server setup..."

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

# Install Node.js 20.x LTS
print_info "Installing Node.js 20.x LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
print_success "Node.js installed: $(node --version)"
print_success "npm installed: $(npm --version)"

# Install Nginx
print_info "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
print_success "Nginx installed and started"

# Install PM2
print_info "Installing PM2..."
npm install -g pm2
print_success "PM2 installed: $(pm2 --version)"

# Install serve (for serving frontend static files)
print_info "Installing serve..."
npm install -g serve
print_success "serve installed"

# Install Git
print_info "Installing Git..."
apt install -y git
print_success "Git installed: $(git --version)"

# Install UFW (firewall)
print_info "Configuring firewall..."
apt install -y ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
print_success "Firewall configured"

# Install Certbot (for SSL certificates)
print_info "Installing Certbot..."
apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Create application directory
print_info "Creating application directory..."
mkdir -p /var/www/pdf-review-app
print_success "Application directory created: /var/www/pdf-review-app"

# Set proper permissions
print_info "Setting permissions..."
chown -R $SUDO_USER:$SUDO_USER /var/www/pdf-review-app
print_success "Permissions set"

echo ""
echo "=========================================="
print_success "Server setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository to /var/www/pdf-review-app"
echo "2. Configure environment variables in server/.env"
echo "3. Install dependencies: cd server && npm install"
echo "4. Build frontend: cd client && npm install && npm run build"
echo "5. Start with PM2: pm2 start server/server.js --name pdf-review-backend"
echo "6. Configure Nginx (see DEPLOYMENT-GUIDE.md)"
echo "7. Setup SSL: certbot --nginx -d yourdomain.com"
echo ""

