# Node Creation Simplified Guide

This guide provides a straightforward, step-by-step approach to creating new nodes in the workflow system. It focuses on practical implementation without unnecessary complexity.

## Basic Node Creation Checklist

### 1. Determine Node Location and Type
- **Standard Node**: Place in `client/src/nodes/[Category]/[node_type]/`
- **Integration Node**: Place in `client/src/nodes/Integration/[Category]/[node_type]/`

### 2. Required Files and Structure
Every node requires these three core files:

```
[node_type]/
├── definition.ts     # Defines node interface, ports, and metadata
├── executor.ts       # Contains execution logic
└── index.ts          # Exports node components
```

### 3. Required Elements

#### A. Node Definition (`definition.ts`)
```typescript
import { NodeDefinition } from '@/nodes/types';

export const definition: NodeDefinition = {
  type: 'your_node_type',            // Must be unique
  name: 'Human-Readable Node Name',  // Display name
  description: 'What the node does',
  category: 'category_name',         // e.g., 'processing', 'input', 'ai'
  icon: 'icon_name',                 // Optional: Lucide icon name
  version: '1.0.0',
  
  inputs: {
    // Define input ports
    input1: {
      type: 'string',
      description: 'Primary input',
    }
  },
  
  outputs: {
    // Define output ports
    output1: {
      type: 'string',
      description: 'Processing result',
    }
  },
  
  defaultData: {
    // Default configuration
    setting1: 'default value',
  }
};
```

#### B. Node Executor (`executor.ts`)
```typescript
import { NodeExecutionData } from '@/shared/nodeTypes';

// Node-specific data type (optional but recommended)
export interface YourNodeData {
  setting1: string;
  // Add other settings as needed
}

// Default data for testing (optional)
export const defaultData: YourNodeData = {
  setting1: 'default value',
};

/**
 * Node execution function
 */
export const execute = async (
  nodeData: YourNodeData,
  inputs: Record<string, any> = {},
  context?: any
): Promise<NodeExecutionData> => {
  try {
    // Start with metadata
    const startTime = new Date();
    
    // Get input data (if available)
    const inputValue = inputs?.input1?.items?.[0]?.json?.text || '';
    
    // Process data
    const result = `Processed: ${inputValue}`;
    
    // Return standardized output
    return {
      output1: {
        items: [{ 
          json: { text: result }
        }],
        meta: {
          startTime,
          endTime: new Date()
        }
      }
    };
  } catch (error) {
    // Standardized error handling
    return {
      output1: {
        items: [{ 
          json: { error: error instanceof Error ? error.message : String(error) }
        }],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          error: true,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      }
    };
  }
};
```

#### C. Index File (`index.ts`)
```typescript
import { definition } from './definition';
import { execute } from './executor';

// Export components
export { definition, execute };

// Default export
export default { definition, execute };
```

### 4. Optional Components

#### D. UI Component (`ui.tsx`)
If your node needs a configuration UI, add:

```typescript
import React from 'react';

// Node UI component
export const component = ({ data, updateNodeData }) => {
  // Handle setting changes
  const handleChange = (e) => {
    updateNodeData({
      ...data,
      [e.target.name]: e.target.value
    });
  };
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">
          Setting 1
        </label>
        <input
          type="text"
          name="setting1"
          value={data.setting1 || ''}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
};

// Update index.ts to include:
// import { component } from './ui';
// export { definition, execute, component };
// export default { definition, execute, component };
```

#### E. Tests (`tests.ts`)
For testable nodes, create:

```typescript
import { NodeTest } from '@/nodes/types/nodeTestsStandard';
import { execute, defaultData } from './executor';

const tests: NodeTest[] = [
  {
    name: 'Basic functionality',
    description: 'Tests the core node functionality',
    category: 'functionality',
    run: async () => {
      try {
        // Setup test input
        const inputs = {
          input1: {
            items: [{ json: { text: 'test input' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Run the executor
        const result = await execute({ ...defaultData }, inputs);
        
        // Verify output
        const output = result.output1?.items?.[0]?.json?.text;
        if (!output || !output.includes('test input')) {
          return {
            passed: false,
            message: `Expected output containing 'test input', got: ${output}`
          };
        }
        
        return {
          passed: true,
          message: 'Node correctly processed input'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

// IMPORTANT: Use default export for test discovery
export default tests;

// Update index.ts to include:
// import tests from './tests';
// export { definition, execute, component, tests };
// export default { definition, execute, component, tests };
```

## Examples

### Example 1: Simple Text Processing Node

#### Definition (`client/src/nodes/Processing/text_transformer/definition.ts`)
```typescript
import { NodeDefinition } from '@/nodes/types';

export const definition: NodeDefinition = {
  type: 'text_transformer',
  name: 'Text Transformer',
  description: 'Transforms text using different methods',
  category: 'processing',
  icon: 'type',
  version: '1.0.0',
  
  inputs: {
    text: {
      type: 'string',
      description: 'Text to transform',
    }
  },
  
  outputs: {
    result: {
      type: 'string',
      description: 'Transformed text',
    }
  },
  
  defaultData: {
    transformType: 'uppercase', // 'uppercase', 'lowercase', 'capitalize'
  }
};
```

#### Executor (`client/src/nodes/Processing/text_transformer/executor.ts`)
```typescript
import { NodeExecutionData } from '@/shared/nodeTypes';

export interface TextTransformerData {
  transformType: 'uppercase' | 'lowercase' | 'capitalize';
}

export const defaultData: TextTransformerData = {
  transformType: 'uppercase',
};

export const execute = async (
  nodeData: TextTransformerData,
  inputs: Record<string, any> = {},
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Get input text
    const inputText = inputs?.text?.items?.[0]?.json?.text || '';
    if (!inputText) {
      throw new Error('No input text provided');
    }
    
    // Process based on transformation type
    let result: string;
    switch (nodeData.transformType) {
      case 'uppercase':
        result = inputText.toUpperCase();
        break;
      case 'lowercase':
        result = inputText.toLowerCase();
        break;
      case 'capitalize':
        result = inputText
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        break;
      default:
        throw new Error(`Unknown transformation type: ${nodeData.transformType}`);
    }
    
    // Return result
    return {
      result: {
        items: [{ json: { text: result } }],
        meta: {
          startTime,
          endTime: new Date()
        }
      }
    };
  } catch (error) {
    return {
      result: {
        items: [{ json: { error: error instanceof Error ? error.message : String(error) } }],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          error: true,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      }
    };
  }
};
```

#### UI (`client/src/nodes/Processing/text_transformer/ui.tsx`)
```tsx
import React from 'react';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const component = ({ data, updateNodeData }) => {
  const handleTypeChange = (value) => {
    updateNodeData({
      ...data,
      transformType: value
    });
  };
  
  return (
    <div className="p-4">
      <div className="space-y-2">
        <Label>Transformation Type</Label>
        <Select 
          value={data.transformType || 'uppercase'} 
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uppercase">UPPERCASE</SelectItem>
            <SelectItem value="lowercase">lowercase</SelectItem>
            <SelectItem value="capitalize">Capitalize Words</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
```

#### Index (`client/src/nodes/Processing/text_transformer/index.ts`)
```typescript
import { definition } from './definition';
import { execute } from './executor';
import { component } from './ui';

export { definition, execute, component };
export default { definition, execute, component };
```

### Example 2: Number Calculator Node

#### Definition (`client/src/nodes/Math/calculator/definition.ts`)
```typescript
import { NodeDefinition } from '@/nodes/types';

export const definition: NodeDefinition = {
  type: 'calculator',
  name: 'Calculator',
  description: 'Performs basic math operations on numbers',
  category: 'math',
  icon: 'calculator',
  version: '1.0.0',
  
  inputs: {
    number1: {
      type: 'number',
      description: 'First number',
    },
    number2: {
      type: 'number',
      description: 'Second number',
    }
  },
  
  outputs: {
    result: {
      type: 'number',
      description: 'Calculation result',
    }
  },
  
  defaultData: {
    operation: 'add', // 'add', 'subtract', 'multiply', 'divide'
  }
};
```

#### Executor (`client/src/nodes/Math/calculator/executor.ts`)
```typescript
import { NodeExecutionData } from '@/shared/nodeTypes';

export interface CalculatorData {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
}

export const defaultData: CalculatorData = {
  operation: 'add',
};

export const execute = async (
  nodeData: CalculatorData,
  inputs: Record<string, any> = {},
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Get input numbers
    const num1 = Number(inputs?.number1?.items?.[0]?.json?.value ?? 0);
    const num2 = Number(inputs?.number2?.items?.[0]?.json?.value ?? 0);
    
    // Check for valid numbers
    if (isNaN(num1) || isNaN(num2)) {
      throw new Error('Invalid numbers provided');
    }
    
    // Perform calculation
    let result: number;
    switch (nodeData.operation) {
      case 'add':
        result = num1 + num2;
        break;
      case 'subtract':
        result = num1 - num2;
        break;
      case 'multiply':
        result = num1 * num2;
        break;
      case 'divide':
        if (num2 === 0) {
          throw new Error('Division by zero');
        }
        result = num1 / num2;
        break;
      default:
        throw new Error(`Unknown operation: ${nodeData.operation}`);
    }
    
    // Return result
    return {
      result: {
        items: [{ json: { value: result } }],
        meta: {
          startTime,
          endTime: new Date()
        }
      }
    };
  } catch (error) {
    return {
      result: {
        items: [{ json: { error: error instanceof Error ? error.message : String(error) } }],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          error: true,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      }
    };
  }
};
```

#### Tests (`client/src/nodes/Math/calculator/tests.ts`)
```typescript
import { NodeTest } from '@/nodes/types/nodeTestsStandard';
import { execute, defaultData } from './executor';

const tests: NodeTest[] = [
  {
    name: 'Addition',
    description: 'Tests addition operation',
    category: 'functionality',
    run: async () => {
      try {
        // Setup test data
        const nodeData = { ...defaultData, operation: 'add' };
        
        // Create inputs
        const inputs = {
          number1: {
            items: [{ json: { value: 5 } }],
            meta: { startTime: new Date() }
          },
          number2: {
            items: [{ json: { value: 3 } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Run test
        const result = await execute(nodeData, inputs);
        
        // Check result
        const output = result.result?.items?.[0]?.json?.value;
        if (output !== 8) {
          return {
            passed: false,
            message: `Expected 8, got ${output}`
          };
        }
        
        return {
          passed: true,
          message: 'Addition operation works correctly'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  {
    name: 'Division by zero',
    description: 'Tests error handling for division by zero',
    category: 'validation',
    run: async () => {
      try {
        // Setup test data
        const nodeData = { ...defaultData, operation: 'divide' };
        
        // Create inputs with divisor = 0
        const inputs = {
          number1: {
            items: [{ json: { value: 10 } }],
            meta: { startTime: new Date() }
          },
          number2: {
            items: [{ json: { value: 0 } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Run test
        const result = await execute(nodeData, inputs);
        
        // Check for error
        if (!result.result?.meta?.error) {
          return {
            passed: false,
            message: 'Expected error for division by zero'
          };
        }
        
        return {
          passed: true,
          message: 'Division by zero correctly handled'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

export default tests;
```

## Integration Nodes Guide

Integration nodes are specialized nodes that connect with external services through the Integration Engine. They require additional configuration and follow a specific pattern.

### Additional Requirements for Integration Nodes

#### 1. Location
Integration nodes must be placed in the Integration directory:
```
client/src/nodes/Integration/[Category]/[node_type]/
```

#### 2. Integration Configuration
The definition file must include an `integrationConfig` section:

```typescript
export const definition: NodeDefinition = {
  // Standard node properties...
  
  // Integration-specific configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: true,     // Whether this node provides an HTTP endpoint
      webhook: true,      // Whether this node acts as a webhook receiver
      scheduler: false    // Whether this node schedules operations
    },
    
    // What the node needs from the system
    requires: {
      storage: true,      // Whether node needs persistent storage
      authentication: false // Whether node requires authentication
    },
    
    // Endpoint configuration (if applicable)
    endpoint: {
      pathTemplate: 'webhooks/:path',  // URL path template with parameters
      methods: ['POST', 'GET'],        // Supported HTTP methods
      authTypes: ['none', 'apiKey'],   // Supported auth methods
    }
  }
};
```

#### 3. Integration Registration
Integration nodes must register with the Integration Engine in their executor:

```typescript
import { registerIntegration, getIntegrationUrl } from '@/utils/integrationClient';

export const execute = async (
  nodeData: YourNodeData,
  inputs?: any,
  context?: any
): Promise<NodeExecutionData> => {
  try {
    // If receiving webhook data, process it
    if (inputs?.webhook) {
      return {
        // Process webhook data
      };
    }
    
    // Register with integration engine
    const registrationResult = await registerIntegration({
      nodeType: 'your_node_type',
      capabilities: {
        provides: {
          endpoint: true,
          webhook: true
        },
        endpoint: {
          pathTemplate: 'webhooks/:path',
          methods: nodeData.methods || ['POST']
        }
      },
      workflowId: context?.workflowId,
      nodeId: context?.nodeId,
      description: nodeData.description || 'Webhook endpoint'
    });
    
    // Generate the full webhook URL
    const webhookUrl = getIntegrationUrl(registrationResult.path);
    
    // Return information about the registered webhook
    return {
      output: {
        items: [{
          json: {
            webhookUrl,
            path: registrationResult.path,
            methods: registrationResult.methods
          }
        }],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      }
    };
  } catch (error) {
    // Error handling
  }
};
```

### Example: Webhook Trigger Node

#### Definition (`client/src/nodes/Integration/Webhooks/webhook_trigger/definition.ts`)
```typescript
import { NodeDefinition } from '@/nodes/types';

export const definition: NodeDefinition = {
  type: 'webhook_trigger',
  name: 'Webhook Trigger',
  description: 'Creates a webhook endpoint for triggering workflows',
  category: 'triggers',
  icon: 'webhook',
  version: '1.0.0',
  
  inputs: {},  // No inputs for a trigger node
  
  outputs: {
    webhook: {
      type: 'object',
      description: 'Webhook payload',
    }
  },
  
  defaultData: {
    webhookPath: '',
    description: 'Webhook endpoint',
    methods: ['POST']
  },
  
  integrationConfig: {
    provides: {
      endpoint: true,
      webhook: true,
      scheduler: false
    },
    requires: {
      storage: true,
      authentication: false
    },
    endpoint: {
      pathTemplate: 'webhooks/:path',
      methods: ['POST', 'GET', 'PUT', 'DELETE'],
      authTypes: ['none', 'apiKey']
    }
  }
};
```

#### Executor (`client/src/nodes/Integration/Webhooks/webhook_trigger/executor.ts`)
```typescript
import { NodeExecutionData } from '@/shared/nodeTypes';
import { registerIntegration, getIntegrationUrl } from '@/utils/integrationClient';

export interface WebhookTriggerData {
  webhookPath: string;
  description: string;
  methods: string[];
}

export const defaultData: WebhookTriggerData = {
  webhookPath: '',
  description: 'Webhook endpoint',
  methods: ['POST']
};

export const execute = async (
  nodeData: WebhookTriggerData,
  inputs?: any,
  context?: any
): Promise<NodeExecutionData> => {
  try {
    // If we're in a workflow run with webhook data, process it
    if (inputs?.webhook) {
      // Process webhook data and return results
      return {
        webhook: {
          items: [{ json: inputs.webhook }],
          meta: {
            startTime: new Date(),
            endTime: new Date()
          }
        }
      };
    }
    
    // Extract context for registration
    const workflowId = context?.workflowId;
    const nodeId = context?.nodeId;
    
    if (!workflowId || !nodeId) {
      throw new Error('Integration node requires workflow context');
    }
    
    // Normalize path (remove leading/trailing slashes)
    const path = nodeData.webhookPath 
      ? nodeData.webhookPath.replace(/^\/+|\/+$/g, '')
      : `webhook-${workflowId}-${nodeId}`;
    
    // Register with integration engine
    const registrationResult = await registerIntegration({
      nodeType: 'webhook_trigger',
      capabilities: {
        provides: {
          endpoint: true,
          webhook: true
        },
        endpoint: {
          pathTemplate: `webhooks/${path}`,
          methods: nodeData.methods || ['POST']
        }
      },
      workflowId,
      nodeId,
      description: nodeData.description || 'Webhook endpoint'
    });
    
    // Generate the full webhook URL
    const webhookUrl = getIntegrationUrl(registrationResult.path);
    
    // Return information about the registered webhook
    return {
      webhook: {
        items: [{
          json: {
            webhookUrl,
            path: registrationResult.path,
            methods: registrationResult.methods,
            description: registrationResult.description
          }
        }],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      }
    };
  } catch (error) {
    console.error('Error in webhook trigger node:', error);
    
    // Return standardized error output
    return {
      webhook: {
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
      }
    };
  }
};
```

#### Tests (`client/src/nodes/Integration/Webhooks/webhook_trigger/tests.ts`)
```typescript
import { NodeTest } from '@/nodes/types/nodeTestsStandard';
import { execute, defaultData } from './executor';

const tests: NodeTest[] = [
  {
    name: 'Registration process',
    description: 'Tests webhook registration with the Integration Engine',
    category: 'functionality',
    run: async () => {
      try {
        // Mock context with workflow and node IDs
        const context = {
          workflowId: 123,
          nodeId: 'test-node-id'
        };
        
        // Custom webhook path
        const nodeData = {
          ...defaultData,
          webhookPath: 'test-webhook',
          methods: ['POST', 'GET']
        };
        
        // Execute registration
        const result = await execute(nodeData, {}, context);
        
        // Check webhook URL
        const webhookUrl = result.webhook?.items?.[0]?.json?.webhookUrl;
        if (!webhookUrl || !webhookUrl.includes('test-webhook')) {
          return {
            passed: false,
            message: `Expected URL containing 'test-webhook', got: ${webhookUrl}`
          };
        }
        
        // Check methods
        const methods = result.webhook?.items?.[0]?.json?.methods;
        if (!methods || !Array.isArray(methods) || methods.length !== 2) {
          return {
            passed: false,
            message: `Expected methods array with POST and GET, got: ${JSON.stringify(methods)}`
          };
        }
        
        return {
          passed: true,
          message: 'Webhook registration successful'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  {
    name: 'Webhook data processing',
    description: 'Tests webhook data processing functionality',
    category: 'functionality',
    run: async () => {
      try {
        // Mock webhook input data
        const inputs = {
          webhook: {
            body: { test: 'data' },
            headers: { 'content-type': 'application/json' },
            method: 'POST'
          }
        };
        
        // Execute with webhook data
        const result = await execute(defaultData, inputs);
        
        // Check output
        const outputData = result.webhook?.items?.[0]?.json;
        if (!outputData || !outputData.body || outputData.body.test !== 'data') {
          return {
            passed: false,
            message: `Expected webhook body with test data, got: ${JSON.stringify(outputData)}`
          };
        }
        
        return {
          passed: true,
          message: 'Webhook data processing successful'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

export default tests;
```

### Example: Perplexity API Node

#### Definition (`client/src/nodes/Integration/API/perplexity_api/definition.ts`)
```typescript
import { NodeDefinition } from '@/nodes/types';

export const definition: NodeDefinition = {
  type: 'perplexity_api',
  name: 'Perplexity API',
  description: 'Generates text using the Perplexity AI models',
  category: 'ai',
  icon: 'brain',
  version: '1.0.0',
  
  inputs: {
    prompt: {
      type: 'string',
      description: 'Text prompt for generation',
    }
  },
  
  outputs: {
    response: {
      type: 'string',
      description: 'Generated text response',
    },
    full_response: {
      type: 'object',
      description: 'Complete API response with metadata',
    }
  },
  
  defaultData: {
    system_prompt: '',
    model: 'llama-3.1-sonar-small-128k-online',
    temperature: 0.7,
    max_tokens: 1000
  },
  
  integrationConfig: {
    provides: {
      endpoint: false,
      webhook: false,
      ai: true
    },
    requires: {
      storage: false,
      authentication: true,
      apiKey: 'PERPLEXITY_API_KEY'
    }
  }
};
```

#### Executor (`client/src/nodes/Integration/API/perplexity_api/executor.ts`)
```typescript
import { NodeExecutionData } from '@/shared/nodeTypes';
import { makeIntegrationRequest } from '@/utils/integrationClient';

export interface PerplexityApiData {
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

export const defaultData: PerplexityApiData = {
  system_prompt: '',
  model: 'llama-3.1-sonar-small-128k-online',
  temperature: 0.7,
  max_tokens: 1000
};

export const execute = async (
  nodeData: PerplexityApiData,
  inputs: Record<string, any> = {},
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Get input prompt
    const promptText = inputs?.prompt?.items?.[0]?.json?.text;
    if (!promptText) {
      throw new Error('No prompt text provided');
    }
    
    // Prepare API request
    const messages = [];
    
    // Add system prompt if provided
    if (nodeData.system_prompt) {
      messages.push({
        role: 'system',
        content: nodeData.system_prompt
      });
    }
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: promptText
    });
    
    // Make API request through Integration Engine
    const response = await makeIntegrationRequest({
      url: 'https://api.perplexity.ai/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${PERPLEXITY_API_KEY}' // Placeholder - Integration Engine handles this
      },
      data: {
        model: nodeData.model,
        messages,
        max_tokens: nodeData.max_tokens,
        temperature: nodeData.temperature
      }
    });
    
    // Extract text response
    const responseText = response.choices?.[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response received from Perplexity API');
    }
    
    // Return results
    return {
      response: {
        items: [{ json: { text: responseText } }],
        meta: {
          startTime,
          endTime: new Date()
        }
      },
      full_response: {
        items: [{ json: response }],
        meta: {
          startTime,
          endTime: new Date()
        }
      }
    };
  } catch (error) {
    // Standardized error handling
    const errorOutput = {
      items: [{ json: { error: error instanceof Error ? error.message : String(error) } }],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        error: true,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    };
    
    return {
      response: errorOutput,
      full_response: errorOutput
    };
  }
};
```

## Final Notes

### Node Discovery Process

The system discovers nodes through:

1. File location (especially for Integration nodes)
2. Node type and category as defined in the definition file
3. Index exports that make components available to the registry

### Testing Your Nodes

1. Manual testing:
   - Navigate to the Node Debug Panel (`/node-debug`)
   - Select your node from the dropdown
   - Run tests to verify functionality

2. Integration testing:
   - Add your node to a workflow
   - Connect inputs and outputs
   - Run the workflow to see actual behavior

### Common Issues

1. **Node not appearing in palette**: Check if all required files are properly exported in index.ts
2. **Execution errors**: Verify input/output structure matches what connected nodes expect
3. **Integration issues**: For Integration nodes, ensure integrationConfig is properly defined
4. **Test failures**: Check for proper error handling and edge cases in your executor

### Best Practices

1. Always define proper types for your node data
2. Implement comprehensive error handling
3. Write tests for all core functionality
4. Keep node functionality focused and modular
5. Use consistent naming conventions for files and exports