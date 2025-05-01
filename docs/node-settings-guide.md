# Node Settings Guide

This guide explains how to properly configure node settings in the workflow platform.

## Overview

Each node can define its own settings that will be displayed in the Node Settings Drawer.
Settings are defined in the node's `definition.ts` file and can include both UI configuration
and custom handlers for initialization, validation, and saving.

## Quick Start

Here's how to define settings for a simple node:

```typescript
// In your node's definition.ts file
import { NodeDefinition } from '../../../core/types/nodeDefinitions';
import { NodeSettingsTypes, createTextField, createSelectField } from '../../../core/base/BaseNode';

const definition: NodeDefinition = {
  // Node basics...
  
  // Define settings fields
  settings: [
    createTextField('apiKey', 'API Key', {
      description: 'Your API key for the service',
      required: true
    }),
    createSelectField('model', 'Model', {
      description: 'The model to use',
      options: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' }
      ],
      default: 'gpt-3.5-turbo'
    })
  ],
  
  // Other node properties...
};

// Add metadata with any custom handlers
export const nodeMetadata = {
  tags: ['api', 'ai'],
  color: '#4A9CF5',
  
  // Handlers for settings behavior
  handlers: {
    // Initialize settings from node data
    initializeSettings: (nodeData) => {
      // Start with existing settings or empty object
      const settings = { ...(nodeData.settings || {}) };
      
      // Copy fields from node data to settings
      ['apiKey', 'model'].forEach(key => {
        if (nodeData[key] !== undefined) {
          settings[key] = nodeData[key];
        }
      });
      
      return settings;
    },
    
    // Custom handling for setting changes
    handleSettingChange: (fieldId, value, currentSettings) => {
      // Create a copy of the current settings with the new value
      const updatedSettings = { ...currentSettings, [fieldId]: value };
      
      // Do any special handling based on the field
      if (fieldId === 'model' && value === 'gpt-4') {
        // Maybe update other related settings
        updatedSettings.maxTokens = 8192;
      }
      
      return updatedSettings;
    },
    
    // Prepare data for saving
    prepareSaveData: (settings, nodeProperties) => {
      const saveData = { ...settings };
      
      // Add nodeProperties (like label and description)
      if (nodeProperties) {
        saveData.nodeProperties = nodeProperties;
      }
      
      return saveData;
    }
  }
};

export default definition;
```

## Built-in Field Types

The system provides these standard field types:

- `text` - Single line text input
- `textarea` - Multi-line text area
- `number` - Numeric input
- `select` - Dropdown selection
- `checkbox` - Boolean checkbox
- `radio` - Radio button group
- `password` - Masked password input
- `json` - JSON editor field
- `code` - Code editor with syntax highlighting
- `workflow_selector` - Special field to select workflows

## Using Helper Functions

The BaseNode component provides helper functions to create properly formatted field configurations:

```typescript
// Import helpers
import { 
  createTextField, 
  createSelectField,
  createNumberField,
  createPasswordField,
  createWorkflowSelector
} from '../../../core/base/BaseNode';

// Use them in your settings definition
settings: [
  createTextField('name', 'Name', { required: true }),
  createSelectField('type', 'Type', {
    options: [
      { value: 'a', label: 'Type A' },
      { value: 'b', label: 'Type B' }
    ],
    default: 'a'
  }),
  createNumberField('timeout', 'Timeout (ms)', {
    min: 100,
    max: 30000,
    default: 5000
  }),
  createPasswordField('secretKey', 'Secret Key'),
  createWorkflowSelector('workflowId', 'Workflow')
]
```

## Custom Handlers

Your node can implement these handlers to customize settings behavior:

### initializeSettings

Called when the settings drawer is opened to prepare initial settings from node data.

```typescript
initializeSettings: (nodeData: Record<string, any>) => {
  // Transform nodeData into settings object
  return { /* settings object */ };
}
```

### handleSettingChange

Called when a setting value changes to handle custom logic or dependencies.

```typescript
handleSettingChange: (fieldId: string, value: any, currentSettings: Record<string, any>) => {
  // Update settings based on the change
  return { /* updated settings object */ };
}
```

### prepareSaveData

Called when settings are saved to prepare the final data structure.

```typescript
prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
  // Transform settings into final saved data
  return { /* final data object */ };
}
```

## Best Practices

1. **Use Helper Functions** - For consistent field formatting
2. **Implement All Handlers** - For complete control of the settings lifecycle
3. **Group Related Settings** - Use clear field labels and descriptions
4. **Validate Input** - Both in handlers and in the validation schema
5. **Handle Interactions** - Use `handleSettingChange` for interdependent fields

## Examples

### Example: API Node with Authentication

```typescript
settings: [
  createSelectField('authType', 'Authentication Type', {
    options: [
      { value: 'apiKey', label: 'API Key' },
      { value: 'oauth', label: 'OAuth 2.0' }
    ],
    default: 'apiKey'
  }),
  createTextField('apiKey', 'API Key', {
    description: 'Your API key',
    showWhen: (settings) => settings.authType === 'apiKey'
  }),
  createTextField('clientId', 'Client ID', {
    showWhen: (settings) => settings.authType === 'oauth'
  }),
  createPasswordField('clientSecret', 'Client Secret', {
    showWhen: (settings) => settings.authType === 'oauth'
  })
]
```

### Example: Function Node with Template Selection

```typescript
settings: [
  createSelectField('selectedTemplate', 'Template', {
    options: [
      { value: 'basic', label: 'Basic (return input)' },
      { value: 'transform', label: 'Data Transform' },
      { value: 'api', label: 'API Request' }
    ],
    default: 'basic'
  }),
  createTextareaField('code', 'Function Code', {
    placeholder: 'function process(input) {\n  // Your code here\n  return input;\n}'
  })
]

// With custom handler
handlers: {
  handleSettingChange: (fieldId, value, currentSettings) => {
    const updatedSettings = { ...currentSettings, [fieldId]: value };
    
    if (fieldId === 'selectedTemplate' && value) {
      // Update code field based on selected template
      const templateLibrary = {
        basic: `function process(input) {\n  return input;\n}`,
        transform: `function process(input) {\n  return { processed: input };\n}`,
        api: `async function process(input) {\n  const response = await fetch('https://api.example.com');\n  return await response.json();\n}`
      };
      
      if (value in templateLibrary) {
        updatedSettings.code = templateLibrary[value];
      }
    }
    
    return updatedSettings;
  }
}
```