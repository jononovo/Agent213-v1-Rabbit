#!/bin/bash

# Test script for verifying the three-server architecture
# Specifically focusing on the webhook handling migration from Workflow Execution to Integration Engine

echo "=== Testing the three-server architecture ==="
echo "Verifying webhook routes are correctly migrated to Integration Engine"

# 1. Test webhook path through main server to integration engine
echo -e "\n1. Sending webhook request to main application server..."
curl -s -X POST "http://localhost:5000/api/webhooks/workflow/1/node/webhook-trigger-1" \
  -H "Content-Type: application/json" \
  -d '{"query":"test architecture","searchId":"test-arch-1"}' | jq .

# 2. Check if integration engine is handling the webhook request
echo -e "\n2. Checking stats from integration engine..."
curl -s "http://localhost:3001/api/webhook-stats" | jq .

# 3. Verify workflow execution endpoint
echo -e "\n3. Testing workflow execution endpoint..."
curl -s -X POST "http://localhost:3002/api/execute" \
  -H "Content-Type: application/json" \
  -d '{"workflowId":1,"input":{"test":"data"}}' | jq .

echo -e "\n=== Architecture test complete ==="