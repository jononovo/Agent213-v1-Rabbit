# Webhook Integration Node

This node provides a webhook endpoint that can receive external HTTP requests and trigger workflow execution. It's a key component of the Integration Engine system, allowing workflows to be triggered by external events.

## Features

- Creates a unique webhook URL for each node instance
- Supports multiple HTTP methods (GET, POST, PUT, DELETE)
- Optional authentication for secure webhooks
- Exposes request payload, headers, and parameters to downstream nodes

## How It Works

1. **Registration**: When a workflow containing this node is deployed, the node registers a webhook endpoint with the Integration Engine.
2. **External Trigger**: External systems can make HTTP requests to the generated webhook URL.
3. **Workflow Execution**: When a request is received, the workflow is triggered with the request data.
4. **Data Processing**: The request payload, headers, and parameters are passed to connected nodes for processing.

## Node Configuration

- **Path**: The endpoint path for the webhook (e.g., `/incoming-webhook`)
- **Method**: The HTTP method to accept (GET, POST, PUT, DELETE)
- **Authentication**: Optional security for the webhook endpoint
  - **Require Auth**: Whether authentication is required
  - **Auth Type**: The type of authentication (token, basic, etc.)
  - **Webhook Secret**: Secret key for validating webhook requests

## Output Ports

- **payload**: The HTTP request body/payload
- **headers**: HTTP request headers
- **params**: URL query parameters and route parameters

## Example Usage

```json
{
  "label": "Order Webhook",
  "description": "Receives new orders from e-commerce platform",
  "path": "/orders/new",
  "method": "POST",
  "requireAuth": true,
  "authType": "bearer",
  "webhookSecret": "your-secret-key"
}
```

## Integration Notes

- This node is designed for the Integration Engine and requires it to be running
- The webhook URL is only generated when the workflow is deployed
- For local development, you may need to use a service like ngrok to expose your local server
- Webhook paths should be unique across the system to avoid conflicts

## Additional Resources

- See the Integration Engine documentation for more details on webhook configuration
- For custom webhook processing logic, consider using a Function node after this node