/**
 * Claude API Node Executor
 * 
 * This file contains the logic for executing the Claude API node.
 * It handles the API call to Claude and processes the response.
 * 
 * Uses the standardized NodeExecutorBase pattern for consistent
 * output formatting across all nodes.
 */

// Import node types and utilities
import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';

/**
 * Calls the Claude API with configured parameters
 */
async function callClaudeAPI(
  prompt: string, 
  apiKey: string, 
  model: string = 'claude-3-7-sonnet-20250219', // Updated to use latest model
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  try {
    // Prepare messages array
    const messages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    // Add user message
    messages.push({ role: 'user', content: prompt });
    
    // Make API request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Unexpected API response format');
    }
    
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Extract text from standardized input format
 */
function extractInputText(inputs: Record<string, any> = {}): string {
  // Case 1: No inputs provided
  if (!inputs || Object.keys(inputs).length === 0) {
    return '';
  }

  // Get the first input key
  const firstInputKey = Object.keys(inputs)[0];
  const firstInput = inputs[firstInputKey];
  
  // Case 2: No data in the input
  if (!firstInput) {
    return '';
  }
  
  // Case 3: Handle standardized format with items array
  if (firstInput.items && Array.isArray(firstInput.items) && firstInput.items.length > 0) {
    const firstItem = firstInput.items[0];
    
    // Extract text from JSON if available
    if (firstItem.json) {
      if (typeof firstItem.json === 'string') {
        return firstItem.json;
      } else if (firstItem.json.text) {
        return firstItem.json.text;
      } else if (firstItem.json.content) {
        return firstItem.json.content;
      }
    }
    
    // Extract from text field if available
    if (firstItem.text) {
      return firstItem.text;
    }
  }
  
  // Case 4: Input might be a direct string or object with text property
  if (typeof firstInput === 'string') {
    return firstInput;
  } else if (firstInput.text) {
    return firstInput.text;
  } else if (firstInput.content) {
    return firstInput.content;
  } else if (firstInput.message) {
    return firstInput.message;
  }
  
  // Case 5: Fallback - stringify the input
  return JSON.stringify(firstInput);
}

/**
 * Main node processing function
 */
async function processNode(
  nodeData: any,
  inputs: Record<string, any> = {}
): Promise<Record<string, any>> {
  // Extract input text from node data or connected nodes
  let prompt = '';
  if (inputs && Object.keys(inputs).length > 0) {
    prompt = extractInputText(inputs);
  } else if (nodeData.inputText) {
    prompt = nodeData.inputText;
  }
  
  // Validate input
  if (!prompt) {
    throw new Error('No input text provided');
  }
  
  // Get API key from node data or environment
  const apiKey = nodeData.apiKey || process.env.CLAUDE_API_KEY || '';
  
  // Validate API key
  if (!apiKey) {
    throw new Error('Claude API key is not configured');
  }
  
  // Get node settings
  const model = nodeData.model || 'claude-3-7-sonnet-20250219';
  const systemPrompt = nodeData.systemPrompt;
  const temperature = Number(nodeData.temperature || 0.7);
  const maxTokens = Number(nodeData.maxTokens || 2000);
  
  // Call Claude API
  const generatedText = await callClaudeAPI(
    prompt, 
    apiKey, 
    model,
    systemPrompt,
    temperature,
    maxTokens
  );
  
  // Return result
  return {
    output: {
      text: generatedText,
      model: model
    }
  };
}

/**
 * Export the standardized execute function
 */
export const execute = createNodeExecutor('claude', processNode);