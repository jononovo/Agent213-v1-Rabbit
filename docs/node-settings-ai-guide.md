# Node Settings Framework: AI Developer Guide

> 📘 **AI AGENT NOTE**: This documentation is specifically formatted to help AI agents quickly understand how to implement node settings correctly in this system.

## Core Concepts

Every node in the system can define:
1. Setting fields that appear in the UI
2. Handlers that process these settings

## Setting Field Structure

Setting fields must follow this structure:

```typescript
interface SettingField {
  id: string;         // Unique identifier
  label: string;      // Display label
  type: SettingFieldType; // Field type (see below)
  description?: string; // Help text
  placeholder?: string; // Input placeholder
  options?: Array<{ value: string; label: string }>; // For select/radio
  defaultValue?: any; // Default value
  required?: boolean; // Is this field required?
  min?: number;      // For number fields
  max?: number;      // For number fields
  step?: number;     // For number fields
  showWhen?: (settings: Record<string, any>) => boolean; // Conditional display
}
```

## Available Field Types

```typescript
const SettingType = {
  TEXT: 'text',           // Single-line text input
  TEXTAREA: 'textarea',   // Multi-line text area
  NUMBER: 'number',       // Numeric input
  SELECT: 'select',       // Dropdown selection
  CHECKBOX: 'checkbox',   // Boolean checkbox
  RADIO: 'radio',         // Radio button group
  PASSWORD: 'password',   // Masked password input
  JSON: 'json',           // JSON editor field
  WORKFLOW: 'workflow_selector' // Workflow selection
};
```

## Handler Interface

```typescript
interface NodeSettingsHandlers {
  // Initialize settings from node data
  initializeSettings?: (nodeData: Record<string, any>) => Record<string, any>;
  
  // Handle setting changes
  handleSettingChange?: (fieldId: string, value: any, currentSettings: Record<string, any>) => Record<string, any>;
  
  // Prepare data for saving
  prepareSaveData?: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => Record<string, any>;
}
```

## Standard Implementation Pattern

Follow this pattern exactly for consistent node settings:

```typescript
// Import needed types
import { SettingField, NodeSettingsHandlers, SettingType } from '../../../core/types/nodeSettingsTypes';
// Optionally import the helper if needed
import { createNodeSettings } from '../../../core/utils/nodeSettingsTemplate';

// 1. Define setting fields
const settingsFields: SettingField[] = [
  {
    id: 'myTextField',
    label: 'Text Input',
    type: SettingType.TEXT,
    description: 'Enter some text',
    placeholder: 'Type here...',
    defaultValue: '',
    required: true
  },
  {
    id: 'mySelectField',
    label: 'Selection',
    type: SettingType.SELECT,
    description: 'Choose an option',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ],
    defaultValue: 'option1'
  }
  // Add other fields as needed
];

// 2. Define handlers (or use the helper)
const handlers: NodeSettingsHandlers = {
  initializeSettings: (nodeData) => {
    const settings = { ...(nodeData.settings || {}) };
    
    // Copy fields from node data to settings
    ['myTextField', 'mySelectField'].forEach(key => {
      if (nodeData[key] !== undefined) {
        settings[key] = nodeData[key];
      }
    });
    
    return settings;
  },
  
  handleSettingChange: (fieldId, value, currentSettings) => {
    // Start with updated settings
    const updatedSettings = { ...currentSettings, [fieldId]: value };
    
    // Add any special handling for field changes
    if (fieldId === 'mySelectField' && value === 'option2') {
      // Example of updating a related field
      updatedSettings.someOtherField = 'changedValue';
    }
    
    return updatedSettings;
  },
  
  prepareSaveData: (settings, nodeProperties) => {
    const saveData = { ...settings };
    
    // Include node properties
    if (nodeProperties) {
      saveData.nodeProperties = nodeProperties;
    }
    
    return saveData;
  }
};

// 3. Include settings and handlers in node metadata
export const nodeMetadata = {
  tags: ['example', 'node'],
  color: '#2196F3',
  handlers // Include the handlers here
};

// 4. Include settings in the node definition
const definition = {
  // Node basics
  type: 'my_node_type',
  name: 'My Node',
  description: 'Description of my node',
  category: 'category',
  
  // Use the settings fields
  settings: settingsFields,
  
  // Other node properties
  // ...
};

export default definition;
```

## Using The Helper (Alternative Approach)

```typescript
import { SettingType } from '../../../core/types/nodeSettingsTypes';
import { createNodeSettings } from '../../../core/utils/nodeSettingsTemplate';

// Define settings fields
const fields = [
  {
    id: 'myTextField',
    label: 'Text Input',
    type: SettingType.TEXT,
    description: 'Enter some text',
    required: true
  },
  {
    id: 'mySelectField',
    label: 'Selection',
    type: SettingType.SELECT,
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ]
  }
];

// Create settings using the helper
const { settingsFields, handlers } = createNodeSettings(fields);

// Export metadata and definition
export const nodeMetadata = {
  tags: ['example', 'node'],
  color: '#2196F3',
  handlers // Include the generated handlers here
};

// Node definition
const definition = {
  // Node basics
  type: 'my_node_type',
  name: 'My Node',
  description: 'Description of my node',
  category: 'category',
  
  // Use the settings fields
  settings: settingsFields
};

export default definition;
```

## Common Patterns

### 1. Template-Based Node (like function_node)

```typescript
import { SettingType } from '../../../core/types/nodeSettingsTypes';
import { createTemplateNodeSettings } from '../../../core/utils/nodeSettingsTemplate';

// Define template library
const templateLibrary = {
  basic: `function process(input) {\n  return input;\n}`,
  transform: `function process(input) {\n  return { processed: input };\n}`
};

// Define settings fields
const fields = [
  {
    id: 'selectedTemplate',
    label: 'Template',
    type: SettingType.SELECT,
    options: [
      { value: 'basic', label: 'Basic' },
      { value: 'transform', label: 'Transform' }
    ],
    defaultValue: 'basic'
  },
  {
    id: 'code',
    label: 'Code',
    type: SettingType.TEXTAREA,
    placeholder: 'function process(input) {...}'
  }
];

// Additional fields to handle
const additionalFields = ['timeout', 'cacheResults'];

// Create template settings
const { settingsFields, handlers } = createTemplateNodeSettings(
  fields,
  templateLibrary,
  'selectedTemplate',
  'code',
  additionalFields
);

// Export
export const nodeMetadata = {
  tags: ['code', 'function'],
  handlers,
  templateLibrary // Keep this for reference
};

const definition = {
  // Node definition
  settings: settingsFields
  // Other properties
};
```

### 2. Workflow Reference Node (like embed_workflow)

```typescript
import { SettingType } from '../../../core/types/nodeSettingsTypes';
import { createNodeSettings } from '../../../core/utils/nodeSettingsTemplate';

// Define fields
const fields = [
  {
    id: 'workflowId',
    label: 'Workflow',
    type: SettingType.WORKFLOW,
    description: 'Select a workflow to embed',
    required: true
  }
];

// Custom handler for workflow nodes
const specialHandlers = {
  initializeSettings: (nodeData) => {
    const settings = { ...(nodeData.settings || {}) };
    
    // Special handling for workflowId
    const nodeWorkflowId = nodeData.workflowId || nodeData.settings?.workflowId;
    if (nodeWorkflowId && !settings.workflowId) {
      settings.workflowId = nodeWorkflowId.toString();
    }
    
    return settings;
  }
};

// Create settings
const { settingsFields, handlers } = createNodeSettings(fields, ['workflowId'], specialHandlers);

// Export
export const nodeMetadata = {
  tags: ['workflow', 'embed'],
  handlers
};

const definition = {
  // Node definition
  settings: settingsFields
  // Other properties
};
```

### 3. Conditional Fields

```typescript
import { SettingType } from '../../../core/types/nodeSettingsTypes';
import { createNodeSettings } from '../../../core/utils/nodeSettingsTemplate';

// Define fields with conditions
const fields = [
  {
    id: 'authType',
    label: 'Authentication',
    type: SettingType.SELECT,
    options: [
      { value: 'apiKey', label: 'API Key' },
      { value: 'oauth', label: 'OAuth' }
    ],
    defaultValue: 'apiKey'
  },
  {
    id: 'apiKey',
    label: 'API Key',
    type: SettingType.PASSWORD,
    required: true,
    showWhen: (settings) => settings.authType === 'apiKey'
  },
  {
    id: 'clientId',
    label: 'Client ID',
    type: SettingType.TEXT,
    required: true,
    showWhen: (settings) => settings.authType === 'oauth'
  },
  {
    id: 'clientSecret',
    label: 'Client Secret',
    type: SettingType.PASSWORD,
    required: true,
    showWhen: (settings) => settings.authType === 'oauth'
  }
];

// Create settings
const { settingsFields, handlers } = createNodeSettings(
  fields,
  ['authType', 'apiKey', 'clientId', 'clientSecret']
);

// Export
export const nodeMetadata = {
  tags: ['auth', 'api'],
  handlers
};

const definition = {
  // Node definition
  settings: settingsFields
  // Other properties
};
```