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
  | 'Custom';

// Base node definition shared by all node types
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

// Definition for a node port (input or output)
export interface NodePortDefinition {
  type: string;
  displayName: string;
  description: string;
  required?: boolean;
  default?: any;
}

// Node configuration option
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

// API Node Definition
export interface ApiNodeDefinition extends BaseNodeDefinition {
  type: 'api';
  defaultData?: {
    apiType?: 'internal' | 'external';
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint?: string;
    headers?: Record<string, string>;
    data?: any;
    useInputForEndpoint?: boolean;
    useInputForData?: boolean;
  };
}

// Database Operation Node Definition
export interface DatabaseOperationNodeDefinition extends BaseNodeDefinition {
  type: 'database_operation';
  defaultData?: {
    operation?: 'get' | 'getAll' | 'create' | 'update' | 'delete';
    entityType?: 'agent' | 'workflow' | 'node' | 'log';
    entityId?: number;
    useInputAsId?: boolean;
    useInputAsData?: boolean;
    data?: Record<string, any>;
  };
}

// Specific node types registry
export const nodeDefinitions: Record<string, BaseNodeDefinition> = {
  // API Node
  api: {
    type: 'api',
    displayName: 'API Request',
    description: 'Make API requests to internal or external endpoints',
    icon: 'globe',
    category: 'API',
    version: '1.0.0',
    inputs: {
      default: {
        type: 'any',
        displayName: 'Input',
        description: 'Input data for the API request',
        required: false
      }
    },
    outputs: {
      default: {
        type: 'any',
        displayName: 'Response',
        description: 'API response data'
      }
    },
    configOptions: [
      {
        key: 'apiType',
        type: 'select',
        displayName: 'API Type',
        description: 'Type of API to call',
        default: 'internal',
        options: [
          { value: 'internal', label: 'Internal API' },
          { value: 'external', label: 'External API' }
        ]
      },
      {
        key: 'method',
        type: 'select',
        displayName: 'HTTP Method',
        description: 'HTTP method to use for the request',
        default: 'GET',
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
          { value: 'DELETE', label: 'DELETE' }
        ]
      },
      {
        key: 'endpoint',
        type: 'string',
        displayName: 'Endpoint',
        description: 'API endpoint URL or path',
        validation: {
          required: true
        }
      },
      {
        key: 'headers',
        type: 'json',
        displayName: 'Headers',
        description: 'HTTP headers to include in the request'
      },
      {
        key: 'data',
        type: 'json',
        displayName: 'Data',
        description: 'Data to send with the request'
      },
      {
        key: 'useInputForEndpoint',
        type: 'boolean',
        displayName: 'Use Input for Endpoint',
        description: 'Use input data to dynamically set endpoint',
        default: false
      },
      {
        key: 'useInputForData',
        type: 'boolean',
        displayName: 'Use Input for Data',
        description: 'Use input data as request data',
        default: false
      }
    ]
  },
  
  // Database Operation Node
  database_operation: {
    type: 'database_operation',
    displayName: 'Database Operation',
    description: 'Perform operations on the database',
    icon: 'database',
    category: 'Database',
    version: '1.0.0',
    inputs: {
      default: {
        type: 'any',
        displayName: 'Input',
        description: 'Input data for the operation',
        required: false
      }
    },
    outputs: {
      default: {
        type: 'any',
        displayName: 'Output',
        description: 'Result of the database operation'
      }
    },
    configOptions: [
      {
        key: 'operation',
        type: 'select',
        displayName: 'Operation',
        description: 'Database operation to perform',
        default: 'get',
        options: [
          { value: 'get', label: 'Get Single' },
          { value: 'getAll', label: 'Get All' },
          { value: 'create', label: 'Create' },
          { value: 'update', label: 'Update' },
          { value: 'delete', label: 'Delete' }
        ]
      },
      {
        key: 'entityType',
        type: 'select',
        displayName: 'Entity Type',
        description: 'Type of entity to operate on',
        default: 'agent',
        options: [
          { value: 'agent', label: 'Agent' },
          { value: 'workflow', label: 'Workflow' },
          { value: 'node', label: 'Node' },
          { value: 'log', label: 'Log' }
        ]
      },
      {
        key: 'entityId',
        type: 'number',
        displayName: 'Entity ID',
        description: 'ID of the entity to operate on'
      },
      {
        key: 'useInputAsId',
        type: 'boolean',
        displayName: 'Use Input as ID',
        description: 'Use input data as entity ID',
        default: false
      },
      {
        key: 'useInputAsData',
        type: 'boolean',
        displayName: 'Use Input as Data',
        description: 'Use input data for create/update operations',
        default: false
      },
      {
        key: 'data',
        type: 'json',
        displayName: 'Data',
        description: 'Data for create/update operations'
      }
    ]
  }
};