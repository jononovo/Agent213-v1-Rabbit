# Processing Node Template

This template provides a foundation for creating nodes that process data in various ways, from simple transformations to complex computations.

## Features

- Multiple processing modes:
  - **Transform**: Modify input data properties
  - **Filter**: Select items from arrays based on criteria
  - **Aggregate**: Combine array values (sum, average, etc.)
  - **Validate**: Check data against a schema
  - **Custom**: Define your own processing logic
- Robust error handling with multiple strategies
- Input validation
- Timeout protection
- Comprehensive test suite

## How to Use This Template

1. **Copy this folder** to your desired location (e.g., `nodes/System/` or `nodes/Custom/`)
2. **Rename the node type** in `definition.ts` from `my_processing_node` to your chosen node type
3. **Update the node name and description** in `definition.ts`
4. **Customize the processing logic** in `executor.ts` for your specific use case
5. **Adjust the UI component** in `ui.tsx` to reflect your node's appearance
6. **Implement specific tests** in `tests.ts` for your node's functionality

## Files Overview

- **definition.ts**: Defines node interface, inputs/outputs, settings, and validation
- **executor.ts**: Contains execution logic for processing data
- **ui.tsx**: Renders the node in the workflow editor
- **tests.ts**: Provides test cases for verifying node functionality
- **index.ts**: Exports the necessary components
- **README.md**: Documentation and usage guide

## Customization Points

Look for `CUSTOMIZE THIS` comments throughout the code to find specific areas to modify:

- **Node type and metadata**: Update node type, name, icon, and category
- **Processing logic**: Implement your specific data processing functionality
- **UI component**: Adjust how the node appears in the workflow editor
- **Tests**: Create relevant test cases for your implementation

## Processing Modes

Each processing mode comes with a template implementation:

### Transform Mode

Transforms input data by applying changes to properties.

```javascript
function process(data, options = {}) {
  // Transform each property in the input data
  const result = {};
  
  if (typeof data === 'object' && data !== null) {
    // Process object properties
    Object.entries(data).forEach(([key, value]) => {
      // Example transformation: convert strings to uppercase
      if (typeof value === 'string') {
        result[key] = value.toUpperCase();
      } 
      // Example transformation: double numbers
      else if (typeof value === 'number') {
        result[key] = value * 2;
      }
      // Pass through other types unchanged
      else {
        result[key] = value;
      }
    });
    
    // Add processing metadata
    result._processed = true;
    result._timestamp = new Date().toISOString();
  } else {
    // For non-object data, return as is
    return data;
  }
  
  return result;
}
```

### Filter Mode

Filters an array of items based on criteria.

```javascript
function process(data, options = {}) {
  // Filter an array of items based on criteria
  if (!Array.isArray(data)) {
    throw new Error('Input data must be an array for filter mode');
  }
  
  // Get filter criteria from options or use defaults
  const criteria = options.criteria || {};
  
  // Filter the array based on the criteria
  return data.filter(item => {
    // Check each criterion against the item
    for (const [key, value] of Object.entries(criteria)) {
      if (item[key] !== value) {
        return false;
      }
    }
    return true;
  });
}
```

### Aggregate Mode

Combines values from an array of objects.

```javascript
function process(data, options = {}) {
  // Aggregate values from an array of objects
  if (!Array.isArray(data)) {
    throw new Error('Input data must be an array for aggregate mode');
  }
  
  // Get aggregation field from options or use default
  const field = options.field || 'value';
  const method = options.method || 'sum';
  
  let result;
  
  switch (method) {
    case 'sum':
      result = data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
      break;
    case 'avg':
      result = data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) / (data.length || 1);
      break;
    case 'min':
      result = Math.min(...data.map(item => Number(item[field]) || 0));
      break;
    case 'max':
      result = Math.max(...data.map(item => Number(item[field]) || 0));
      break;
    case 'count':
      result = data.length;
      break;
    default:
      result = data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
  }
  
  return {
    result,
    method,
    field,
    count: data.length
  };
}
```

### Validate Mode

Validates input data against a schema.

```javascript
function process(data, options = {}) {
  // Validate input data against a schema
  const schema = options.schema || {
    required: ['id', 'name'],
    types: {
      id: 'string',
      name: 'string',
      age: 'number'
    }
  };
  
  const results = {
    valid: true,
    errors: [],
    data
  };
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (data[field] === undefined || data[field] === null) {
        results.valid = false;
        results.errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  // Check field types
  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (data[field] !== undefined && typeof data[field] !== expectedType) {
        results.valid = false;
        results.errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${typeof data[field]}`);
      }
    }
  }
  
  return results;
}
```

### Custom Mode

For custom processing logic not covered by the standard modes.

```javascript
function process(data, options = {}) {
  // Custom processing example: data enrichment
  
  // Create a copy of the input to avoid modifying the original
  const processed = typeof data === 'object' ? { ...data } : data;
  
  // Add processing metadata
  const metadata = {
    processed: true,
    timestamp: new Date().toISOString(),
    processorId: 'custom-processor'
  };
  
  // Combine data with metadata
  return {
    data: processed,
    metadata,
    options
  };
}
```

## Error Handling

The node supports three error handling strategies:

- **Throw**: Stops the workflow when an error occurs (default)
- **Continue**: Provides error information but allows the workflow to continue
- **Fallback**: Uses a specified fallback value when an error occurs