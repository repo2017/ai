#!/bin/bash
# Server Connection Test Script for Fooocus Inpainter
# This script tests your Focus server connection and shows configuration status

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Fooocus Inpainter - Server Test Tool"
echo "=========================================="
echo ""

# Read FOCUS_SERVER_URL from .env or use default
if [ -f ".env" ]; then
    FOCUS_URL=$(grep "^FOCUS_SERVER_URL=" .env | cut -d'=' -f2 | tr -d ' ')
    DEBUG_MODE=$(grep "^DEBUG_MODE=" .env | cut -d'=' -f2 | tr -d ' ')
else
    echo -e "${YELLOW}⚠️  Warning: .env file not found!${NC}"
    echo "Please create a .env file with your server URL first."
    echo ""
    echo "Example:"
    echo "  FOCUS_SERVER_URL=http://127.0.0.1:7865"
    echo "  API_ENDPOINT=generation/image-inpaint"
    echo ""
    exit 1
fi

echo -e "${BLUE}📡 Current Configuration:${NC}"
echo "  Server URL: $FOCUS_URL"
if [ "$DEBUG_MODE" = "true" ]; then
    echo "  Debug Mode: ENABLED"
else
    echo "  Debug Mode: DISABLED"
fi
echo ""

# Test health endpoint
echo -e "${BLUE}🔍 Testing Health Endpoint...${NC}"
HEALTH_URL="${FOCUS_URL}/health"
echo "  URL: $HEALTH_URL"

if command -v curl &> /dev/null; then
    # Try to fetch with timeout
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${RED}❌ Health check failed (HTTP $RESPONSE)${NC}"
        
        # Try to show error details
        if [ "$RESPONSE" = "000" ]; then
            echo "  Possible reasons:"
            echo "  1. Focus server is not running"
            echo "  2. Firewall blocking connection"
            echo "  3. Wrong port number in .env file"
        else
            echo -e "${RED}  Error: HTTP $RESPONSE${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  curl not found, skipping health check${NC}"
fi

echo ""

# List environment variables
echo -e "${BLUE}📋 Environment Variables:${NC}"
if [ -f ".env" ]; then
    cat .env | grep "^FOCUS_SERVER_URL\|^API_ENDPOINT\|^TIMEOUT_MS\|^DEBUG_MODE" | while read line; do
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)
        echo "  $key = $value"
    done
else
    echo "  .env file not found!"
fi

echo ""

# Check for common issues
echo -e "${BLUE}⚠️  Connection Tips:${NC}"
echo ""
echo "  1. Make sure Fooocus is running on port $(echo $FOCUS_URL | grep -oE ':[0-9]+' || echo '7865')"
echo "  2. If using remote server, ensure firewall allows connections"
echo "  3. Check browser console (F12) for CORS errors"
echo ""

# Show curl test command
echo -e "${BLUE}🧪 Test Command to Run:${NC}"
echo "  curl http://$(echo $FOCUS_URL | sed 's|http://||' | cut -d':' -f1):$(echo $FOCUS_URL | grep -oE ':[0-9]+' || echo '7865')/health"
echo ""

echo "=========================================="
echo "Test Complete!"
echo "=========================================="

if [ "$RESPONSE" = "200" ] 2>/dev/null; then
    echo -e "${GREEN}✅ Your Focus server is running and accessible!${NC}"
else
    echo -e "${YELLOW}⚠️  Connection test failed. Check your .env file and Focus server setup.${NC}"
fi

echo ""
echo "To enable debug logging, add DEBUG_MODE=true to your .env file"
