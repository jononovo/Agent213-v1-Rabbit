/**
 * Perplexity API Node Executor
 * 
 * Handles the execution logic for the Perplexity API node.
 * Uses the standardized BaseExecutor pattern - the single unified
 * approach for all node executors in the workflow system.
 */

import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';

// Define configuration data interface for this node
export interface PerplexityApiNodeData {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  useSystemPrompt: boolean | string;
  systemPrompt: string;
}

// Default configuration for the node
export const defaultData: PerplexityApiNodeData = {
  model: 'llama-3.1-sonar-small-128k-online',
  temperature: 0.7,
  maxTokens: 1000,
  apiKey: '',
  useSystemPrompt: false,
  systemPrompt: 'You are a helpful AI assistant.'
};

/**
 * Process the Perplexity API node logic
 */
async function processNode(
  data: PerplexityApiNodeData, 
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  // Extract inputs from standardized format
  const promptInput = inputs.prompt?.items?.[0]?.json || inputs.input?.items?.[0]?.json;
  const prompt = typeof promptInput === 'string' ? promptInput : promptInput?.text || promptInput?.content;
  const systemPromptInput = inputs.system?.items?.[0]?.json;
  const systemPrompt = systemPromptInput || data.systemPrompt;
  
  // Validate inputs
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  // Get API key from node settings or environment variable
  const apiKey = data.apiKey || import.meta.env.VITE_PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('Perplexity API key is required. Please configure it in the node settings or provide it as an environment variable.');
  }

  // Prepare messages array
  const useSystemPromptValue = 
    typeof data.useSystemPrompt === 'string' 
      ? data.useSystemPrompt === 'true' 
      : data.useSystemPrompt;
      
  const messages = [
    ...(useSystemPromptValue ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt }
  ];

  // Integration Engine API configuration
  const baseUrl = 'https://api.perplexity.ai';
  const endpoint = '/chat/completions';
  const url = `${baseUrl}${endpoint}`;
  
  // Build request body following Perplexity API specs
  const requestBody = {
    model: data.model || defaultData.model, // Ensure we always have a model
    messages: messages,
    temperature: data.temperature,
    max_tokens: data.maxTokens
  };
  
  // Debug log to check what's being sent (with masked API key)
  console.log('Perplexity API request:', JSON.stringify({
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ***' // Masked for security
    },
    body: requestBody
  }, null, 2));

  // Make the API request with security headers
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  // Handle response
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.error?.message || `API error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  // Parse successful response
  const responseData = await response.json();
  
  // Extract text from response
  const responseText = responseData.choices?.[0]?.message?.content || '';
  
  // Create response object with the expected format
  return {
    response: responseText,
    metadata: {
      model: data.model,
      tokenUsage: responseData.usage || {},
      finishReason: responseData.choices?.[0]?.finish_reason
    }
  };
}

/**
 * Export the standardized execute function
 * 
 * This line is identical across all node executors, ensuring
 * a single unified approach throughout the entire system.
 */
export const execute = createNodeExecutor<PerplexityApiNodeData>('perplexity_api', processNode);