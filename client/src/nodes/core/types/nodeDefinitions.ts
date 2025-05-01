/**
 * Node Definitions Types
 * 
 * This file contains the types related to node definitions.
 */

/**
 * Port Definition - Defines an input or output port for a node
 */
export interface PortDefinition {
  // The data type of this port
  type: string;
  
  // Description of this port
  description: string;
  
  // Whether this port is optional
  optional?: boolean;
  
  // Default value if not connected
  defaultValue?: any;
}

/**
 * Node Settings Handlers - For custom handling of node settings
 */
export interface NodeSettingsHandlers {
  // Initialize settings from node data
  initializeSettings?: (nodeData: Record<string, any>) => Record<string, any>;
  
  // Prepare data for saving
  prepareSaveData?: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => Record<string, any>;
  
  // Handle setting changes
  handleSettingChange?: (fieldId: string, value: any, currentSettings: Record<string, any>) => Record<string, any>;
}

/**
 * Node Metadata - Additional information about a node
 */
export interface NodeMetadata {
  // Tags for categorization
  tags?: string[];
  
  // UI color
  color?: string;
  
  // Custom settings handlers
  handlers?: NodeSettingsHandlers;
  
  // Any additional metadata
  [key: string]: any;
}

/**
 * Node Definition - Defines a node's interface and behavior
 */
export interface NodeDefinition {
  // Core properties
  type: string;
  name: string;
  description: string;
  category: string;
  version: string;
  
  // Input and output ports
  inputs?: Record<string, PortDefinition>;
  outputs?: Record<string, PortDefinition>;
  
  // Default data for the node
  defaultData?: Record<string, any>;
  
  // Icon representation
  icon?: string;
  
  // Settings for the node configuration drawer
  settings?: any[];
  
  // Validation schema
  validation?: any;
  
  // Node metadata
  metadata?: NodeMetadata;
  
  // Additional properties
  [key: string]: any;
}

/**
 * Node Settings Field - Defines a field in the node settings panel
 */
export interface NodeSettingsField {
  // Field identifier
  key: string;
  
  // Display label
  label: string;
  
  // Field type (text, number, select, etc.)
  type: string;
  
  // Field description
  description?: string;
  
  // Default value
  defaultValue?: any;
  
  // For select fields
  options?: Array<{ label: string; value: any }>;
  
  // For number fields
  min?: number;
  max?: number;
  step?: number;
  
  // Whether this field is required
  required?: boolean;
  
  // Special flags for field behavior
  requiresWorkflows?: boolean;
  saveToNodeData?: boolean;
}

/**
 * Node Settings - Defines the settings panel for a node
 */
export interface NodeSettings {
  // Panel title
  title: string;
  
  // Fields in the panel
  fields: NodeSettingsField[];
}

// No default export for type files