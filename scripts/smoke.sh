#!/bin/bash

# Smoke test script for Learn AI API endpoints
# Tests key functionality to verify backend is working correctly

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_BOOTSTRAP_KEY="${ADMIN_BOOTSTRAP_KEY:-your-bootstrap-key-here}"

echo "🔥 Learn AI Backend Smoke Tests"
echo "Base URL: $BASE_URL"
echo "================================"

# Test 1: Public catalog (no auth required)
echo "📚 Testing public catalog endpoint..."
response=$(curl -s "$BASE_URL/api/catalog")
if echo "$response" | grep -q "success"; then
    echo "✅ Public catalog accessible"
else
    echo "❌ Public catalog failed"
    echo "Response: $response"
fi

# Test 2: Health check
echo "💚 Testing health endpoint..."
response=$(curl -s "$BASE_URL/api/health")
if echo "$response" | grep -q "ok"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "Response: $response"
fi

# Test 3: Attempt admin bootstrap (expected to fail if already bootstrapped)
echo "🔐 Testing admin bootstrap protection..."
response=$(curl -s -X POST "$BASE_URL/api/admin/admins.create" \
  -H "x-admin-bootstrap-key: invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}')

if echo "$response" | grep -q "unauthorized"; then
    echo "✅ Admin bootstrap properly protected"
else
    echo "⚠️  Admin bootstrap response: $response"
fi

# Test 4: Attempt unauthorized admin endpoint
echo "🚫 Testing admin endpoint security..."
response=$(curl -s "$BASE_URL/api/admin/courses.mine")
if echo "$response" | grep -q "unauthorized"; then
    echo "✅ Admin endpoints properly secured"
else
    echo "❌ Admin endpoint security failed"
    echo "Response: $response"
fi

# Test 5: Test courseModules direct access (should be blocked)
echo "🔒 Testing courseModules direct access..."
# This would require setting up Firestore client, so we skip for now
echo "ℹ️  Manual test required: Ensure Firestore rules block direct courseModules access"

echo "================================"
echo "🏁 Smoke tests completed"
echo ""
echo "Manual verification needed:"
echo "1. Idempotency: Try duplicate enrollment requests with same key"
echo "2. Resume logic: Complete modules out of order, verify resume pointer"
echo "3. Audit logs: Check adminAuditLogs collection after admin operations"
echo "4. Counter semantics: Verify enrollmentCount increments only once per user"
echo "5. Archiving: Verify archived courses don't appear in public catalog"