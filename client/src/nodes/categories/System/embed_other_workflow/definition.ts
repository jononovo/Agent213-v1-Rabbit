/**
 * Embed Other Workflow Node Definition
 * 
 * Enhanced definition file with advanced configuration options for embedding
 * and running other workflows within the current workflow.
 */

import { NodeDefinition } from '../../../core/types/nodeDefinitions';
import { z } from 'zod';

const definition: NodeDefinition = {
  type: 'embed_other_workflow',
  name: 'Embed Other Workflow',
  description: 'Embed and run another workflow from within your current workflow',
  category: 'actions',
  version: '1.0.0',
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to pass to the embedded workflow'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'Result from the embedded workflow'
    },
    error: {
      type: 'string',
      description: 'Error message if workflow execution failed'
    }
  },
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'workflowId',
      type: 'select', 
      label: 'Workflow',
      description: 'Select the workflow to trigger',
      // The options will be dynamically populated in the UI
      options: [],
      // Flag that this field requires workflows data
      requiresWorkflows: true,
      // When true, store workflowId in both settings and as a direct node data property
      saveToNodeData: true
    },
    {
      key: 'inputField',
      type: 'select',
      label: 'Input Field',
      description: 'Select which field to pass as input',
      options: [
        { value: 'json', label: 'JSON (entire object)' },
        { value: 'text', label: 'Text content' },
        { value: 'content', label: 'Content field' }
      ],
      default: 'json'
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Maximum time to wait for workflow execution (in milliseconds)',
      min: 0,
      max: 120000,
      step: 1000,
      default: 30000
    },
    {
      key: 'waitForCompletion',
      type: 'checkbox',
      label: 'Wait for Completion',
      description: 'Wait for the workflow to complete before continuing',
      default: true
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    workflowId: z.union([z.string(), z.number()]).optional(),
    inputField: z.enum(['json', 'text', 'content']).default('json'),
    timeout: z.number().min(0).max(120000).default(30000),
    waitForCompletion: z.boolean().default(true)
  }),
  
  defaultData: {
    label: 'Embed Other Workflow',
    description: 'Run another workflow from within this workflow',
    workflowId: null,
    inputField: 'json',
    timeout: 30000,
    waitForCompletion: true
  },
  icon: 'git-branch'
};

// Additional metadata for UI/rendering
export const nodeMetadata = {
  tags: ['workflow', 'embed', 'run', 'trigger', 'integration'],
  color: '#4B5563',
  
  // Add handlers for initialization and saving
  handlers: {
    // Initialize settings from node data, moving properties to settings if needed
    initializeSettings: (nodeData: Record<string, any>) => {
      const settings = { ...(nodeData.settings || {}) };
      
      // Move workflowId from node data to settings if it exists
      if (nodeData.workflowId !== undefined) {
        settings.workflowId = nodeData.workflowId.toString();
      }
      
      return settings;
    },
    
    // Prepare final node data before saving
    prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
      const saveData = { ...settings };
      
      // Add nodeProperties (like label and description)
      if (nodeProperties) {
        saveData.nodeProperties = nodeProperties;
      }
      
      // For embed_other_workflow, add workflowId as a direct property for easy access
      // This is required by the workflow executor
      if (settings.workflowId) {
        saveData.workflowId = settings.workflowId;
      }
      
      return saveData;
    }
  }
};

export default definition;