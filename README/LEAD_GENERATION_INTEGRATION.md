# Lead Generation Integration

This document provides details on the Lead Generation integration built on the AI Agent Workflow Platform.

## Overview

The Lead Generation system enables external applications to discover companies, identify decision makers, find email addresses, and validate leads through a series of connected workflows. The entire process is managed by a master orchestration workflow that provides visibility into the complete lead generation pipeline.

## Architecture

The system consists of the following components:

1. **External API** - Located in `server/externalApi.ts`, this component handles API requests from external applications.
2. **Workflow Execution** - Simulates or triggers the execution of specialized workflows for each step of the lead generation process.
3. **Webhook Callbacks** - Provides real-time updates to external applications as the lead generation process progresses.

## Workflows

The system uses four specialized workflows:

1. **Company Discovery Workflow** - Discovers companies based on user queries and criteria.
2. **Decision Maker Identification Workflow** - Identifies decision makers at discovered companies.
3. **Email Discovery Workflow** - Finds email addresses for identified decision makers.
4. **Lead Export Workflow** - Formats and exports the final leads.

These workflows are orchestrated by a master Lead Generation Orchestration workflow that coordinates the entire process.

## External API

The external API provides endpoints for initiating and tracking lead generation searches. See `server/api-documentation.md` for detailed API documentation including request formats, response formats, and error handling.

### Key Endpoints:

- `POST /api/external/search` - Initiates a new lead generation search.
- `GET /api/external/search/{searchId}` - Retrieves the status of an ongoing search.

## Testing

A test script (`test_lead_generation_api.js`) is provided to demonstrate the API's functionality. It:

1. Sets up a webhook server to receive callbacks
2. Tests authentication and error handling
3. Makes a search request and tracks its progress
4. Displays callbacks received during the search process

To run the test:
```bash
node test_lead_generation_api.js
```

## Implementation Details

### Authentication

The API uses Bearer token authentication:
```
Authorization: Bearer lgapi_xxxxxxxxxxxxxxxx
```

### Webhook Callbacks

External applications provide a `callbackUrl` where search progress and results are sent as the lead generation process progresses.

#### Lead Gen Rabbit to Bear Webhook Integration

The integration between Lead Gen Rabbit and Bear uses a webhook-based system with the following specifications:

##### Endpoint Specifications
- **Base URL**: `https://Bear-App.replit.app/api/external-workflow/webhook`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json` (required)
  - `X-LGR-Search-ID`: `{search-id}` (identifies the search)
  - `X-LGR-Webhook-Type`: `search_progress` or `search_complete` (event type)
  - `User-Agent`: `Lead-Gen-Rabbit/1.0` (identifies the source)

##### Webhook Payload Schemas

###### Progress Update Format (10%, 35%, 70%)
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

###### Final Result Format (100%)
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

##### Webhook Response Format (from Bear)
```json
{
  "success": true|false,
  "message": "Human-readable message",
  "status": "in_progress|completed|failed"
}
```

##### Implementation Details

###### Webhook Sending Code (Lead Gen Rabbit Side)
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

###### Webhook Handling (Bear Side)
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

##### Testing the Webhook Integration

A test script is provided in `server/test-pittsburgh-search.ts` that demonstrates the webhook communication flow:

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
    
    // Send webhook and wait for response
    const result10pct = await sendWebhookCallback(callbackUrl, data10pct, {
      headers,
      timeout: 30000
    });
    
    // Additional progress updates at 35%, 70%, and 100% follow a similar pattern
  } catch (error) {
    console.error('Error in test script:', error);
  }
}
```

### Rate Limiting

The API includes rate limiting to ensure fair usage. Rate limit information is provided in response headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1682345678
```

For webhook calls specifically, a maximum rate of 60 requests per minute per search ID is enforced to prevent abuse.

### Error Handling

All errors follow a consistent format:
```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable message",
    "details": {
      "additional": "details"
    }
  }
}
```

## Design Choices

1. **Hybrid Approach** - We use both specialized workflows for each step of the lead generation process and a master orchestration workflow for better visibility and flexibility.
2. **Standard System Nodes** - We use standard system nodes (workflow_trigger, data_validator, etc.) rather than custom nodes for better compatibility.
3. **Incremental Updates** - External applications receive incremental updates as the process progresses, rather than waiting for the entire process to complete.
4. **Comprehensive API Integration** - The integration includes authentication, rate limiting, timeout handling, and structured error responses.
5. **Webhook-Based Communication** - Real-time progress updates are sent via webhooks to provide immediate visibility into the search process.
6. **Status-Driven Progress Tracking** - The webhook payloads include standardized status values ("in_progress", "completed", "failed") and numeric progress indicators (10%, 35%, 70%, 100%).
7. **Progressive Result Enrichment** - Initial updates contain minimal information, with subsequent updates providing increasingly detailed results as they become available.

## Sequence Flow

The webhook communication sequence follows this pattern:

1. External application initiates a search via API or interface
2. Lead Gen Rabbit begins processing and sends 10% progress webhook
3. Initial company matches are found and sent via 35% progress webhook
4. Refined company matches are sent via 70% progress webhook
5. Final, complete results are sent via 100% completion webhook
6. Bear acknowledges each webhook with appropriate status codes and response

## Recommendations for Implementation

1. **Error Handling** - Implement robust error handling for webhook failures
2. **Timeout Management** - Configure appropriate timeouts for webhook requests (30 seconds recommended)
3. **Logging** - Maintain comprehensive logs of all webhook requests and responses
4. **Retry Logic** - Implement exponential backoff retry for failed webhook deliveries
5. **Validation** - Strictly validate all incoming and outgoing webhook payloads