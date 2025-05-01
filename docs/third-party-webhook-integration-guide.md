# Third-Party Webhook Integration Guide

This guide provides practical examples and best practices for integrating external systems with the webhook functionality of our workflow platform.

## Contents

1. [Introduction](#introduction)
2. [Basic Webhook Integration](#basic-webhook-integration)
3. [Sending Webhook Requests](#sending-webhook-requests)
4. [Receiving Webhook Responses](#receiving-webhook-responses)
5. [Advanced Integration Patterns](#advanced-integration-patterns)
6. [Webhook Security](#webhook-security)
7. [Troubleshooting](#troubleshooting)

## Introduction

Our platform provides a robust webhook system that allows external applications to trigger workflows and receive processed results. This guide focuses on the practical aspects of integrating a third-party system with our webhook functionality.

## Basic Webhook Integration

### Webhook URL Structure

Every webhook has a URL in this format:
```
https://[server-domain]:3001/webhooks/workflow/[workflowId]/node/[nodeId]
```

Components:
- `server-domain`: The domain where the integration engine is hosted
- `workflowId`: Unique identifier for the workflow that will process the request
- `nodeId`: Identifier for the specific webhook_trigger node that will receive the data

### Integration Flow Overview

1. Obtain the webhook URL from the workflow designer
2. Send HTTP requests to this URL with your payload
3. Configure your workflow to process this data
4. Set up a send_to_webhook node to respond if needed

## Sending Webhook Requests

### HTTP Method Selection

- **POST** (most common): Use for creating or processing new data
- **GET**: Use for triggering workflows without complex data
- **PUT/PATCH**: Use for update operations if semantics are important

### Request Headers

Important headers to include:
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN  (if authentication is configured)
```

### Example Request (JavaScript)

```javascript
// Using fetch API
async function triggerWorkflow(searchQuery) {
  const webhookUrl = 'https://your-domain.com:3001/webhooks/workflow/17/node/webhook_trigger-123456';
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: searchQuery,
        searchId: `search_${Date.now()}`,
        callbackUrl: 'https://your-service.com/api/callbacks/search-results',
        userId: 1,
        parameters: {
          limit: 10,
          filters: {
            location: 'Chicago',
            specialty: 'Corporate Law'
          }
        }
      })
    });
    
    // For synchronous responses
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Webhook trigger failed:', error);
    throw error;
  }
}
```

### Example Request (Python)

```python
import requests
import json
import time

def trigger_workflow(search_query):
    webhook_url = 'https://your-domain.com:3001/webhooks/workflow/17/node/webhook_trigger-123456'
    
    payload = {
        "query": search_query,
        "searchId": f"search_{int(time.time())}",
        "callbackUrl": "https://your-service.com/api/callbacks/search-results",
        "userId": 1,
        "parameters": {
            "limit": 10,
            "filters": {
                "location": "Chicago",
                "specialty": "Corporate Law"
            }
        }
    }
    
    try:
        response = requests.post(
            webhook_url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )
        
        response.raise_for_status()  # Raise exception for 4XX/5XX status codes
        
        # For synchronous responses
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Webhook trigger failed: {e}")
        raise
```

### Example Request (cURL)

```bash
curl -X POST 'https://your-domain.com:3001/webhooks/workflow/17/node/webhook_trigger-123456' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "lawyers in chicago",
    "searchId": "search_1746098676735",
    "callbackUrl": "https://your-service.com/api/callbacks/search-results",
    "userId": 1,
    "parameters": {
      "limit": 10,
      "filters": {
        "location": "Chicago",
        "specialty": "Corporate Law"
      }
    }
  }'
```

## Receiving Webhook Responses

### Synchronous Responses

If the workflow is configured to respond immediately:

1. Make your request to the webhook URL
2. Wait for the HTTP response (which may take time depending on workflow complexity)
3. Parse the response according to your API contract

Example response:
```json
{
  "success": true,
  "searchId": "search_1746098676735",
  "results": [
    {
      "name": "Smith & Associates",
      "address": "123 Legal Ave, Chicago, IL",
      "phone": "(312) 555-1234",
      "website": "https://smith-associates.example.com",
      "rating": 4.8
    },
    {
      "name": "Chicago Legal Partners",
      "address": "456 Justice Blvd, Chicago, IL",
      "phone": "(312) 555-5678",
      "website": "https://chicago-legal.example.com",
      "rating": 4.6
    }
  ],
  "resultCount": 2,
  "executionTime": 1.25
}
```

### Asynchronous Responses (Callbacks)

For workflows that process data asynchronously:

1. Include a `callbackUrl` in your initial webhook request
2. The workflow will immediately return a 202 Accepted response
3. Implement an endpoint at your callbackUrl to receive the results
4. The workflow will POST the results to your callbackUrl when processing is complete

Example callback handler (Express.js):
```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/callbacks/search-results', (req, res) => {
  const results = req.body;
  
  // Validate the response
  if (!results.searchId) {
    return res.status(400).json({ error: 'Missing searchId' });
  }
  
  // Process the results
  console.log(`Received results for search ${results.searchId}`);
  
  // Store in database, notify users, etc.
  storeResults(results);
  
  // Acknowledge receipt
  res.status(200).json({ success: true });
});

app.listen(3000, () => {
  console.log('Callback server running on port 3000');
});
```

## Advanced Integration Patterns

### Request Correlation

Always include a unique identifier in your webhook requests to correlate requests with responses:

```javascript
const searchId = `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Include in your webhook request
const payload = {
  query: "lawyers in chicago",
  searchId: searchId,
  // other params...
};
```

### Error Handling

Be prepared to handle various error responses:

- HTTP 400: Invalid request format or missing parameters
- HTTP 404: Webhook endpoint not found
- HTTP 429: Rate limit exceeded
- HTTP 500: Server error during processing
- HTTP 504: Timeout during processing

Always implement proper error handling:
```javascript
try {
  const response = await fetch(webhookUrl, { /* ... */ });
  
  if (!response.ok) {
    if (response.status === 429) {
      // Implement exponential backoff retry
      await wait(1000);
      return triggerWorkflow(searchQuery); // Retry
    } else {
      const errorData = await response.json();
      throw new Error(`Webhook error: ${errorData.message || response.statusText}`);
    }
  }
  
  return await response.json();
} catch (error) {
  console.error('Webhook request failed:', error);
  // Fallback behavior
}
```

### Retry Mechanisms

Implement a robust retry mechanism for reliability:

```javascript
async function triggerWorkflowWithRetry(searchQuery, maxRetries = 3, delay = 1000) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await triggerWorkflow(searchQuery);
    } catch (error) {
      retries++;
      if (retries >= maxRetries) throw error;
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, retries - 1);
      console.log(`Retry ${retries} after ${backoffDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}
```

## Webhook Security

### Authentication Methods

Depending on the security configuration:

1. **API Key Authentication**:
   ```
   Authorization: ApiKey YOUR_API_KEY
   ```

2. **Bearer Token Authentication**:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

3. **HMAC Signature Validation**:
   For maximum security, implement HMAC signing of your requests:
   
   ```javascript
   const crypto = require('crypto');
   
   function signWebhookRequest(payload, secret) {
     const hmac = crypto.createHmac('sha256', secret);
     const signature = hmac.update(JSON.stringify(payload)).digest('hex');
     return signature;
   }
   
   // Include in your request headers
   headers: {
     'Content-Type': 'application/json',
     'X-Signature': signWebhookRequest(payload, 'your_shared_secret')
   }
   ```

### Payload Encryption

For sensitive data, consider encryption:

```javascript
const crypto = require('crypto');

function encryptPayload(payload, publicKey) {
  // Example using RSA encryption (simplified)
  const buffer = Buffer.from(JSON.stringify(payload));
  const encrypted = crypto.publicEncrypt(publicKey, buffer);
  return encrypted.toString('base64');
}

// Send encrypted payload
const encryptedData = encryptPayload(payload, PUBLIC_KEY);
fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ encryptedData })
});
```

## Troubleshooting

### Common Issues and Solutions

1. **Webhook Not Triggering**
   - Verify the webhook URL is correct (including workflowId and nodeId)
   - Check that the Integration Engine server is running
   - Ensure proper request format (method, headers, body)

2. **No Response Received**
   - Verify the workflow has a send_to_webhook node with respondToOriginal: true
   - Check workflow execution logs for errors
   - Verify the workflow is completing within timeout limits

3. **Callback Not Received**
   - Ensure your callbackUrl is publicly accessible
   - Check that the URL is correctly formatted and included in the request
   - Verify no firewalls or security settings are blocking incoming requests

### Debugging Tools

1. **Request Logging**
   ```javascript
   console.log('Sending webhook request:', {
     url: webhookUrl,
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload)
   });
   ```

2. **Response Inspection**
   ```javascript
   const response = await fetch(webhookUrl, { /* ... */ });
   console.log('Response status:', response.status);
   console.log('Response headers:', Object.fromEntries(response.headers.entries()));
   const data = await response.json();
   console.log('Response body:', data);
   ```

3. **Webhook Echo Test**
   Use a simple echo workflow that returns the exact payload it receives to verify connectivity.