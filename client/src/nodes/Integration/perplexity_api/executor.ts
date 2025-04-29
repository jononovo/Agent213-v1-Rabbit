/**
 * Perplexity API Node Executor
 * 
 * Handles the execution logic for the Perplexity API node.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';
import { NodeExecutionData } from '@/nodes/types';

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
 * Execute the Perplexity API node
 * Integration with the Integration Engine Framework
 */
export const execute = async (
  data: PerplexityApiNodeData, 
  inputs: Record<string, any>
): Promise<Record<string, any>> => {
  try {
    const startTime = new Date();
    // Extract inputs
    const prompt = inputs.prompt;
    const systemPrompt = inputs.system || data.systemPrompt;
    
    // Validate inputs
    if (!prompt) {
      return createErrorOutput('Prompt is required');
    }

    // Get API key from node settings or environment variable
    const apiKey = data.apiKey || import.meta.env.VITE_PERPLEXITY_API_KEY;

    if (!apiKey) {
      return createErrorOutput('Perplexity API key is required. Please configure it in the node settings or provide it as an environment variable.');
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
    
    // Debug log to check what's being sent
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
      return createErrorOutput(errorMessage);
    }

    // Parse successful response
    const responseData = await response.json();
    
    // Extract text from response
    const responseText = responseData.choices?.[0]?.message?.content || '';
    
    // Create response object with the expected format
    const result = {
      response: responseText,
      metadata: {
        model: data.model,
        tokenUsage: responseData.usage || {},
        finishReason: responseData.choices?.[0]?.finish_reason
      }
    };
    
    // Return output with response text and metadata
    return createNodeOutput(result, { startTime });
  } catch (error: unknown) {
    console.error('Perplexity API error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error processing Perplexity API request';
    return createErrorOutput(`Error processing Perplexity API request: ${errorMessage}`);
  }
};