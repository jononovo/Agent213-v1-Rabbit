/**
 * Generate Text Node Definition
 * 
 * This node generates text using AI models (similar to Claude but more configurable).
 */

import { NodeDefinition, NodeSetting } from '@/nodes/types';
import { z } from 'zod';
import { MessagesSquare } from 'lucide-react';

// Default configuration for the node
export const defaultData = {
  apiKey: '',
  model: 'claude-3-7-sonnet-20250219',
  temperature: 0.7,
  maxTokens: 1024,
  systemPrompt: ''
};

const definition: NodeDefinition = {
  type: 'generate_text',
  name: 'Generate Text',
  description: 'Generates text using various AI models',
  icon: MessagesSquare,
  category: 'ai',
  version: '1.0.0',
  inputs: {
    prompt: {
      type: 'string',
      description: 'Text prompt to send to the AI model'
    },
    system: {
      type: 'string',
      description: 'System instructions (optional)',
      optional: true
    }
  },
  outputs: {
    response: {
      type: 'string',
      description: 'Generated text response'
    },
    metadata: {
      type: 'object',
      description: 'Response metadata',
      optional: true
    }
  },
  defaultData: defaultData,
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'apiKey',
      type: 'password',
      label: 'API Key',
      description: 'Your API key is securely stored and used only for this node.',
      placeholder: 'Enter your API key',
      required: false
    },
    {
      key: 'model',
      type: 'select',
      label: 'Model',
      description: 'The AI model to use for text generation.',
      options: [
        { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Latest)' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'custom', label: 'Custom Model Name' }
      ],
      default: 'claude-3-7-sonnet-20250219'
    },
    {
      key: 'customModel',
      type: 'text',
      label: 'Custom Model Name',
      description: 'Enter a custom model identifier if you selected "Custom Model Name" above.',
      placeholder: 'e.g., anthropic.claude-3-sonnet-20240229',
      showWhen: (settings) => settings.model === 'custom'
    },
    {
      key: 'temperature',
      type: 'number',
      label: 'Temperature',
      description: 'Controls randomness. Lower values (0.1) are more deterministic, higher values (1.0) more creative.',
      min: 0,
      max: 1,
      step: 0.1,
      default: 0.7
    },
    {
      key: 'maxTokens',
      type: 'number',
      label: 'Max Tokens',
      description: 'Maximum number of tokens to generate.',
      min: 1,
      max: 4096,
      default: 1024
    },
    {
      key: 'systemPrompt',
      type: 'textarea',
      label: 'System Prompt',
      description: 'Optional system instructions for the AI model.',
      placeholder: 'Enter system instructions here...'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('claude-3-7-sonnet-20250219'),
    customModel: z.string().optional(),
    temperature: z.number().min(0).max(1).default(0.7),
    maxTokens: z.number().min(1).max(4096).default(1024),
    systemPrompt: z.string().optional()
  })
};

export default definition;