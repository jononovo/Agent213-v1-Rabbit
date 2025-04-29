#!/bin/bash

# Test the Perplexity API integration via the Integration Engine
#
# This test script sends a request to the Perplexity API through the Integration Engine
# and verifies that we receive a valid response

echo "Testing Perplexity API integration..."

# The prompt to send to Perplexity
PROMPT="What are the main features of TypeScript that make it better than JavaScript?"

# The system prompt to provide context (optional)
SYSTEM_PROMPT="You are a helpful programming assistant. Be concise and focus on practical benefits."

# Make the request to our Integration Engine
RESPONSE=$(curl -s -X POST http://localhost:3001/api/integration/perplexity \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"$PROMPT\",
    \"systemPrompt\": \"$SYSTEM_PROMPT\",
    \"temperature\": 0.7,
    \"maxTokens\": 500
  }"
)

# Check if we got a valid response
if echo "$RESPONSE" | grep -q "choices"; then
  echo "✅ Success! Received valid response from Perplexity API via Integration Engine"
  echo ""
  echo "Response preview:"
  echo "$RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"//;s/"$//'
  echo ""
else
  echo "❌ Error: Did not receive a valid response"
  echo ""
  echo "Response:"
  echo "$RESPONSE"
  echo ""
fi

echo "Test complete."