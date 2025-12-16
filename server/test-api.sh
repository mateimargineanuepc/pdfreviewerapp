#!/bin/bash

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Starting API Tests...${NC}\n"

# Test 1: Root endpoint
echo -e "${YELLOW}📋 Test 1: Root Endpoint${NC}"
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ SUCCESS${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "   Status: $http_code"
fi
echo ""

# Test 2: Register new user
echo -e "${YELLOW}📋 Test 2: User Registration${NC}"
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="testpassword123"
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✅ SUCCESS${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
    # Extract token
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
fi
echo ""

# Test 3: Try duplicate registration (should fail)
echo -e "${YELLOW}📋 Test 3: Duplicate Registration (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" = "409" ]; then
    echo -e "${GREEN}✅ SUCCESS (correctly failed)${NC}"
    echo "   Status: $http_code"
else
    echo -e "${RED}❌ UNEXPECTED${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
fi
echo ""

# Test 4: Login
echo -e "${YELLOW}📋 Test 4: User Login${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ SUCCESS${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
    # Extract token
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
    TOKEN=""
fi
echo ""

# Test 5: Login with wrong password (should fail)
echo -e "${YELLOW}📋 Test 5: Login with Wrong Password (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✅ SUCCESS (correctly failed)${NC}"
    echo "   Status: $http_code"
else
    echo -e "${RED}❌ UNEXPECTED${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
fi
echo ""

# Test 6: List files without auth (should fail)
echo -e "${YELLOW}📋 Test 6: List Files without Auth (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/files)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✅ SUCCESS (correctly failed)${NC}"
    echo "   Status: $http_code"
else
    echo -e "${RED}❌ UNEXPECTED${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
fi
echo ""

# Test 7: List files with auth
if [ -n "$TOKEN" ]; then
    echo -e "${YELLOW}📋 Test 7: List Files with Auth${NC}"
    response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/files \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
        echo "   Status: $http_code"
        echo "   Response: $body"
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Status: $http_code"
        echo "   Response: $body"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  Test 7: Skipped (no token)${NC}\n"
fi

# Test 8: Get PDF URL without auth (should fail)
echo -e "${YELLOW}📋 Test 8: Get PDF URL without Auth (should fail)${NC}"
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/files/test.pdf)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✅ SUCCESS (correctly failed)${NC}"
    echo "   Status: $http_code"
else
    echo -e "${RED}❌ UNEXPECTED${NC}"
    echo "   Status: $http_code"
    echo "   Response: $body"
fi
echo ""

# Test 9: Get PDF URL with auth
if [ -n "$TOKEN" ]; then
    echo -e "${YELLOW}📋 Test 9: Get PDF URL with Auth${NC}"
    response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/files/test.pdf \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✅ SUCCESS${NC}"
        else
            echo -e "${YELLOW}⚠️  File not found (expected if file doesn't exist in Firebase)${NC}"
        fi
        echo "   Status: $http_code"
        echo "   Response: $body"
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Status: $http_code"
        echo "   Response: $body"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  Test 9: Skipped (no token)${NC}\n"
fi

echo -e "${BLUE}✅ API Tests Completed!${NC}\n"

