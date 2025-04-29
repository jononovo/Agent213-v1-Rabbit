/**
 * Test cases for the Perplexity API node
 * 
 * This file provides test data for the node-debug page to test the Perplexity API node
 * without having to set up a complete workflow.
 */

import { PerplexityApiNodeData, defaultData } from './executor';

/**
 * Test cases for the Perplexity API node
 */
export const tests = [
  {
    name: 'Basic text generation',
    description: 'Generate a response to a simple prompt',
    nodeData: {
      ...defaultData,
      model: 'llama-3.1-sonar-small-128k-online',
      temperature: 0.7,
      maxTokens: 500,
      useSystemPrompt: false
    } as PerplexityApiNodeData,
    inputs: {
      prompt: 'Explain the concept of integration engines in software architecture in three sentences.'
    },
    expected: {
      response: 'Expected response will vary based on the API'
    }
  },
  {
    name: 'With system prompt',
    description: 'Generate a response using a system prompt for context',
    nodeData: {
      ...defaultData,
      model: 'llama-3.1-sonar-small-128k-online',
      temperature: 0.7,
      maxTokens: 500,
      useSystemPrompt: true,
      systemPrompt: 'You are a helpful technical expert. Keep your answers concise and focused on practical applications.'
    } as PerplexityApiNodeData,
    inputs: {
      prompt: 'What are the benefits of TypeScript over JavaScript?'
    },
    expected: {
      response: 'Expected response will vary based on the API'
    }
  },
  {
    name: 'Creative writing',
    description: 'Generate a creative response with higher temperature',
    nodeData: {
      ...defaultData,
      model: 'llama-3.1-sonar-small-128k-online',
      temperature: 0.9,
      maxTokens: 800,
      useSystemPrompt: true,
      systemPrompt: 'You are a creative writer with a unique voice.'
    } as PerplexityApiNodeData,
    inputs: {
      prompt: 'Write a short paragraph describing a futuristic city where all transportation is automated.'
    },
    expected: {
      response: 'Expected response will vary based on the API'
    }
  },
  {
    name: 'Error handling - No prompt',
    description: 'Test error handling when no prompt is provided',
    nodeData: {
      ...defaultData
    } as PerplexityApiNodeData,
    inputs: {
      // Empty prompt to trigger error
    },
    expected: {
      error: 'Prompt is required'
    }
  },
  {
    name: 'Using system input',
    description: 'Test using system prompt from input rather than settings',
    nodeData: {
      ...defaultData,
      useSystemPrompt: true
    } as PerplexityApiNodeData,
    inputs: {
      prompt: 'What is cloud computing?',
      system: 'You are a university professor explaining complex concepts to beginners.'
    },
    expected: {
      response: 'Expected response will vary based on the API'
    }
  }
];

export default tests;