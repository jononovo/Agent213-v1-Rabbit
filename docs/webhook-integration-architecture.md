# Webhook Integration Architecture Documentation

This document provides a comprehensive overview of the webhook system architecture, including how workflow execution, integration engine, and the test bench work together.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Server Components](#server-components)
3. [Webhook Trigger Node Registration Process](#webhook-trigger-node-registration-process)
4. [Webhook Data Flow](#webhook-data-flow)
5. [Response Handling with Send to Webhook Node](#response-handling-with-send-to-webhook-node)
6. [Third-Party Integration Guidelines](#third-party-integration-guidelines)
7. [Test Bench Execution Flow](#test-bench-execution-flow)
8. [Troubleshooting Guide](#troubleshooting-guide)

## System Architecture Overview

The system consists of three primary server components working together:

1. **Main Server (port 5000)** - Handles the frontend UI, user interactions, and workflow management.
2. **Integration Engine (port 3001)** - Manages webhook registrations and external API interactions.
3. **Workflow Execution Server (port 3002)** - Executes workflow nodes and manages the execution state.

These servers operate as separate processes but communicate with each other through HTTP APIs. This separation provides modularity, improved security, and better resource allocation.

### System Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│   Main Server   │<────>│  Integration    │<────>│   Workflow      │
│   (port 5000)   │      │  Engine         │      │   Execution     │
│                 │      │  (port 3001)    │      │   (port 3002)   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Browser UI     │      │  External       │      │  Workflow       │
│                 │      │  API Services   │      │  State Store    │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Server Components

### Main Server (Port 5000)

The Main Server is responsible for:

- Serving the React-based frontend UI
- Managing workflow definitions, nodes, and connections
- Providing the workflow editor interface
- Handling user authentication and permissions
- Storing workflow configurations in the database
- Proxying certain API requests to the Integration Engine and Workflow Execution Server

### Integration Engine (Port 3001)

The Integration Engine is dedicated to external integrations:

- Registering and managing webhook endpoints
- Receiving incoming webhook requests
- Forwarding webhook payloads to the Workflow Execution Server
- Managing API keys and credentials for external services
- Handling rate limiting and request validation
- Maintaining a registry of active webhooks

### Workflow Execution Server (Port 3002)

The Workflow Execution Server handles the actual execution of workflows:

- Running nodes in the correct sequence
- Maintaining workflow state during execution
- Handling timeouts and failure states
- Executing node-specific logic through executors
- Managing concurrent workflow executions
- Storing execution logs and results

## Webhook Trigger Node Registration Process

When a workflow containing a webhook_trigger node is executed, the following registration process occurs:

1. **Node Identification**:
   - The webhook_trigger node executor runs with nodeData containing workflow and node information
   - The executor extracts the workflowId and nodeId to uniquely identify this webhook endpoint

2. **Registration Request**:
   - The webhook_trigger node makes an API call to the Integration Engine using the `integrationClient.registerIntegration()` method
   - This request includes the webhook path template, supported methods, and node metadata:
```javascript
registrationResult = await integrationClient.registerIntegration({
  nodeType: 'webhook_trigger',
  capabilities: {
    provides: { endpoint: true, webhook: true },
    endpoint: {
      pathTemplate: `webhooks/workflow/${workflowId}/node/${nodeId}`,
      methods: ['POST', 'GET'],
      authTypes: ['none']
    }
  },
  workflowId: Number(workflowId),
  nodeId: nodeId,
  description: `Webhook for workflow ${workflowId}`
});
```

3. **Endpoint Creation**:
   - The Integration Engine receives this registration and creates a route for the specified path
   - It stores the registration in its registry, mapping the path to the workflow execution information
   - The webhook is now active and will forward any received requests to the Workflow Execution Server

4. **URL Generation**:
   - The webhook_trigger node receives confirmation of successful registration
   - It generates and returns the full webhook URL in its output:
```
https://[server-domain]:3001/webhooks/workflow/[workflowId]/node/[nodeId]
```

5. **Persistence**:
   - The webhook registration persists in the Integration Engine's registry until explicitly removed or the server restarts
   - For production use, registrations can be backed by a database for persistence across restarts

## Webhook Data Flow

When an external system sends a request to a registered webhook endpoint:

1. **Request Receipt**:
   - The Integration Engine receives the HTTP request at the registered endpoint
   - It extracts the workflowId and nodeId from the URL path
   - It validates the request against any configured security rules

2. **Request Processing**:
   - The Integration Engine creates a standardized webhook payload including:
     - Original HTTP method, headers, query parameters, and body
     - Timestamp and unique request ID
     - Metadata about the source of the request
   - It flags the request with `isWebhookRequest: true` and `respondDirectly: true` if needed

3. **Workflow Trigger**:
   - The Integration Engine forwards the request to the Workflow Execution Server
   - It includes the workflowId and nodeId to specify which workflow and node should handle the request
   - The Workflow Execution Server starts a new workflow execution instance

4. **Webhook Node Execution**:
   - The Workflow Execution Server activates the webhook_trigger node
   - The node receives the standardized payload and converts it to its output format
   - This output includes the original request data plus metadata about the webhook

5. **Data Propagation**:
   - The webhook_trigger node's output becomes the input to the next connected node
   - The data flows through the workflow according to the defined connections
   - Each node processes its inputs and produces outputs for downstream nodes

## Response Handling with Send to Webhook Node

When a workflow needs to respond to the original webhook request:

1. **Response Preparation**:
   - Typically, a send_to_webhook node is configured with `respondToOriginal: true`
   - This node receives data from previous nodes in the workflow

2. **Original Request Identification**:
   - The send_to_webhook node examines its input to identify if it's part of a webhook request
   - It checks for the `requestId` and `isWebhookRequest` flags that were set by the webhook_trigger node

3. **Response Routing**:
   - If the input contains a valid `requestId` and `isWebhookRequest` is true:
     - The node doesn't make a new HTTP request
     - Instead, it calls the Workflow Execution Server's internal API:
```javascript
const response = await fetch('http://localhost:3002/api/webhook-response', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    requestId: inputData.requestId,
    data: inputData.payload || inputData,
    statusCode: 200 // Default status code
  })
});
```

4. **Request Completion**:
   - The Workflow Execution Server maintains a map of pending webhook requests
   - When it receives a response for a specific requestId, it completes the corresponding HTTP response
   - The Integration Engine then sends this response back to the original caller

5. **Timeouts and Error Handling**:
   - If a workflow doesn't respond within a configurable timeout period, the system can:
     - Send a default response (e.g., 202 Accepted)
     - Respond with an error (e.g., 504 Gateway Timeout)
     - Continue to hold the connection open until a response is received

## Third-Party Integration Guidelines

For efficient integration with third-party systems:

### Sending Requests to Workflows

External systems should:

1. **Use the Full Webhook URL**:
   - Always use the complete URL provided by the webhook_trigger node
   - Include the protocol, domain, port, and full path: `https://domain:3001/webhooks/workflow/X/node/Y`

2. **Follow HTTP Standards**:
   - Use POST for creating or processing data (most common for webhooks)
   - Use GET for retrieving data or simple triggers
   - Set `Content-Type: application/json` for JSON payloads

3. **Structure Request Bodies**:
   - Send well-formed JSON objects as the request body
   - Include all necessary data fields for the workflow
   - Follow consistent naming conventions
   - Example:
```json
{
  "query": "lawyers in chicago",
  "searchId": "search_123456789",
  "callbackUrl": "https://your-service.com/api/callback",
  "userId": 1,
  "parameters": {
    "radius": "10mi",
    "specialization": "corporate"
  }
}
```

4. **Include Callback Information**:
   - If expecting an asynchronous response, include a callbackUrl
   - Provide any necessary authentication tokens for callbacks
   - Include correlation IDs for request tracking

### Receiving Responses from Workflows

When a workflow is configured to respond to the original webhook:

1. **Synchronous Responses**:
   - The external system makes a request and waits for a response
   - The workflow processes the request and returns a result within the same HTTP connection
   - The response structure should be documented and consistent:
```json
{
  "success": true,
  "message": "Search request processed",
  "data": {
    "results": [
      {"name": "Smith & Associates", "address": "123 Legal St, Chicago", "rating": 4.5},
      {"name": "Legal Eagles LLP", "address": "456 Court Ave, Chicago", "rating": 4.8}
    ],
    "count": 2,
    "searchId": "search_123456789"
  }
}
```

2. **Asynchronous Responses**:
   - The workflow acknowledges receipt with a quick response (HTTP 202)
   - Later, when processing is complete, the workflow uses a send_to_webhook node to POST results to the callbackUrl
   - The external system must implement an endpoint to receive these callbacks

3. **Error Handling**:
   - Workflows should return appropriate HTTP status codes (400, 404, 500, etc.)
   - Error responses should include clear error messages and codes:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "The search query is missing required parameters",
    "details": {
      "missingFields": ["radius", "specialization"]
    }
  }
}
```

## Test Bench Execution Flow

The Test Bench allows for testing workflows without requiring external requests:

1. **Test Initialization**:
   - User selects a workflow to test in the UI
   - The test bench loads the workflow definition
   - It prepares a test execution environment with simulated inputs

2. **Webhook Node Test Execution**:
   - When testing a workflow with a webhook_trigger node:
     - The node detects it's in test mode (via test_execution flag)
     - It simulates receiving a webhook request with test data
     - The node still registers with the Integration Engine, but marks the registration as a test

3. **Data Flow Testing**:
   - Test data propagates through the workflow just as real data would
   - The test bench displays the input and output of each node
   - Users can inspect the transformations happening at each step

4. **Response Testing**:
   - For send_to_webhook nodes with respondToOriginal:
     - The test bench simulates the response handling
     - It shows what would be sent back to the original requester
     - No actual external HTTP requests are made

5. **Test Result Analysis**:
   - The test bench provides execution metrics (timing, node counts)
   - It shows the final output that would be sent to external systems
   - Error states and exception handling can be observed

## Troubleshooting Guide

Common webhook-related issues and their solutions:

### Webhook Registration Issues

- **Symptom**: Webhook URL shows "undefined" for nodeId
  - **Solution**: Ensure the node has a valid ID; the system now has fallbacks to generate one if missing
  
- **Symptom**: Registration fails with 404 or connection error
  - **Solution**: Verify the Integration Engine server is running on port 3001

### Data Flow Problems

- **Symptom**: Data isn't passing correctly between nodes
  - **Solution**: Check that nodes are properly connected in the workflow
  - **Solution**: Verify the output format of upstream nodes matches the expected input format

- **Symptom**: Webhook payload isn't accessible in downstream nodes
  - **Solution**: Inspect the webhook_trigger node output format
  - **Solution**: Ensure data is under the expected property (usually in json or items[0].json)

### Response Issues

- **Symptom**: Original webhook caller doesn't receive a response
  - **Solution**: Verify the send_to_webhook node has respondToOriginal set to true
  - **Solution**: Check that the requestId is being properly passed through the workflow
  - **Solution**: Increase timeout settings if the workflow takes longer to execute

- **Symptom**: Response format doesn't match expectations
  - **Solution**: Adjust the send_to_webhook node's input to match the required response format
  - **Solution**: Use a function_node before send_to_webhook to transform data into the correct format