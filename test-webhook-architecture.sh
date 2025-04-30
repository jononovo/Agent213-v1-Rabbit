#!/bin/bash

# Test script to verify the webhook architecture
# This test verifies that webhook requests flow correctly through our three-server architecture:
# 1. Main Application Server (5000) receives webhook requests
# 2. Main Application Server forwards requests to Integration Engine (3001)
# 3. Integration Engine forwards execution requests to Workflow Execution Server (3002)
# 4. Workflow Execution Server processes the workflow and sends results back

echo "=== Testing Webhook Architecture Flow ==="

# 1. Test direct webhook endpoint
echo -e "\n1. Sending webhook request to main server..."
curl -s -X POST "http://localhost:5000/api/webhooks/workflow/1/node/webhook-trigger-1" \
  -H "Content-Type: application/json" \
  -d '{"query":"test company search","searchId":"architecture-test-1"}' | jq .

sleep 1

# 2. Check integration engine webhook stats
echo -e "\n2. Checking webhook stats from integration engine..."
curl -s "http://localhost:3001/api/webhook-stats" | jq .

# 3. Test workflow execution endpoint directly
echo -e "\n3. Testing direct workflow execution endpoint..."
curl -s -X POST "http://localhost:3002/api/execute" \
  -H "Content-Type: application/json" \
  -d '{"workflowId":1,"input":{"startNodeId":"webhook-trigger-1","payload":{"query":"direct test","searchId":"direct-test-1"}}}' | jq .

echo -e "\n=== Architecture test complete ==="