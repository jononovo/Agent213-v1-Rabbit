# Lead Gen Rabbit to Bear Integration: Technical Specification

## Overview

This document provides a comprehensive technical specification for the webhook integration between Lead Gen Rabbit and Bear. The integration enables Lead Gen Rabbit to send real-time search progress updates and results to Bear through a webhook-based system.

## System Architecture

The integration follows a unidirectional webhook pattern where:

1. Lead Gen Rabbit acts as the webhook sender (client)
2. Bear acts as the webhook receiver (server)
3. Updates flow from Lead Gen Rabbit → Bear
4. Bear processes and acknowledges the updates

## Endpoint Specifications

### Base URL
```
https://Bear-App.replit.app/api/external-workflow/webhook
```

### Method
`POST`

### Headers
| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Defines payload format |
| `X-LGR-Search-ID` | `{search-id}` | Unique identifier for the search session |
| `X-LGR-Webhook-Type` | `search_progress` or `search_complete` | Identifies the webhook event type |
| `User-Agent` | `Lead-Gen-Rabbit/1.0` | Identifies the client application |

## Payload Schema

### Progress Update Format (10%, 35%, 70%)
```json
{
  "searchId": "unique-search-identifier",
  "status": "in_progress",
  "stage": "COMPANY_SEARCH_INITIAL|COMPANY_SEARCH_PROCESSING|COMPANY_SEARCH_REFINING",
  "progress": 10|35|70,
  "timestamp": "2025-04-26T21:12:09.968Z",
  "results": {
    "companies": [
      {
        "name": "Company Name",
        "website": "https://company-website.com",
        "industry": "Industry",
        "score": 85,
        "description": "Company description text",
        "location": "City, State",
        "employeeCount": "50-100"
      }
    ],
    "metadata": {
      "moduleType": "COMPANY_SEARCH",
      "completedSearches": ["initial", "refinement"],
      "message": "Progress update message"
    }
  }
}
```

### Final Result Format (100%)
```json
{
  "searchId": "unique-search-identifier",
  "status": "completed",
  "progress": 100,
  "timestamp": "2025-04-26T21:12:09.968Z",
  "results": {
    "companies": [
      {
        "name": "Company Name",
        "website": "https://company-website.com",
        "industry": "Industry",
        "location": "City, State",
        "description": "Company description text",
        "employeeCount": 87,
        "foundedYear": 2005,
        "revenue": "$10M-$50M",
        "headquarters": "City, State"
      }
    ],
    "metadata": {
      "moduleType": "COMPANY_OVERVIEW",
      "validationScores": {
        "companyScore": 90
      }
    }
  }
}
```

## Status Codes and Responses

### Bear Response Format
```json
{
  "success": true|false,
  "message": "Human-readable message",
  "status": "in_progress|completed|failed"
}
```

### HTTP Status Codes
| Status Code | Description |
|-------------|-------------|
| 200 | Webhook received and processed successfully |
| 400 | Bad request (invalid payload or headers) |
| 401 | Unauthorized (invalid or missing authentication) |
| 404 | Endpoint not found |
| 500 | Server error processing the webhook |

## Sequence Diagram

```
┌────────────────────┐                      ┌────────────────┐
│   Lead Gen Rabbit  │                      │      Bear      │
└─────────┬──────────┘                      └────────┬───────┘
          │                                          │
          │  POST /api/external-workflow/webhook     │
          │  (10% progress update)                   │
          │ ─────────────────────────────────────────>
          │                                          │
          │  200 OK                                  │
          │ <─────────────────────────────────────────
          │                                          │
          │  POST /api/external-workflow/webhook     │
          │  (35% progress update)                   │
          │ ─────────────────────────────────────────>
          │                                          │
          │  200 OK                                  │
          │ <─────────────────────────────────────────
          │                                          │
          │  POST /api/external-workflow/webhook     │
          │  (70% progress update)                   │
          │ ─────────────────────────────────────────>
          │                                          │
          │  200 OK                                  │
          │ <─────────────────────────────────────────
          │                                          │
          │  POST /api/external-workflow/webhook     │
          │  (100% completion)                       │
          │ ─────────────────────────────────────────>
          │                                          │
          │  200 OK                                  │
          │ <─────────────────────────────────────────
          │                                          │
┌─────────┴──────────┐                      ┌────────┴───────┐
│   Lead Gen Rabbit  │                      │      Bear      │
└────────────────────┘                      └────────────────┘
```

## Implementation Details

### Request Flow
1. Lead Gen Rabbit initiates a search based on user query parameters
2. Search processing begins with initial data gathering (10% progress)
3. Each stage of the search is reported via webhook to Bear (35%, 70%)
4. Final results are sent with "completed" status and 100% progress
5. Bear acknowledges each webhook with appropriate status code and response

### Server-Side Processing
The webhook receiver in Bear follows these steps:
1. Validates the HTTP method (must be POST)
2. Parses and validates the JSON payload
3. Verifies required headers
4. Processes the payload based on status and progress
5. For "in_progress" updates, stores intermediate results
6. For "completed" status, finalizes the search and stores complete results
7. Returns appropriate HTTP response

### Error Handling
1. Invalid payload format returns 400 Bad Request
2. Missing required fields returns 400 with specific error message
3. Server processing errors return 500 with error details
4. Validation failures for search parameters return 400 with validation details

## Security Considerations

### Authentication
- Bearer token authentication can be added if needed
- IP allowlisting can restrict webhook sources to Lead Gen Rabbit servers

### Data Validation
- All incoming payloads are strictly validated against schema
- Search IDs are verified to prevent webhook spoofing
- Progress values are validated for monotonic increases

### Rate Limiting
- Webhook endpoint employs rate limiting to prevent abuse
- Maximum 60 requests per minute per search ID

## Code Implementation

### Webhook Sending (Lead Gen Rabbit Side)
```typescript
async function sendWebhookCallback(
  callbackUrl: string, 
  data: any, 
  options: { 
    method?: string, 
    headers?: Record<string, string>,
    timeout?: number,
    logPrefix?: string
  } = {}
): Promise<any> {
  const { 
    method = 'POST', 
    headers = { 'Content-Type': 'application/json' },
    timeout = 10000,
    logPrefix = 'WebhookCallback'
  } = options;

  // Generate a unique ID for this callback
  const callbackId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    log(`[${logPrefix}] [${callbackId}] Sending callback to ${callbackUrl}`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(callbackUrl, {
      method,
      headers,
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`[${logPrefix}] [${callbackId}] Callback failed with status ${response.status}: ${errorText}`);
      return { 
        success: false, 
        status: response.status, 
        message: `Callback failed with status ${response.status}`,
        error: errorText
      };
    }
    
    const responseData = await response.json().catch(() => ({}));
    log(`[${logPrefix}] [${callbackId}] Callback sent successfully`);
    
    return { 
      success: true,
      status: response.status,
      data: responseData
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`[${logPrefix}] [${callbackId}] Error sending callback: ${errorMessage}`);
    console.error(`[${logPrefix}] Error details:`, error);
    
    return {
      success: false,
      message: `Error sending callback: ${errorMessage}`,
      error: String(error)
    };
  }
}
```

### Webhook Handling (Bear Side)
```typescript
app.post('/api/external-workflow/webhook', async (req: Request, res: Response) => {
  try {
    // Extract and validate payload
    const payload = req.body;
    
    // Validate required fields
    if (!payload.searchId || !payload.status || !payload.results) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: searchId, status, or results'
      });
    }
    
    // Validate status
    if (!['in_progress', 'completed', 'failed'].includes(payload.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: in_progress, completed, failed'
      });
    }
    
    // Process the webhook based on status
    if (payload.status === 'in_progress') {
      // Store progress update
      await storeProgressUpdate(payload);
      
      return res.status(200).json({
        success: true,
        message: `Webhook received for searchId: ${payload.searchId}`,
        status: 'in_progress'
      });
    } else if (payload.status === 'completed') {
      // Store final results
      await storeFinalResults(payload);
      
      return res.status(200).json({
        success: true,
        message: `Webhook received for searchId: ${payload.searchId}`,
        status: 'completed'
      });
    } else {
      // Handle failure status
      await storeSearchFailure(payload);
      
      return res.status(200).json({
        success: true,
        message: `Webhook received for searchId: ${payload.searchId}`,
        status: 'failed'
      });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
```

## Testing and Verification

### Test Script for Progress Updates
```typescript
async function testPittsburghSearch() {
  console.log('=== Testing "mid-sized manufacturing companies in Pittsburgh" search ===');
  
  // Bear API endpoint
  const callbackUrl = 'https://Bear-App.replit.app/api/external-workflow/webhook';
  const headers = {
    'Content-Type': 'application/json',
    'X-LGR-Search-ID': 'pittsburgh-manufacturing-search',
    'X-LGR-Webhook-Type': 'search_progress',
    'User-Agent': 'Lead-Gen-Rabbit/1.0'
  };
  
  // Create a unique search ID for this test
  const searchId = `pittsburgh-manufacturing-${Date.now()}`;
  console.log(`Using searchId: ${searchId}`);
  
  try {
    // Send 10% progress update
    const data10pct = {
      searchId,
      status: "in_progress",
      stage: "COMPANY_SEARCH_INITIAL",
      progress: 10,
      timestamp: new Date().toISOString(),
      results: {
        companies: [],
        metadata: {
          moduleType: "COMPANY_SEARCH",
          completedSearches: [],
          message: "Starting search for mid-sized manufacturing companies in Pittsburgh..."
        }
      }
    };
    
    console.log('\n[1/4] Sending 10% progress update...');
    const result10pct = await sendWebhookCallback(callbackUrl, data10pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear10Pct'
    });
    console.log(`Status: ${result10pct.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 35% progress update
    // ... similar code for 35%, 70%, and 100% updates ...
  } catch (error) {
    console.error('Error in test script:', error);
  }
}
```

## Monitoring and Debugging

### Logging System
The integration implements comprehensive logging at all stages:

1. Pre-request logging captures the intent to send a webhook
2. Request logging captures the full request payload and headers
3. Response logging captures the response from Bear
4. Error logging captures any failures in the process

### Diagnostic Tools
1. Request IDs are generated for each webhook for traceability
2. Timestamps are included in all logs for time-sequence analysis
3. Status codes and response bodies are preserved for debugging

## Performance Considerations

### Timeout Management
- Webhook requests use a 30-second timeout for production
- Configurable keep-alive periods ensure webhook delivery

### Retry Logic
- Failed webhook deliveries can be retried with exponential backoff
- Maximum 3 retry attempts for failed webhooks

### Connection Optimization
- HTTP/2 support for improved connection reuse
- Persistent connections when multiple webhooks are sent sequentially

## Extended Example: Complete Search Flow

```javascript
// Sample code showing a complete search flow with all progress updates

// Initial 10% progress (search started)
await sendWebhookCallback('https://Bear-App.replit.app/api/external-workflow/webhook', {
  searchId: 'pittsburgh-manufacturing-1745701864215',
  status: 'in_progress',
  stage: 'COMPANY_SEARCH_INITIAL',
  progress: 10,
  timestamp: new Date().toISOString(),
  results: {
    companies: [],
    metadata: {
      moduleType: 'COMPANY_SEARCH',
      completedSearches: [],
      message: 'Starting search...'
    }
  }
}, { headers: standardHeaders });

// 35% progress (initial results)
await sendWebhookCallback('https://Bear-App.replit.app/api/external-workflow/webhook', {
  searchId: 'pittsburgh-manufacturing-1745701864215',
  status: 'in_progress',
  stage: 'COMPANY_SEARCH_PROCESSING',
  progress: 35,
  timestamp: new Date().toISOString(),
  results: {
    companies: [
      {
        name: 'Pittsburgh Precision Manufacturing',
        website: 'https://pittsburghprecision.com',
        industry: 'Manufacturing',
        score: 85
      }
    ],
    metadata: {
      moduleType: 'COMPANY_SEARCH',
      completedSearches: ['initial'],
      message: 'Initial results found'
    }
  }
}, { headers: standardHeaders });

// 70% progress (refined results)
await sendWebhookCallback('https://Bear-App.replit.app/api/external-workflow/webhook', {
  searchId: 'pittsburgh-manufacturing-1745701864215',
  status: 'in_progress',
  stage: 'COMPANY_SEARCH_REFINING',
  progress: 70,
  timestamp: new Date().toISOString(),
  results: {
    companies: [
      // Multiple company entries with more details
    ],
    metadata: {
      moduleType: 'COMPANY_SEARCH',
      completedSearches: ['initial', 'refinement'],
      message: 'Results refined'
    }
  }
}, { headers: standardHeaders });

// 100% progress (completed)
await sendWebhookCallback('https://Bear-App.replit.app/api/external-workflow/webhook', {
  searchId: 'pittsburgh-manufacturing-1745701864215',
  status: 'completed',
  progress: 100,
  timestamp: new Date().toISOString(),
  results: {
    companies: [
      // Complete company data with all available fields
    ],
    metadata: {
      moduleType: 'COMPANY_OVERVIEW',
      validationScores: {
        companyScore: 90
      }
    }
  }
}, { headers: standardHeaders });
```

## Conclusion

This technical specification provides a comprehensive guide for implementing the Lead Gen Rabbit to Bear webhook integration. It covers all aspects of the integration from endpoint specifications to payload formats, error handling, security considerations, and implementation details.

The webhook-based design allows for real-time updates as search progresses, enabling Bear to provide a responsive user experience that reflects the current state of Lead Gen Rabbit's search process.