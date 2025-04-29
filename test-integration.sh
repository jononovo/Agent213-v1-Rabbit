#!/bin/bash

# Script to test the Integration Engine capability

echo "Testing Integration Engine..."

# Trigger the integration engine test
curl -X POST http://localhost:5000/api/test-integration-engine

echo -e "\n\nWaiting for test to complete (3 seconds)..."
sleep 3

# Test making direct requests to the integration endpoint
echo -e "\nTesting GET request to integration endpoint..."
curl -X GET http://localhost:5000/api/integration/test/test-param

echo -e "\n\nTesting POST request to integration endpoint..."
curl -X POST http://localhost:5000/api/integration/test/test-param \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from integration test!"}'

echo -e "\n\nTest complete!"