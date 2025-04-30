/**
 * Node Definitions for Client-Centric Architecture
 * 
 * This file defines standard interfaces for node configurations
 * in our client-centric workflow architecture.
 */

// Node category options
export type NodeCategory = 
  | 'Input'
  | 'Output'
  | 'Processing'
  | 'API'
  | 'Database'
  | 'AI'
  | 'Integration'
  | 'Utility'
  | 'Data'
  | 'Custom'
  | 'ai'  // lowercase categories for backward compatibility
  | 'code'
  | 'actions'
  | 'triggers'
  | 'data';

// Node definition interface
export interface NodeDefinition {
  // Core properties
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  
  // Input and output ports
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
  
  // Default data for the node
  defaultData?: Record<string, any>;
  
  // Settings UI configuration
  settings?: {
    title?: string;
    description?: string;
    fields: SettingsField[];
  };
  
  // Integration-specific configuration (only for integration nodes)
  integrationConfig?: {
    provides: string[];
    requires: string[];
  };
}

// Port definition interface
export interface PortDefinition {
  type: string;
  description: string;
  optional?: boolean;
  default?: any;
}

// Settings field definition
export interface SettingsField {
  key: string;
  label: string;
  type: string;
  description?: string;
  placeholder?: string;
  default?: any;
  options?: Array<{
    label: string;
    value: string | number | boolean;
  }>;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  required?: boolean;
  depends?: {
    field: string;
    value: any;
  };
}

// Base node definition shared by all node types (for backward compatibility)
export interface BaseNodeDefinition {
  type: string;
  displayName: string;
  description: string;
  icon: string;
  category: NodeCategory;
  version: string;
  inputs: Record<string, NodePortDefinition>;
  outputs: Record<string, NodePortDefinition>;
  defaultData?: Record<string, any>;
  configOptions?: NodeConfigOption[];
}

// Definition for a node port (input or output) (for backward compatibility)
export interface NodePortDefinition {
  type: string;
  displayName: string;
  description: string;
  required?: boolean;
  default?: any;
}

// Node configuration option (for backward compatibility)
export interface NodeConfigOption {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  displayName: string;
  description: string;
  default?: any;
  options?: Array<{
    value: string | number | boolean;
    label: string;
  }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}