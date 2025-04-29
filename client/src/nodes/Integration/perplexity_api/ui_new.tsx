/**
 * Perplexity API Node UI Component
 * 
 * This is the BaseNode-based implementation of the Perplexity API node.
 */

import React, { useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { Brain, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BaseNode } from '@/nodes/Base';
import { PerplexityApiNodeData, defaultData } from './executor';

// Check if PERPLEXITY_API_KEY exists in environment variables
const hasPerplexityApiKey = !!import.meta.env.VITE_PERPLEXITY_API_KEY;

// Re-export default data from executor
export { defaultData };

// Validator function for node data
export const validator = (data: PerplexityApiNodeData) => {
  const errors: string[] = [];
  
  // Skip API key validation if using environment variable
  if (!data.apiKey && !hasPerplexityApiKey) {
    errors.push('API key is required');
  }
  
  if (data.temperature < 0 || data.temperature > 1) {
    errors.push('Temperature must be between 0 and 1');
  }
  
  if (data.maxTokens < 1) {
    errors.push('Max tokens must be at least 1');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// UI component for Perplexity API node
export function component({ id, data, selected, isConnectable }: NodeProps<PerplexityApiNodeData>) {
  // Merge incoming data with default data
  const nodeData = { ...defaultData, ...data };
  
  // Register with global settings drawer
  useEffect(() => {
    if (typeof data?.onChange === 'function') {
      // Create settings schema
      const settings = {
        title: 'Perplexity API Settings',
        fields: [
          {
            key: 'model',
            label: 'Model',
            type: 'select',
            description: 'Perplexity AI model to use',
            options: [
              { value: 'llama-3.1-sonar-small-128k-online', label: 'Llama 3.1 Sonar Small (Default)' },
              { value: 'llama-3.1-sonar-large-128k-online', label: 'Llama 3.1 Sonar Large' },
              { value: 'llama-3.1-sonar-huge-128k-online', label: 'Llama 3.1 Sonar Huge' }
            ]
          },
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            description: 'Your Perplexity API key (optional if using environment variable)'
          },
          {
            key: 'temperature',
            label: 'Temperature',
            type: 'slider',
            description: 'Controls randomness (0-1)',
            min: 0,
            max: 1,
            step: 0.1
          },
          {
            key: 'maxTokens',
            label: 'Max Tokens',
            type: 'number',
            description: 'Maximum number of tokens to generate'
          },
          {
            key: 'useSystemPrompt',
            label: 'Use System Prompt',
            type: 'checkbox',
            description: 'Enable system prompt input'
          },
          {
            key: 'systemPrompt',
            label: 'System Prompt',
            type: 'textarea',
            description: 'Instructions for the AI assistant',
            depends: {
              key: 'useSystemPrompt',
              value: true
            }
          }
        ]
      };
      
      // Update node data with settings and ensure consistent label/description
      data.onChange({
        ...data,
        settings,
        label: "Perplexity API",
        description: "Generate text using Perplexity's AI models",
        useGlobalSettingsOnly: true  // Use the global settings drawer only
      });
    }
  }, [id, data]);
  
  // Create model badge display
  const getModelBadge = () => {
    const model = nodeData.model || defaultData.model;
    let displayName = model;
    
    // Format the model name for display
    if (model.includes('small')) {
      displayName = 'Sonar Small';
    } else if (model.includes('large')) {
      displayName = 'Sonar Large';
    } else if (model.includes('huge')) {
      displayName = 'Sonar Huge';
    }
    
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        {displayName}
      </Badge>
    );
  };
  
  // Custom content for the node
  const customContent = (
    <div className="p-3 flex flex-col gap-2">
      {/* API Status */}
      {!nodeData.apiKey && !hasPerplexityApiKey && (
        <div className="mt-1 p-2 bg-amber-100/50 text-amber-800 text-xs rounded-md">
          Perplexity API key required in settings
        </div>
      )}
      {!nodeData.apiKey && hasPerplexityApiKey && (
        <div className="mt-1 p-2 bg-emerald-100/50 text-emerald-800 text-xs rounded-md">
          Using Perplexity API key from environment variable
        </div>
      )}
      
      {/* Model Display */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Model:</span>
          {getModelBadge()}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Temperature:</span>
          <span className="text-xs font-medium">{nodeData.temperature}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Max Tokens:</span>
          <span className="text-xs font-medium">{nodeData.maxTokens || 'Default'}</span>
        </div>
        
        {nodeData.useSystemPrompt && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">System Prompt:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Enabled
            </Badge>
          </div>
        )}
      </div>
      
      {/* Key Status */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">API Key:</span>
        {nodeData.apiKey ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Configured
          </Badge>
        ) : hasPerplexityApiKey ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Lock size={10} className="mr-1" />
            Environment
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <Lock size={10} className="mr-1" />
            Missing
          </Badge>
        )}
      </div>
    </div>
  );

  // Create icon element for the header
  const iconElement = (
    <div className="bg-purple-100 p-1.5 rounded-md">
      <Brain className="h-4 w-4 text-purple-600" />
    </div>
  );

  // Prepare the node data with properties expected by BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: nodeData.label || defaultData.label,
    description: nodeData.description || defaultData.description,
    settingsData: nodeData,
    childrenContent: customContent,
    // This is not a source node, it needs input
    isSourceNode: false,
    // No need to hide default handles
    hideDefaultHandles: false
  };
  
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="perplexity_api"
    />
  );
}

export default component;