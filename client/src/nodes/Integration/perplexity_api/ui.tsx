/**
 * Perplexity API Node UI Component
 * 
 * This is the BaseNode-based implementation of the Perplexity API node.
 */

import React, { useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { Brain, Lock, Zap, Thermometer, Lightbulb, Sparkles } from 'lucide-react';
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

// Extended node data to include properties needed by BaseNode
interface ExtendedPerplexityNodeData extends PerplexityApiNodeData {
  label?: string;
  description?: string;
  icon?: string | React.ReactNode;
  category?: string;
  settings?: any;
  onChange?: (data: any) => void;
}

// UI component for Perplexity API node
function PerplexityApiNode({ id, data, selected, isConnectable }: NodeProps<ExtendedPerplexityNodeData>) {
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
  
  // Get model icon and color based on model size
  const getModelInfo = () => {
    const model = nodeData.model || defaultData.model;
    let displayName = model;
    let icon = <Sparkles className="h-3 w-3" />;
    let bgColor = "bg-purple-50";
    let textColor = "text-purple-700";
    let borderColor = "border-purple-200";
    
    // Format the model name for display and assign appropriate styling
    if (model.includes('small')) {
      displayName = 'Sonar Small';
      icon = <Sparkles className="h-3 w-3" />;
      bgColor = "bg-purple-50";
      textColor = "text-purple-700";
      borderColor = "border-purple-200";
    } else if (model.includes('large')) {
      displayName = 'Sonar Large';
      icon = <Zap className="h-3 w-3" />;
      bgColor = "bg-indigo-50";
      textColor = "text-indigo-700";
      borderColor = "border-indigo-200";
    } else if (model.includes('huge')) {
      displayName = 'Sonar Huge';
      icon = <Lightbulb className="h-3 w-3" />;
      bgColor = "bg-blue-50";
      textColor = "text-blue-700";
      borderColor = "border-blue-200";
    }
    
    return {
      displayName,
      icon,
      badgeClasses: `${bgColor} ${textColor} ${borderColor}`
    };
  };
  
  const modelInfo = getModelInfo();
  
  // Custom content for the node
  const customContent = (
    <div className="p-3 flex flex-col gap-2">
      {/* API Status Alert */}
      {!nodeData.apiKey && !hasPerplexityApiKey && (
        <div className="mt-1 p-2 bg-amber-100/50 text-amber-800 text-xs rounded-md flex items-center gap-1.5">
          <Lock size={12} />
          <span>Perplexity API key required in settings</span>
        </div>
      )}
      {!nodeData.apiKey && hasPerplexityApiKey && (
        <div className="mt-1 p-2 bg-emerald-100/50 text-emerald-800 text-xs rounded-md flex items-center gap-1.5">
          <Zap size={12} />
          <span>Using API key from environment variable</span>
        </div>
      )}
      
      {/* Model Card */}
      <div className={`p-2 rounded-md border ${modelInfo.badgeClasses.replace('bg-', 'bg-opacity-30 bg-')}`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className={`p-1 rounded ${modelInfo.badgeClasses}`}>
            {modelInfo.icon}
          </div>
          <span className="text-xs font-medium">{modelInfo.displayName}</span>
        </div>
        
        {/* Parameters */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1">
            <Thermometer size={10} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Temp:</span>
          </div>
          <span className="text-xs font-medium text-right">{nodeData.temperature}</span>
          
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tokens:</span>
          </div>
          <span className="text-xs font-medium text-right">{nodeData.maxTokens || 'Default'}</span>
        </div>
      </div>
      
      {/* System Prompt & API Key Status */}
      <div className="flex items-center justify-between mt-1 gap-2">
        {/* API Key Status */}
        <div className="flex flex-1 items-center gap-1">
          <Lock size={10} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">API:</span>
          {nodeData.apiKey ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-auto">
              Configured
            </Badge>
          ) : hasPerplexityApiKey ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-auto">
              <Lock size={10} className="mr-1" />
              Environment
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 ml-auto">
              <Lock size={10} className="mr-1" />
              Missing
            </Badge>
          )}
        </div>
        
        {/* System Prompt Status */}
        {nodeData.useSystemPrompt && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Sparkles size={10} className="mr-1" />
            System Prompt
          </Badge>
        )}
      </div>
    </div>
  );

  // Create icon element for the header
  const iconElement = (
    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-1.5 rounded-md shadow-sm border border-purple-200">
      <Brain className="h-4 w-4 text-purple-600" />
    </div>
  );

  // Prepare the node data with properties expected by BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: "Perplexity API",
    description: "Generate text using Perplexity's AI models",
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
      data={{
        ...baseNodeData,
        label: "Perplexity API",
        description: "Generate text using Perplexity's AI models"
      }}
      selected={selected}
      isConnectable={isConnectable}
      type="perplexity_api"
    />
  );
}

// Export the component as default (standard pattern)
export default PerplexityApiNode;