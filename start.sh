#!/bin/bash

# PDF Review Application - Startup Script
# This script starts both the backend server and frontend client

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   PDF Review Application - Startup Script${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Node.js or load nvm:${NC}"
    echo -e "  export NVM_DIR=\"\$HOME/.nvm\""
    echo -e "  [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\""
    exit 1
fi

# Check configuration files
echo -e "\n${BLUE}🔍 Checking configuration files...${NC}"

if [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ server/.env file not found!${NC}"
    echo -e "${YELLOW}Please create server/.env with required variables:${NC}"
    echo -e "  - MONGO_URI"
    echo -e "  - JWT_SECRET"
    echo -e "  - FIREBASE_SERVICE_ACCOUNT_PATH"
    echo -e "  - FIREBASE_STORAGE_BUCKET"
    exit 1
else
    echo -e "${GREEN}✅ server/.env found${NC}"
fi

# Check if dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Server dependencies not installed. Installing...${NC}"
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Client dependencies not installed. Installing...${NC}"
    cd client && npm install && cd ..
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    kill $CLIENT_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "\n${BLUE}🚀 Starting backend server...${NC}"
cd server
npm start > /tmp/server.log 2>&1 &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start backend server${NC}"
    echo -e "${YELLOW}Check /tmp/server.log for errors${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend server started (PID: $SERVER_PID)${NC}"

# Start frontend client
echo -e "\n${BLUE}🚀 Starting frontend client...${NC}"
cd client
npm run dev > /tmp/client.log 2>&1 &
CLIENT_PID=$!
cd ..

# Wait for client to start
sleep 3

# Check if client is running
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start frontend client${NC}"
    echo -e "${YELLOW}Check /tmp/client.log for errors${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Frontend client started (PID: $CLIENT_PID)${NC}"

echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Application is running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "\n${CYAN}📍 Backend API: http://localhost:3000${NC}"
echo -e "${CYAN}📍 Frontend: http://localhost:5173${NC}"
echo -e "\n${YELLOW}💡 Press Ctrl+C to stop all servers${NC}\n"

# Wait for processes
wait

