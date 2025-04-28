/**
 * Perplexity API Node Definition
 * 
 * This node provides integration with the Perplexity AI API for text generation.
 */

import { NodeDefinition } from '@/nodes/types';
import type { NodeSettings } from '@/lib/types';
import { defaultData } from './executor';
import { z } from 'zod';


// Type for settings to fix TypeScript errors
interface NodeSettings {
  useSystemPrompt: boolean | string;
  [key: string]: any;
}

export const definition: NodeDefinition = {
  type: 'perplexity_api',
  name: 'Perplexity API',
  description: 'Generate text using Perplexity\'s AI models',
  icon: 'brain',
  category: 'ai',
  version: '1.0.0',
  inputs: {
    prompt: {
      type: 'string',
      description: 'Text prompt to send to Perplexity'
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
      description: 'Response metadata like tokens used',
      optional: true
    }
  },
  // Add defaultData property required by the validator
  defaultData: defaultData,
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'apiKey',
      type: 'password',
      label: 'API Key',
      description: 'Your Perplexity API key is securely stored and used only for this node.',
      placeholder: 'Enter your Perplexity API key',
      required: false
    },
    {
      key: 'model',
      type: 'string',
      label: 'Model',
      description: 'The Perplexity model to use (e.g., llama-3.1-sonar-small-128k-online)',
      placeholder: 'llama-3.1-sonar-small-128k-online',
      default: 'llama-3.1-sonar-small-128k-online'
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
      max: 4000,
      default: 1000
    },
    {
      key: 'useSystemPrompt',
      type: 'select',
      label: 'Use System Prompt',
      description: 'Enable system prompt input',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ],
      default: 'false'
    },
    {
      key: 'systemPrompt',
      type: 'textarea',
      label: 'System Prompt',
      description: 'Instructions for the AI assistant',
      placeholder: 'You are a helpful AI assistant.',
      showWhen: (settings) => settings.useSystemPrompt === 'true' || settings.useSystemPrompt === true
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('llama-3.1-sonar-small-128k-online'),
    temperature: z.number().min(0).max(1).default(0.7),
    maxTokens: z.number().min(1).max(4000).default(1000),
    useSystemPrompt: z.union([z.boolean(), z.enum(['true', 'false'])]).transform(val => 
      typeof val === 'string' ? val === 'true' : val
    ).default(false),
    systemPrompt: z.string().default('You are a helpful AI assistant.')
  })
};

export default definition;