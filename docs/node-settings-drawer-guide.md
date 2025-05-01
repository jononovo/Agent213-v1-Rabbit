# Node Settings Drawer Implementation Guide

This guide explains how to implement node-specific settings handlers for the Node Settings Drawer in the workflow platform.

## Overview

The Node Settings Drawer is a powerful component that provides a consistent interface for configuring nodes in the workflow editor. The latest implementation moves node-specific settings behavior directly into node definition files, following a modular approach that keeps each node responsible for its own data access needs.

## Key Concepts

1. **NodeSettingsHandlers**: An interface that defines the optional methods a node can implement to customize its settings behavior.

2. **Embedded Metadata Pattern**: Node settings handlers are embedded directly in the node definition structure via the `metadata.handlers` property.

3. **Self-sufficient Nodes**: Nodes are responsible for loading their own required data without relying on the drawer to know about their specific requirements.

## Implementing Node Settings Handlers

### 1. Basic Structure in Node Definition

To implement settings handlers, add a `metadata` section with a `handlers` object in your node definition:

```typescript
// In your node's definition.ts file
import { NodeDefinition } from '../../../core/types/nodeDefinitions';
import { SettingField } from '../../../core/types/nodeSettingsTypes';

const definition: NodeDefinition = {
  type: 'your_node_type',
  name: 'Your Node',
  description: 'Your node description',
  category: 'your_category',
  version: '1.0.0',
  
  // Add metadata with handlers directly in the definition
  metadata: {
    tags: ['tag1', 'tag2'],
    color: '#4A9CF5',
    // Handlers for settings behavior
    handlers: {
      // Initialize settings when drawer opens
      initializeSettings: (nodeData: Record<string, any>) => {
        const settings = { ...(nodeData.settings || {}) };
        // Custom initialization logic here
        return settings;
      },
      
      // Prepare data when saving
      prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
        const saveData = { ...settings };
        // Custom save preparation logic here
        return saveData;
      },
      
      // Handle setting changes
      handleSettingChange: (fieldId: string, value: any, currentSettings: Record<string, any>) => {
        // Custom change handling logic here
        return { ...currentSettings, [fieldId]: value };
      },
      
      // Load field options for dropdowns or other dynamic fields
      loadFieldOptions: async (fields: SettingField[]): Promise<SettingField[]> => {
        // Custom field options loading logic
        const updatedFields = [...fields];
        // Fetch data and update field options
        return updatedFields;
      }
    }
  },
  
  // Define settings fields
  settings: [
    // Your settings fields
  ],
  
  // Other node properties...
};

export default definition;
```

### 2. Available Handler Methods

#### `initializeSettings`

Transforms node data into settings object when the drawer is opened.

```typescript
initializeSettings: (nodeData: Record<string, any>) => {
  const settings = { ...(nodeData.settings || {}) };
  
  // Move properties from node data to settings if needed
  if (nodeData.specialProperty !== undefined) {
    settings.specialProperty = nodeData.specialProperty;
  }
  
  return settings;
}
```

#### `prepareSaveData`

Prepares the final data structure to save when settings are submitted.

```typescript
prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
  const saveData = { ...settings };
  
  // Add nodeProperties (like label and description)
  if (nodeProperties) {
    saveData.nodeProperties = nodeProperties;
  }
  
  // Move certain settings to node root level for easy access
  if (settings.specialProperty) {
    saveData.specialProperty = settings.specialProperty;
  }
  
  return saveData;
}
```

#### `handleSettingChange`

Handles custom logic when a setting value changes.

```typescript
handleSettingChange: (fieldId: string, value: any, currentSettings: Record<string, any>) => {
  const updatedSettings = { ...currentSettings, [fieldId]: value };
  
  // Add custom logic for interdependent settings
  if (fieldId === 'toggle' && value === true) {
    updatedSettings.relatedSetting = 'enabled';
  }
  
  return updatedSettings;
}
```

#### `loadFieldOptions`

Loads dynamic options for dropdown fields or other settings that require fetched data.

```typescript
loadFieldOptions: async (fields: SettingField[]): Promise<SettingField[]> => {
  try {
    // Fetch the required data
    const response = await fetch('/api/your-data-endpoint');
    if (!response.ok) throw new Error('Failed to fetch data');
    const items = await response.json();
    
    // Create a copy of the fields array to avoid mutating the original
    const updatedFields = [...fields];
    
    // Update the options for any field that needs it
    updatedFields.forEach(field => {
      if (field.key === 'itemId' || field.id === 'itemId') {
        field.options = items.map(item => ({
          value: item.id.toString(),
          label: item.name
        }));
      }
    });
    
    return updatedFields;
  } catch (error) {
    console.error('Error loading field options:', error);
    return fields; // Return original fields on error
  }
}
```

## Real-World Example: Embed Other Workflow Node

The "Embed Other Workflow" node demonstrates this pattern by loading workflow dropdown options:

```typescript
// In embed_other_workflow/definition.ts
const definition: NodeDefinition = {
  type: 'embed_other_workflow',
  name: 'Embed Other Workflow',
  description: 'Embed and run another workflow from within your current workflow',
  category: 'actions',
  version: '1.0.0',
  
  // Include metadata directly in the definition
  metadata: {
    tags: ['workflow', 'embed', 'run', 'trigger', 'integration'],
    color: '#4B5563',
    
    // Include handlers directly in metadata
    handlers: {
      initializeSettings: (nodeData: Record<string, any>) => {
        const settings = { ...(nodeData.settings || {}) };
        if (nodeData.workflowId !== undefined) {
          settings.workflowId = nodeData.workflowId.toString();
        }
        return settings;
      },
      
      prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
        const saveData = { ...settings };
        if (nodeProperties) {
          saveData.nodeProperties = nodeProperties;
        }
        if (settings.workflowId) {
          saveData.workflowId = settings.workflowId;
        }
        return saveData;
      },
      
      // Dynamic loading of workflow options
      loadFieldOptions: async (fields: SettingField[]): Promise<SettingField[]> => {
        try {
          // Fetch workflows directly from API
          const res = await fetch('/api/workflows');
          if (!res.ok) throw new Error('Failed to fetch workflows');
          const workflows = await res.json();
          
          // Map workflows to dropdown options format
          const workflowOptions = workflows.map((workflow: any) => ({
            value: workflow.id.toString(),
            label: workflow.name
          }));
          
          // Update the fields that need workflow options
          const updatedFields = [...fields];
          updatedFields.forEach(field => {
            if ((field.key === 'workflowId') || (field.id === 'workflowId')) {
              field.options = workflowOptions;
            }
          });
          
          return updatedFields;
        } catch (error) {
          console.error('Error fetching workflows:', error);
          return fields;
        }
      }
    }
  },
  
  // Define settings fields (options will be loaded dynamically)
  settings: [
    {
      key: 'workflowId',
      type: 'select',
      label: 'Target Workflow',
      description: 'The workflow that will be triggered by this node.',
      placeholder: 'Select target workflow',
      options: [] // This will be populated dynamically
    },
    // Other settings...
  ],
  
  // Other node properties...
};

export default definition;
```

## Best Practices

1. **Keep Node Data Access in the Node**: Nodes should fetch their own required data instead of relying on the drawer component.

2. **Use Proper Error Handling**: Always include try/catch blocks and return the original fields on error.

3. **Log Debugging Information**: Add console.log statements during development to trace data flow.

4. **Clone Data Before Modification**: Make copies of arrays and objects before modifying them to avoid side effects.

5. **Provide Meaningful Default Values**: Always include default values in your settings schema.

6. **Test Edge Cases**: Test with empty data, slow connections, and error conditions.

## Troubleshooting

### Field Options Not Loading

**Problem**: Dropdown options are not populating in the settings drawer.

**Solutions**:
- Check browser console for errors in the network request
- Verify the field key/id matches exactly what you're targeting in loadFieldOptions
- Ensure your response data has the correct structure
- Add debug logging in the loadFieldOptions handler

### Settings Not Saving Correctly

**Problem**: Changes made in the drawer don't persist after saving.

**Solutions**:
- Verify that prepareSaveData is returning the complete settings object
- Check if you're accidentally overwriting properties
- Make sure nodeProperties are being handled properly
- Test direct property access vs. settings object access

### Settings Not Initializing

**Problem**: The drawer opens but doesn't show the correct initial values.

**Solutions**:
- Verify your initializeSettings handler is extracting all relevant properties
- Check for type mismatches (string vs number) that might cause comparison issues
- Ensure the settings object structure matches what the drawer expects

## Advanced Topics

### Conditional Fields

You can implement conditional field visibility:

```typescript
settings: [
  {
    key: 'useAuthentication',
    type: 'checkbox',
    label: 'Use Authentication',
    default: false
  },
  {
    key: 'authType',
    type: 'select',
    label: 'Authentication Type',
    options: [
      { value: 'basic', label: 'Basic Auth' },
      { value: 'oauth', label: 'OAuth 2.0' }
    ],
    // Only show when useAuthentication is true
    showWhen: (settings) => settings.useAuthentication === true
  },
  {
    key: 'username',
    type: 'text',
    label: 'Username',
    // Only show when useAuthentication is true AND authType is basic
    showWhen: (settings) => 
      settings.useAuthentication === true && 
      settings.authType === 'basic'
  }
]
```

### Backend Validation

For values that need server-side validation:

```typescript
handleSettingChange: async (fieldId, value, currentSettings) => {
  const updatedSettings = { ...currentSettings, [fieldId]: value };
  
  if (fieldId === 'apiEndpoint') {
    try {
      // Validate the endpoint on the server
      const validateResponse = await fetch('/api/validate-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: value })
      });
      
      const result = await validateResponse.json();
      
      // Add validation result to settings
      updatedSettings.endpointValid = result.valid;
      updatedSettings.endpointError = result.valid ? null : result.error;
    } catch (error) {
      updatedSettings.endpointValid = false;
      updatedSettings.endpointError = 'Validation failed';
    }
  }
  
  return updatedSettings;
}
```

## Conclusion

The node settings drawer handlers architecture provides a clean, modular approach to node configuration. By keeping each node responsible for its own settings behavior, the system becomes more maintainable and flexible, allowing for easy addition of new node types without modifying the drawer component.

Following these patterns will ensure your nodes integrate properly with the workflow editor and provide a consistent user experience across the entire platform.