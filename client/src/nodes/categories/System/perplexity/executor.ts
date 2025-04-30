/**
 * Perplexity API Node Executor
 * 
 * This module executes the Perplexity API calls and processes the response.
 */

import { NodeExecutionData } from '@/lib/types/workflow';
import { PerplexityData } from './definition';

interface PerplexityApiResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

export const execute = async (
  nodeData: PerplexityData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, NodeExecutionData>> => {
  try {
    const startTime = new Date();
    console.log(`Executing Perplexity API node with inputs:`, inputs);

    // Get inputs with fallbacks to node settings
    const inputPrompt = inputs?.prompt?.items?.[0]?.json || nodeData.prompt;
    const systemPrompt = inputs?.systemPrompt?.items?.[0]?.json || nodeData.systemPrompt;

    if (!inputPrompt) {
      throw new Error('No prompt provided. Please provide a prompt via the input port or node settings.');
    }

    // Prepare messages for API call
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ 
        role: 'system', 
        content: systemPrompt 
      });
    }
    
    messages.push({ 
      role: 'user', 
      content: inputPrompt 
    });

    // API call parameters
    const params = {
      model: nodeData.model || 'llama-3.1-sonar-small-128k-online',
      messages,
      temperature: nodeData.temperature !== undefined ? nodeData.temperature : 0.7,
      max_tokens: nodeData.maxTokens || 1000,
      search_recency_filter: nodeData.searchRecency || 'month',
      return_citations: nodeData.includeReferences !== undefined ? nodeData.includeReferences : true
    };

    // Call Perplexity API through our proxy endpoint
    const response = await fetch('/api/proxy/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Process the API response
    const apiResponse: PerplexityApiResponse = await response.json();
    const textResponse = apiResponse.choices[0]?.message?.content || '';
    const citations = apiResponse.citations || [];
    
    const endTime = new Date();

    // Return the results
    return {
      completion: {
        items: [{ json: textResponse }],
        meta: {
          startTime,
          endTime,
          source: 'perplexity',
          model: apiResponse.model
        }
      },
      citations: {
        items: citations.map(citation => ({ json: citation })),
        meta: {
          startTime,
          endTime,
          source: 'perplexity',
          count: citations.length
        }
      },
      full_response: {
        items: [{ json: apiResponse }],
        meta: {
          startTime,
          endTime,
          source: 'perplexity'
        }
      }
    };
  } catch (error) {
    console.error('Error in Perplexity API node:', error);
    
    // Return error in all output ports
    return {
      completion: {
        items: [{ json: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        meta: { error: true, errorMessage: error instanceof Error ? error.message : String(error) }
      },
      citations: {
        items: [{ json: [] }],
        meta: { error: true, errorMessage: error instanceof Error ? error.message : String(error) }
      },
      full_response: {
        items: [{ json: { error: error instanceof Error ? error.message : String(error) } }],
        meta: { error: true, errorMessage: error instanceof Error ? error.message : String(error) }
      }
    };
  }
};

export default execute;