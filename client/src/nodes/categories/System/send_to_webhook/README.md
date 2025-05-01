# Send to Webhook Node

## Overview
The Send to Webhook node enables your workflow to communicate with external systems by sending data to webhook endpoints or APIs. It can also respond directly to incoming webhook requests that triggered the workflow.

## Key Features

- Send workflow data to external webhook URLs or API endpoints
- Respond to the original webhook trigger that started the workflow
- Configurable HTTP methods, headers, and content types
- Advanced retry and timeout settings
- Flexible error handling options

## Inputs and Outputs

### Inputs
- **data** - The data payload to send to the webhook endpoint or API. This can be any JSON-serializable object.

### Outputs
- **response** - The complete response from the webhook endpoint, including status code, headers, and body.
- **status** - HTTP status code returned by the endpoint.
- **error** - Error information if the webhook request fails.

## Settings

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| URL | Text | The destination URL where data will be sent | Empty |
| Method | Select | HTTP method to use (GET, POST, PUT, PATCH, DELETE) | POST |
| Content Type | Select | The content type header for the request | application/json |
| Headers | Text Area | Additional HTTP headers in JSON format | Empty |
| Respond to Original | Select | Whether to respond to the original webhook trigger instead of a new URL | No |
| Retry Count | Number | Number of retry attempts if the request fails | 3 |
| Retry Delay | Number | Delay between retry attempts (in milliseconds) | 1000 |
| Timeout | Number | Request timeout in milliseconds | 5000 |
| Error Handling | Select | How to handle errors (fail, warn, ignore) | fail |

## Usage Examples

### Sending Data to an External API

1. Connect a node that produces data (like a Function node) to this node
2. Configure the destination URL (e.g., `https://api.example.com/data`)
3. Set the appropriate HTTP method (typically POST)
4. Add any required headers (like API keys)
5. The node will send the data from its input to the specified URL

```
[Previous Node] → [Send to Webhook]
                   URL: https://api.example.com/data
                   Method: POST
                   Headers: {"Authorization": "Bearer your-api-key"}
```

### Responding to the Original Webhook

1. Start your workflow with a Webhook Trigger node
2. Process the data with intermediate nodes
3. Connect to the Send to Webhook node
4. Set "Respond to Original" to "Yes"
5. The node will send the data back to the original requester

```
[Webhook Trigger] → [Processing Nodes] → [Send to Webhook]
                                          Respond to Original: Yes
```

## Troubleshooting

- **Connection errors**: Verify the URL is correct and accessible from the workflow server
- **Authentication failures**: Check that your authorization headers are properly configured
- **Timeout errors**: Consider increasing the timeout value for slow-responding endpoints
- **Format errors**: Ensure your data is properly formatted according to the API's requirements

## Best Practices

1. **Security**: Never expose sensitive information in the URL. Use headers or the request body instead.
2. **Validation**: Validate your data before sending it to external systems.
3. **Error Handling**: Configure appropriate error handling based on your workflow's requirements.
4. **Authentication**: For authenticated endpoints, store API keys securely.
5. **Rate Limiting**: Be aware of rate limits on the receiving API and adjust retry settings accordingly.

## Related Nodes

- **Webhook Trigger** - Receives incoming webhook requests to start workflows
- **Function Node** - Process and transform data before sending to webhooks
- **Text Formatter** - Format string data that will be sent to webhooks