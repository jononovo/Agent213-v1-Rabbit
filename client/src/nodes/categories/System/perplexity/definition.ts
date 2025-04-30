/**
 * Perplexity API Node Definition
 * 
 * This node implements the Perplexity API integration for text generation
 * with online search capabilities.
 */

import { NodeDefinition } from '@/nodes/core/types/nodeDefinitions';

// Define the structure of node data
export interface PerplexityData {
  label: string;
  description: string;
  model: string;
  prompt: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  includeReferences: boolean;
  searchRecency: string;
}

// Default data for this node type
export const defaultData: PerplexityData = {
  label: 'Perplexity API',
  description: 'Generates text using Perplexity AI with web search capabilities',
  model: 'llama-3.1-sonar-small-128k-online',
  prompt: '',
  systemPrompt: 'Be concise and factual.',
  temperature: 0.7,
  maxTokens: 1000,
  includeReferences: true,
  searchRecency: 'month'
};

// Node definition for registration in the node registry
export const definition: NodeDefinition = {
  type: 'perplexity',
  name: 'Perplexity API',
  description: 'Generates text using Perplexity AI with web search capabilities',
  category: 'ai',
  icon: 'search',
  version: '1.0.0',
  defaultData,
  
  inputs: {
    prompt: {
      type: 'string',
      description: 'The text prompt to send to Perplexity'
    },
    systemPrompt: {
      type: 'string',
      description: 'Optional system prompt to guide the AI behavior',
      optional: true
    }
  },
  
  outputs: {
    completion: {
      type: 'string',
      description: 'The generated text response'
    },
    citations: {
      type: 'array',
      description: 'Citations and references used in the response'
    },
    full_response: {
      type: 'object',
      description: 'The complete API response object'
    }
  },
  
  settings: {
    title: 'Perplexity API Settings',
    fields: [
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        options: [
          { value: 'llama-3.1-sonar-small-128k-online', label: 'Llama 3.1 Sonar Small (Default)' },
          { value: 'llama-3.1-sonar-large-128k-online', label: 'Llama 3.1 Sonar Large' },
          { value: 'llama-3.1-sonar-huge-128k-online', label: 'Llama 3.1 Sonar Huge' },
        ],
        description: 'The Perplexity model to use for text generation'
      },
      {
        key: 'prompt',
        label: 'Default Prompt',
        type: 'textarea',
        description: 'The prompt to use when no input is provided'
      },
      {
        key: 'systemPrompt',
        label: 'System Prompt',
        type: 'textarea',
        description: 'Instructions for how the AI should behave'
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1,
        description: 'Higher values make output more random, lower values more deterministic'
      },
      {
        key: 'maxTokens',
        label: 'Max Tokens',
        type: 'number',
        min: 1,
        max: 4000,
        step: 1,
        description: 'Maximum number of tokens to generate'
      },
      {
        key: 'includeReferences',
        label: 'Include References',
        type: 'checkbox',
        description: 'Include citations and references in the response'
      },
      {
        key: 'searchRecency',
        label: 'Search Recency',
        type: 'select',
        options: [
          { value: 'day', label: 'Past 24 hours' },
          { value: 'week', label: 'Past week' },
          { value: 'month', label: 'Past month' },
          { value: 'year', label: 'Past year' },
          { value: 'all', label: 'All time' }
        ],
        description: 'How recent should search results be'
      }
    ]
  }
};

export default definition;