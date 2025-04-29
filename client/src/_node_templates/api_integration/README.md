# API Integration Node

This node provides a standardized interface for making external API requests through the Integration Engine. It handles various HTTP methods, authentication, error handling, and response processing.

## Features

- Supports all standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Configurable request headers, body, and query parameters
- Optional proxy support through the Integration Engine
- Timeout and retry configuration
- Pagination support for handling large result sets
- Multiple authentication options (None, Basic, Bearer Token, OAuth, etc.)
- Comprehensive error handling with detailed error reporting

## How It Works

1. **Configuration**: Set up the API request details (URL, method, headers, etc.)
2. **Execution**: When the node runs, it sends the API request through the Integration Engine proxy
3. **Processing**: The response is processed and made available to downstream nodes
4. **Error Handling**: Any errors are captured and passed to the error output port

## Node Configuration

- **URL**: The API endpoint URL to request
- **Method**: HTTP method to use (GET, POST, PUT, DELETE, PATCH)
- **Headers**: HTTP headers to include in the request
- **Authentication**: Optional authentication configuration
  - **Auth Type**: The type of authentication (None, Basic, Bearer, OAuth, etc.)
  - **Auth Config**: Authentication details (credentials, tokens, etc.)
- **Advanced Options**:
  - **Use Proxy**: Whether to route requests through the Integration Engine proxy
  - **Timeout**: Request timeout in milliseconds
  - **Retries**: Number of retry attempts for failed requests
  - **Pagination**: Options for handling paginated responses

## Input Ports

- **url**: Optional URL override (string)
- **headers**: Additional headers to merge with the configured headers (object)
- **body**: Request body for POST, PUT, etc. (any)
- **params**: URL query parameters (object)

## Output Ports

- **response**: The API response data (object)
- **status**: HTTP status code (number)
- **headers**: Response headers (object)
- **error**: Error details if the request fails (object)

## Example Usage

```json
{
  "label": "GitHub API",
  "description": "Fetch data from GitHub API",
  "url": "https://api.github.com/repos/owner/repo",
  "method": "GET",
  "headers": {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "WorkflowApp"
  },
  "authType": "bearer",
  "authConfig": {
    "token": "github_token_here"
  },
  "useProxy": true,
  "timeout": 10000,
  "retries": 3
}
```

## Integration Notes

- For sensitive API keys or tokens, consider using environment variables or secrets
- The Integration Engine proxy provides additional benefits like:
  - Hiding API keys from client-side code
  - Rate limiting
  - Response caching
  - Error normalization
  - Consistent logging
- For complex API integrations, consider chaining with Function nodes for pre/post-processing

## Additional Resources

- See the Integration Engine documentation for more details on API proxying
- For custom API handling logic, consider using a Function node after this node