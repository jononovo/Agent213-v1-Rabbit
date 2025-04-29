# Processing Node Template

This template provides a foundation for creating nodes that process data using JavaScript functions.

## Features

- Custom JavaScript processing
- Timeout protection
- Simple interface
- Easy to extend

## How to Use This Template

1. **Copy this folder** to your desired location (e.g., `nodes/System/` or `nodes/Custom/`)
2. **Rename the node type** in `definition.ts` from `my_processing_node` to your chosen node type
3. **Update the node name and description** in `definition.ts`
4. **Implement your processing logic** in the settings UI

## Files Overview

- **definition.ts**: Defines node interface, inputs/outputs, and settings
- **executor.ts**: Contains execution logic for processing data
- **ui.tsx**: Renders the node in the workflow editor
- **tests.ts**: Basic test cases for verification
- **index.ts**: Exports the component and definition
- **README.md**: Documentation and usage guide

## Customization Points

Look for `CUSTOMIZE THIS` comments throughout the code to find specific areas to modify:

- **Node type and metadata**: Update node type, name, icon, and category
- **Processing logic**: Implement your JavaScript processing function

## Example Processing Logic

This template includes a simple example for processing different types of data:

```javascript
function process(data, options = {}) {
  // Example: Transform object properties
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const result = {};
    
    // Process each property
    for (const [key, value] of Object.entries(data)) {
      // Example transformation: convert strings to uppercase
      if (typeof value === 'string') {
        result[key] = value.toUpperCase();
      } else {
        result[key] = value;
      }
    }
    
    return {
      ...result,
      processed: true,
      timestamp: new Date().toISOString()
    };
  }
  
  // Example: Process array data
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return { ...item, processed: true };
      }
      return item;
    });
  }
  
  // For simple values, just return as is
  return data;
}
```