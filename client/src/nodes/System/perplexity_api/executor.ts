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
  useSystemPrompt: boolean;
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
    const messages = [
      ...(data.useSystemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt }
    ];

    // Call Perplexity API directly
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    const requestBody = {
      model: data.model,
      messages: messages,
      temperature: data.temperature,
      max_tokens: data.maxTokens
    };

    // Use the model as entered by the user without any modifications
    
    // Make API request directly to Perplexity
    const response = await fetch(apiUrl, {
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