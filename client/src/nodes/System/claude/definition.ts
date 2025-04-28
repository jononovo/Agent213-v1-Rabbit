/**
 * Claude API Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition, NodeSetting } from '../../types';
import { z } from 'zod';

// Updated model identifier for claude-3.7
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025

const definition: NodeDefinition = {
  type: 'claude',
  name: 'Claude API',
  description: 'Generates text using the Claude AI model',
  icon: 'sparkles',
  category: 'ai',
  version: '1.0.0',
  inputs: {
    input: {
      type: 'string',
      description: 'The prompt text to send to Claude'
    }
  },
  outputs: {
    output: {
      type: 'string',
      description: 'The generated text response from Claude'
    }
  },
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'apiKey',
      type: 'password',
      label: 'API Key',
      description: 'Your Anthropic API key is securely stored and used only for this node.',
      placeholder: 'Enter your Anthropic API key',
      required: false
    },
    {
      key: 'model',
      type: 'select',
      label: 'Model',
      description: 'The Claude AI model to use for text generation.',
      options: [
        { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Latest)' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
      ],
      default: 'claude-3-7-sonnet-20250219'
    },
    {
      key: 'systemPrompt',
      type: 'textarea',
      label: 'System Prompt',
      description: 'Initial instructions that prime Claude on how to respond (optional).',
      placeholder: 'Enter a system prompt to guide Claude...'
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
      description: 'Maximum number of tokens to generate. Higher values allow longer responses.',
      min: 1,
      max: 4096,
      default: 2000
    }
  ],
  
  // Keep configOptions for backward compatibility
  configOptions: [
    {
      key: 'model',
      type: 'select',
      default: 'claude-3-7-sonnet-20250219',
      options: [
        { label: 'Claude 3.7 Sonnet (Latest)', value: 'claude-3-7-sonnet-20250219' },
        { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
        { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
        { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' }
      ],
      description: 'Claude model to use for generation'
    },
    {
      key: 'temperature',
      type: 'number',
      default: 0.7,
      description: 'Controls randomness of the output (higher = more random)'
    },
    {
      key: 'maxTokens',
      type: 'number',
      default: 2000,
      description: 'Maximum number of tokens to generate'
    },
    {
      key: 'systemPrompt',
      type: 'string',
      default: '',
      description: 'Optional system instructions for Claude'
    },
    {
      key: 'apiKey',
      type: 'string',
      default: '',
      description: 'Your Anthropic API key (leave empty to use environment variable)'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    apiKey: z.string().optional(),
    model: z.string().default('claude-3-7-sonnet-20250219'),
    temperature: z.number().min(0).max(1).default(0.7),
    maxTokens: z.number().min(1).max(4096).default(2000),
    systemPrompt: z.string().optional().default('')
  }),
  
  defaultData: {
    model: 'claude-3-7-sonnet-20250219',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
    apiKey: ''
  }
};

export default definition;