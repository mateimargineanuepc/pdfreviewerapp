#!/bin/bash

# Deployment Script for PDF Review Application
# Run this from the project root directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

echo "=========================================="
echo "PDF Review Application - Deployment"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f "server/.env" ]; then
    print_error "server/.env not found. Please create it first."
    exit 1
fi

# Backend deployment
print_info "Deploying backend..."
cd server

print_info "Installing dependencies..."
npm install --production
print_success "Backend dependencies installed"

print_info "Restarting backend with PM2..."
pm2 restart pdf-review-backend || pm2 start server.js --name pdf-review-backend
print_success "Backend restarted"

cd ..

# Frontend deployment
print_info "Deploying frontend..."
cd client

print_info "Installing dependencies..."
npm install
print_success "Frontend dependencies installed"

print_info "Building frontend..."
npm run build
print_success "Frontend built"

print_info "Restarting frontend with PM2..."
pm2 restart pdf-review-frontend || pm2 start serve --name pdf-review-frontend -- -s dist -l 5173
print_success "Frontend restarted"

cd ..

echo ""
echo "=========================================="
print_success "Deployment complete!"
echo "=========================================="
echo ""
print_info "Check status: pm2 status"
print_info "View logs: pm2 logs"
echo ""

