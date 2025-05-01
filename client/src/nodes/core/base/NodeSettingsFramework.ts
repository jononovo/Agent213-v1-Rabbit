/**
 * Node Settings Framework
 * 
 * This module provides standardized types, helper functions, and handlers 
 * for creating node settings in a consistent way across the platform.
 */

/**
 * Standard settings field types
 */
export const NodeSettingsTypes = {
  // Basic types
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  
  // Advanced types
  JSON: 'json',
  PASSWORD: 'password',
  CODE: 'code',
  WORKFLOW_SELECTOR: 'workflow_selector',
  
  // Composite types
  API_KEY: 'api_key' // Special type for API credentials with validation
};

/**
 * Options interface for setting field creators
 */
export interface SettingFieldOptions {
  description?: string;
  placeholder?: string;
  required?: boolean;
  default?: any;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  showWhen?: (settings: Record<string, any>) => boolean;
  requiresWorkflows?: boolean;
  saveToNodeData?: boolean;
  [key: string]: any;
}

/**
 * Standard settings field creator functions
 */
export const createTextField = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.TEXT,
  label,
  ...options
});

export const createTextareaField = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.TEXTAREA,
  label,
  ...options
});

export const createNumberField = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.NUMBER,
  label,
  ...options
});

export const createSelectField = (key: string, label: string, options: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.SELECT,
  label,
  ...options
});

export const createCheckboxField = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.CHECKBOX,
  label,
  ...options
});

export const createRadioField = (key: string, label: string, options: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.RADIO,
  label,
  ...options
});

export const createJsonField = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.JSON,
  label,
  ...options
});

export const createPasswordField = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.PASSWORD,
  label,
  ...options
});

export const createCodeField = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.CODE,
  label,
  ...options
});

export const createWorkflowSelector = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.WORKFLOW_SELECTOR,
  label,
  requiresWorkflows: true,
  ...options
});

export const createApiKeyField = (key: string, label: string, options?: SettingFieldOptions) => ({
  key,
  type: NodeSettingsTypes.API_KEY,
  label,
  ...options
});

/**
 * Standard settings handlers that can be extended/overridden by nodes
 */
export const StandardSettingsHandlers = {
  /**
   * Standard handler for initializing settings from node data
   * @param nodeData The node data object
   * @param fieldKeys Array of field keys to copy from nodeData to settings
   */
  initializeSettings: (nodeData: Record<string, any>, fieldKeys: string[]) => {
    // Start with existing settings or empty object
    const settings = { ...(nodeData.settings || {}) };
    
    // Copy standard fields from node data to settings
    fieldKeys.forEach(key => {
      if (nodeData[key] !== undefined) {
        settings[key] = nodeData[key];
      }
    });
    
    return settings;
  },
  
  /**
   * Standard handler for preparing data for saving
   * @param settings The current settings object
   * @param nodeProperties Optional node properties (label, description)
   */
  prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
    const saveData = { ...settings };
    
    // Add nodeProperties (like label and description)
    if (nodeProperties) {
      saveData.nodeProperties = nodeProperties;
    }
    
    return saveData;
  }
};

/**
 * Helper to create settings handlers for nodes with template selection
 * This is useful for function-type nodes that allow template selection
 * 
 * @param fieldKeys Array of field keys to handle in settings
 * @param templateLibrary Record mapping template IDs to code snippets
 * @param templateFieldId Field ID that contains the template selection
 * @param codeFieldId Field ID that should receive the template code
 */
export const createTemplateHandlers = (
  fieldKeys: string[],
  templateLibrary: Record<string, string>,
  templateFieldId: string = 'selectedTemplate',
  codeFieldId: string = 'code'
) => {
  return {
    // Initialize settings from node data
    initializeSettings: (nodeData: Record<string, any>) => {
      return StandardSettingsHandlers.initializeSettings(nodeData, fieldKeys);
    },
    
    // Handle setting changes, particularly for template selection
    handleSettingChange: (fieldId: string, value: any, currentSettings: Record<string, any>) => {
      // Create a copy of the current settings with the new value
      const updatedSettings = { ...currentSettings, [fieldId]: value };
      
      // Special handling for template selection
      if (fieldId === templateFieldId && value) {
        if (typeof value === 'string' && value in templateLibrary) {
          const templateCode = templateLibrary[value];
          
          // Update the code field with the selected template
          updatedSettings[codeFieldId] = templateCode;
        }
      }
      
      return updatedSettings;
    },
    
    // Prepare data for saving
    prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
      return StandardSettingsHandlers.prepareSaveData(settings, nodeProperties);
    }
  };
};

/**
 * Helper to create settings handlers for nodes with workflow embedding
 * This is useful for nodes that need to embed/reference other workflows
 * 
 * @param fieldKeys Array of field keys to handle in settings
 * @param workflowFieldId Field ID that contains the workflow selection
 */
export const createWorkflowEmbedHandlers = (
  fieldKeys: string[],
  workflowFieldId: string = 'workflowId'
) => {
  return {
    // Initialize settings from node data
    initializeSettings: (nodeData: Record<string, any>) => {
      const settings = StandardSettingsHandlers.initializeSettings(nodeData, fieldKeys);
      
      // Special handling for workflowId
      const nodeWorkflowId = nodeData[workflowFieldId] || nodeData.settings?.[workflowFieldId];
      if (nodeWorkflowId && !settings[workflowFieldId]) {
        settings[workflowFieldId] = nodeWorkflowId.toString();
      }
      
      return settings;
    },
    
    // Prepare data for saving
    prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
      return StandardSettingsHandlers.prepareSaveData(settings, nodeProperties);
    }
  };
};

/**
 * Helper to create settings with conditional visibility
 * This is useful for nodes that show/hide fields based on other settings
 * 
 * @param baseSettings Array of setting fields
 * @param conditionalRules Array of rules for conditional visibility
 */
export const createConditionalSettings = (
  baseSettings: any[],
  conditionalRules: Record<string, (value: any) => boolean>
) => {
  return baseSettings.map(setting => {
    const key = setting.key;
    if (key in conditionalRules) {
      return {
        ...setting,
        showWhen: (settings: Record<string, any>) => {
          const controlValue = settings[key];
          return conditionalRules[key](controlValue);
        }
      };
    }
    return setting;
  });
};

// Export for use in nodes
export default {
  NodeSettingsTypes,
  createTextField,
  createTextareaField,
  createNumberField,
  createSelectField,
  createCheckboxField,
  createRadioField,
  createJsonField,
  createPasswordField,
  createCodeField,
  createWorkflowSelector,
  createApiKeyField,
  StandardSettingsHandlers,
  createTemplateHandlers,
  createWorkflowEmbedHandlers,
  createConditionalSettings
};