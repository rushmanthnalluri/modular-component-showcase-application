#!/bin/bash

# CAPTCHA Flow End-to-End Debugging Script
# Tests the complete flow: Frontend → Gateway → Backend → Captcha Generation

set -e

GATEWAY_URL="${1:-https://modular-component-showcase-application-ve5e.onrender.com}"
BACKEND_URL="${2:-https://modular-component-showcase-backend.onrender.com}"
FRONTEND_ORIGIN="${3:-https://rushmanthnalluri.github.io}"

echo "====================================="
echo "CAPTCHA Flow Debugging"
echo "====================================="
echo ""
echo "Configuration:"
echo "  Gateway URL: $GATEWAY_URL"
echo "  Backend URL: $BACKEND_URL"
echo "  Frontend Origin: $FRONTEND_ORIGIN"
echo ""

# STEP 1: Test gateway health endpoint
echo "[STEP 1] Testing Gateway Health Endpoint"
echo "GET $GATEWAY_URL/health"
HEALTH_RESPONSE=$(curl -s "$GATEWAY_URL/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"gateway":"[^"]*"' | cut -d'"' -f4)
echo "Response: $HEALTH_RESPONSE" | head -20
echo "  Gateway Status: $HEALTH_STATUS"
echo ""

# STEP 2: Test OPTIONS preflight for captcha endpoint
echo "[STEP 2] Testing CORS Preflight (OPTIONS)"
echo "OPTIONS $GATEWAY_URL/api/captcha/getcaptcha/6"
PREFLIGHT_RESPONSE=$(curl -s -i -X OPTIONS \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$GATEWAY_URL/api/captcha/getcaptcha/6")

echo "$PREFLIGHT_RESPONSE" | grep -E "^(HTTP|Access-Control|x-)" || echo "Response headers:"
echo "$PREFLIGHT_RESPONSE" | head -20
echo ""

# STEP 3: Test direct captcha endpoint (should return 200 with JSON)
echo "[STEP 3] Testing Captcha Endpoint (via Gateway)"
echo "GET $GATEWAY_URL/api/captcha/getcaptcha/6"
CAPTCHA_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Accept: application/json" \
  "$GATEWAY_URL/api/captcha/getcaptcha/6")

HTTP_STATUS=$(echo "$CAPTCHA_RESPONSE" | grep "^HTTP_STATUS:" | cut -d':' -f2)
CAPTCHA_BODY=$(echo "$CAPTCHA_RESPONSE" | sed '/^HTTP_STATUS/d')

echo "  HTTP Status: $HTTP_STATUS"
echo "  Response (first 200 chars):"
echo "$CAPTCHA_BODY" | head -c 200
echo ""
echo ""

# Extract text and image from response
if [ "$HTTP_STATUS" = "200" ]; then
  CAPTCHA_TEXT=$(echo "$CAPTCHA_BODY" | grep -o '"text":"[^"]*"' | cut -d'"' -f4)
  CAPTCHA_IMAGE_LEN=$(echo "$CAPTCHA_BODY" | grep -o '"image":"[^"]*"' | wc -c)
  echo "  ✓ Captcha Text: $CAPTCHA_TEXT"
  echo "  ✓ Captcha Image (base64): ${CAPTCHA_IMAGE_LEN} bytes"
else
  echo "  ✗ Failed with status $HTTP_STATUS"
fi
echo ""

# STEP 4: Test backend directly (if reachable)
echo "[STEP 4] Testing Backend Directly"
echo "GET $BACKEND_URL/api/captcha/getcaptcha/6"
BACKEND_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Accept: application/json" \
  "$BACKEND_URL/api/captcha/getcaptcha/6")

BACKEND_STATUS=$(echo "$BACKEND_RESPONSE" | grep "^HTTP_STATUS:" | cut -d':' -f2)
BACKEND_BODY=$(echo "$BACKEND_RESPONSE" | sed '/^HTTP_STATUS/d')

echo "  HTTP Status: $BACKEND_STATUS"
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "  ✓ Backend is reachable"
  BACKEND_TEXT=$(echo "$BACKEND_BODY" | grep -o '"text":"[^"]*"' | cut -d'"' -f4)
  echo "  ✓ Captcha Text: $BACKEND_TEXT"
else
  echo "  ✗ Backend status: $BACKEND_STATUS"
  echo "  Response: $BACKEND_BODY"
fi
echo ""

# STEP 5: Test login endpoint (auth flow with captcha validation)
echo "[STEP 5] Testing Full Login Flow Simulation"
echo "POST $GATEWAY_URL/api/auth/login"
echo "  (This would require valid credentials - skipping actual request)"
echo ""

# STEP 6: Summary and Recommendations
echo "====================================="
echo "SUMMARY"
echo "====================================="
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✓ CAPTCHA endpoint is responding via gateway"
  echo "✓ Response format appears correct"
  echo "✓ CAPTCHA generation is working"
else
  echo "✗ CAPTCHA endpoint failed"
  if [ "$BACKEND_STATUS" = "200" ]; then
    echo "  → Backend is working but gateway proxy failed"
  else
    echo "  → Backend is also not responding"
  fi
fi
echo ""

echo "Next Steps:"
echo "1. If captcha is working: Test login page in browser"
echo "2. Load: $FRONTEND_ORIGIN"
echo "3. Navigate to login page"
echo "4. Captcha should load and display"
echo "5. Enter captcha text and test authentication"
echo ""
