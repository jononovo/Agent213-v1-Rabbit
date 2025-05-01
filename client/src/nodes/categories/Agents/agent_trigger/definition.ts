/**
 * Agent Trigger Node Definition
 * 
 * This node allows triggering an agent to execute a workflow.
 * It supports selecting an agent from the available agents in the system.
 */

import { NodeDefinition } from '../../../core/types/nodeDefinitions';
import { z } from 'zod';
import { User } from 'lucide-react';

const definition: NodeDefinition = {
  type: 'agent_trigger',
  name: 'Agent Trigger',
  description: 'Triggers an agent to execute this workflow',
  category: 'agents',
  version: '1.0.0',
  inputs: {},
  outputs: {
    result: {
      type: 'object',
      description: 'Result from the agent execution'
    },
    error: {
      type: 'string',
      description: 'Error message if agent execution failed'
    }
  },
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'agentId',
      type: 'select',
      label: 'Agent',
      description: 'Select the agent to trigger this workflow',
      // The options will be dynamically populated in the UI
      options: [],
      // Flag that this field requires agents data
      requiresAgents: true
    },
    {
      key: 'triggerMode',
      type: 'select',
      label: 'Trigger Mode',
      description: 'How the agent should be triggered',
      options: [
        { value: 'automatic', label: 'Automatic' },
        { value: 'manual', label: 'Manual' }
      ],
      default: 'automatic'
    },
    {
      key: 'inputFormat',
      type: 'select',
      label: 'Input Format',
      description: 'Format of input to send to the agent',
      options: [
        { value: 'text', label: 'Text' },
        { value: 'json', label: 'JSON' }
      ],
      default: 'text'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    agentId: z.union([z.string(), z.number()]).optional(),
    triggerMode: z.enum(['automatic', 'manual']).default('automatic'),
    inputFormat: z.enum(['text', 'json']).default('text')
  }),
  
  defaultData: {
    label: 'Agent Trigger',
    description: 'Triggers an agent to execute this workflow',
    agentId: null,
    triggerMode: 'automatic',
    inputFormat: 'text'
  },
  icon: 'user'
};

// Additional metadata for UI/rendering
export const nodeMetadata = {
  tags: ['agent', 'trigger', 'automation'],
  color: '#6366F1',
  icon: User,
  
  // Add handlers for initialization and saving
  handlers: {
    // Initialize settings from node data, moving properties to settings if needed
    initializeSettings: (nodeData: Record<string, any>) => {
      // Start with existing settings or empty object
      const settings = { ...(nodeData.settings || {}) };
      
      // Move agentId from node data to settings if it exists
      if (nodeData.agentId !== undefined) {
        settings.agentId = nodeData.agentId.toString();
      }
      
      // Copy other properties from node data to settings
      ['triggerMode', 'inputFormat'].forEach(key => {
        if (nodeData[key] !== undefined) {
          settings[key] = nodeData[key];
        }
      });
      
      return settings;
    },
    
    // Handle setting changes
    handleSettingChange: (fieldId: string, value: any, currentSettings: Record<string, any>) => {
      // Create a copy of the current settings with the new value
      return { ...currentSettings, [fieldId]: value };
    },
    
    // Prepare final node data before saving
    prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
      const saveData = { ...settings };
      
      // Add nodeProperties (like label and description)
      if (nodeProperties) {
        saveData.nodeProperties = nodeProperties;
      }
      
      // For agent_trigger, add agentId as a direct property for easy access
      if (settings.agentId) {
        saveData.agentId = settings.agentId;
      }
      
      return saveData;
    }
  }
};

export default definition;