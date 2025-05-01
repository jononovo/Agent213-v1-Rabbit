/**
 * Node Settings Types
 * 
 * This module defines the standard types for node settings,
 * providing a consistent interface for all nodes to follow.
 */

/**
 * Standard setting field types
 */
export const SettingType = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  PASSWORD: 'password',
  JSON: 'json',
  WORKFLOW: 'workflow_selector',
  MULTISELECT: 'multiselect'
} as const;

export type SettingFieldType = typeof SettingType[keyof typeof SettingType];

/**
 * Setting field definition
 */
export interface SettingField {
  id: string;         // Unique identifier for the field
  key?: string;       // Original key from node definition (for backward compatibility)
  label: string;      // Display label shown in the UI
  type: SettingFieldType; // Field type from SettingType
  description?: string; // Help text shown below the field
  placeholder?: string; // Placeholder text for input fields
  options?: Array<{ value: string; label: string }>; // Options for select/radio fields
  defaultValue?: any; // Default value for the field
  required?: boolean; // Whether this field is required
  min?: number;      // Minimum value (for number fields)
  max?: number;      // Maximum value (for number fields)
  step?: number;     // Step value (for number fields)
  showWhen?: (settings: Record<string, any>) => boolean; // Conditional display function
}

/**
 * Handlers for node settings behavior
 */
export interface NodeSettingsHandlers {
  /**
   * Initialize settings from node data
   * Called when the settings drawer is opened
   * 
   * @param nodeData The node data object
   * @returns Initialized settings object
   */
  initializeSettings?: (nodeData: Record<string, any>) => Record<string, any>;
  
  /**
   * Handle setting changes
   * Called when a setting value changes in the UI
   * 
   * @param fieldId The ID of the changed field
   * @param value The new value
   * @param currentSettings The current settings object
   * @returns Updated settings object
   */
  handleSettingChange?: (fieldId: string, value: any, currentSettings: Record<string, any>) => Record<string, any>;
  
  /**
   * Prepare data for saving
   * Called when the settings are saved
   * 
   * @param settings The current settings object
   * @param nodeProperties Optional node properties (label, description)
   * @returns Final data to save
   */
  prepareSaveData?: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => Record<string, any>;
  
  /**
   * Load field options
   * Called after field initialization to populate dropdown options or other dynamic data
   * This allows nodes to fetch their own required data (workflows, agents, etc)
   * 
   * @param fields The current field definitions
   * @returns Updated field definitions with loaded options
   */
  loadFieldOptions: (fields: SettingField[]) => Promise<SettingField[]>;
}