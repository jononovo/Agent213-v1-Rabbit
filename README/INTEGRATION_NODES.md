# Integration Nodes Guide

## Overview

Integration Nodes are specialized node types that can autonomously connect the workflow system with external services and APIs. These nodes use the Integration Engine to register their capabilities and handle incoming requests without requiring custom server-side code.

## Creating Integration Nodes

### Folder Structure

Integration nodes follow a specific folder structure for automatic discovery:

```
client/src/nodes/
└── Integration/
    └── CategoryName/
        └── node_type_name/
            ├── definition.ts    # Node definition with integration config
            ├── executor.ts      # Execution logic
            └── ui.tsx           # Configuration UI
```

Key points:
- All integration nodes must be placed under the `Integration/` directory
- Nodes are grouped by category (e.g., Webhooks, API, etc.)
- Each node has three standard files: definition, executor, and UI component

### Node Definition

The `definition.ts` file declares the node's metadata and integration capabilities:

```typescript
import { NodeDefinition } from '@nodes/types';

const definition: NodeDefinition = {
  type: 'my_integration_node',
  name: 'My Integration Node',
  description: 'Connects to external service X',
  category: 'integrations',
  icon: 'webhook',
  version: '1.0.0',
  
  inputs: {
    // Input definitions
  },
  
  outputs: {
    // Output definitions
  },
  
  defaultData: {
    // Default configuration
  },
  
  // Integration-specific configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: true,     // This node provides an HTTP endpoint
      webhook: true,      // This node acts as a webhook receiver
      scheduler: false    // This node doesn't schedule anything
    },
    
    // What the node needs from the system
    requires: {
      storage: true,       // Needs persistent storage
      authentication: true // Requires authentication
    },
    
    // Endpoint configuration (when provides.endpoint = true)
    endpoint: {
      pathTemplate: 'my-integration/:param',  // URL path template
      methods: ['POST', 'GET'],               // Supported HTTP methods
      authTypes: ['apiKey', 'bearer'],        // Supported auth methods
    }
  }
};

export default definition;
```

### Node Executor

The `executor.ts` file contains the execution logic and registers with the Integration Engine:

```typescript
import { registerIntegration, getIntegrationUrl } from '@utils/integrationClient';
import { NodeExecutionData } from '@lib/types/workflow';

// Node data structure
interface MyIntegrationNodeData {
  param1: string;
  param2: string;
  // Other configuration fields
}

/**
 * Execute the integration node
 */
export const execute = async (
  nodeData: MyIntegrationNodeData,
  inputs?: any,
  context?: any
): Promise<NodeExecutionData> => {
  try {
    // If we're in a workflow run with inputs, process them
    if (inputs) {
      // Process inputs and return results
      return {
        items: [{ json: { result: 'Processed input data' } }],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      };
    }
    
    // Extract context
    const workflowId = context?.workflowId;
    const nodeId = context?.nodeId;
    
    if (!workflowId || !nodeId) {
      throw new Error('Integration node requires workflow context');
    }
    
    // Register with integration engine
    const registrationResult = await registerIntegration({
      nodeType: 'my_integration_node',
      capabilities: {
        provides: {
          endpoint: true,
          webhook: true
        },
        endpoint: {
          pathTemplate: `custom/${nodeData.param1}/:value`,
          methods: ['POST', 'GET']
        }
      },
      workflowId,
      nodeId,
      description: nodeData.param2 || 'Integration endpoint'
    });
    
    // Generate the full URL
    const integrationUrl = getIntegrationUrl(registrationResult.path);
    
    // Return information about the registered integration
    return {
      items: [{
        json: {
          url: integrationUrl,
          path: registrationResult.path,
          methods: registrationResult.methods,
          description: registrationResult.description
        }
      }],
      meta: {
        startTime: new Date(),
        endTime: new Date()
      }
    };
  } catch (error) {
    console.error('Error in integration node executor:', error);
    
    return {
      items: [{
        json: {
          error: error instanceof Error ? error.message : String(error)
        }
      }],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        error: true,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    };
  }
};
```

### Node UI Component

The `ui.tsx` file provides the configuration interface for the node:

```typescript
import React, { useCallback } from 'react';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { getIntegrationBaseUrl } from '@utils/integrationClient';

/**
 * Integration Node Settings Component
 */
export default function MyIntegrationNodeSettings({ 
  data, 
  updateNodeData 
}: { 
  data: any; 
  updateNodeData: (data: any) => void;
}) {
  // Get base URL for displaying preview
  const baseUrl = getIntegrationBaseUrl();
  
  // Update node data
  const handleChange = useCallback((field: string, value: any) => {
    updateNodeData({
      ...data,
      [field]: value
    });
  }, [data, updateNodeData]);
  
  // Handle param1 change
  const handleParam1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange('param1', e.target.value);
  }, [handleChange]);
  
  // Handle param2 change
  const handleParam2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange('param2', e.target.value);
  }, [handleChange]);
  
  // Get current values with defaults
  const param1 = data.param1 || '';
  const param2 = data.param2 || '';
  
  // Calculate URL preview
  const urlPreview = `${baseUrl}/custom/${param1 || ':param1'}/:value`;
  
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="param1">Parameter 1</Label>
        <Input
          id="param1"
          value={param1}
          onChange={handleParam1Change}
          placeholder="Enter parameter 1"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="param2">Parameter 2</Label>
        <Input
          id="param2"
          value={param2}
          onChange={handleParam2Change}
          placeholder="Enter parameter 2"
        />
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
        <Label>Integration URL Preview</Label>
        <p className="text-sm font-mono mt-1 break-all">
          {urlPreview}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          This URL will be generated when the workflow is saved and run
        </p>
      </div>
    </div>
  );
}
```

## Integration Node Types

### Webhook Nodes

Webhook nodes create HTTP endpoints that external systems can call to trigger workflows:

- **Webhook Trigger**: Creates an endpoint that starts a workflow when called
- **Webhook Response**: Sends a response back to the caller
- **Webhook Auth Validator**: Validates authentication on incoming webhook requests

### API Integration Nodes

API integration nodes connect with external APIs:

- **API Request**: Makes HTTP requests to external APIs
- **API Endpoint**: Creates an API endpoint for external systems to call
- **API Authentication**: Handles authentication with external APIs

### Custom Integration Nodes

Custom integration nodes can be created for specific services:

- **Slack Integration**: Sends messages to Slack
- **Email Integration**: Sends emails
- **Database Integration**: Connects to external databases

## Testing Integration Nodes

### Debugging Tools

- Use the built-in Test Integration Engine script:
  ```bash
  curl -X POST http://localhost:5000/api/test-integration-engine
  ```

- Test specific endpoints directly:
  ```bash
  curl -X GET http://localhost:5000/api/integration/your-endpoint-path
  ```

### Browser Testing

After adding a node to a workflow, you can test it in the browser:

1. Add the integration node to a workflow
2. Save and run the workflow
3. Check the node output for the generated endpoint URL
4. Use a tool like Postman to make requests to the endpoint

## Best Practices

1. **Clear naming**: Use descriptive names for integration nodes
2. **Unique paths**: Ensure path templates are unique to avoid conflicts
3. **Error handling**: Implement comprehensive error handling
4. **Authentication**: Always consider security implications
5. **Documentation**: Document the expected payloads and responses
6. **Rate limiting**: Consider implementing rate limiting for public endpoints
7. **Validation**: Validate all incoming data before processing

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Endpoint not found | Check that the node registered correctly and the path matches |
| Authentication failure | Verify that auth headers match the expected format |
| Duplicate endpoint | Ensure path templates are unique across nodes |
| Request timeout | Increase timeout settings or process asynchronously |
| Missing parameters | Check path template and ensure required params are included |