/**
 * Claude API Node UI Component
 * 
 * This is the BaseNode-based implementation of the Claude API node.
 */

import React, { useEffect, memo } from 'react';
import { NodeProps } from 'reactflow';
import { Sparkles, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BaseNode } from '@/nodes/core/base';

// Check if ANTHROPIC_API_KEY exists in environment variables
const hasClaudeApiKey = !!import.meta.env.VITE_ANTHROPIC_API_KEY;

// Node data interface
interface ClaudeNodeData {
  label?: string;
  description?: string;
  icon?: string | React.ReactNode;
  category?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useSystemPrompt?: boolean;
  inputText?: string;
  settings?: any;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  [key: string]: any;
}

// Default data for the node (will be exported)
export const defaultData: ClaudeNodeData = {
  label: 'Claude API',
  description: 'Generates text using the Claude AI model',
  icon: 'sparkles',
  category: 'ai',
  model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
  temperature: 0.7,
  maxTokens: 1000,
  useSystemPrompt: false,
  systemPrompt: ''
};

// Validator for the node data
export const validator = (data: ClaudeNodeData) => {
  const errors: string[] = [];
  
  // Skip API key validation if we have environment variable
  if (!data.apiKey && !hasClaudeApiKey) {
    errors.push('API Key is not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// UI component for Claude API node
function ClaudeNode({ id, data, selected, isConnectable }: NodeProps<ClaudeNodeData>) {
  // Merge incoming data with default data
  const nodeData = { ...defaultData, ...data };
  
  // Register with global settings drawer
  useEffect(() => {
    if (typeof data?.onChange === 'function') {
      // Create settings schema
      const settings = {
        title: 'Claude API Settings',
        fields: [
          {
            key: 'model',
            label: 'Model',
            type: 'select',
            description: 'Claude AI model to use',
            options: [
              { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Feb 2025)' },
              { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet (June 2024)' },
              { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }, 
              { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
              { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
            ]
          },
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            description: 'Your Claude API key (optional if using environment variable)'
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
            description: 'Maximum number of tokens to generate',
            min: 100,
            max: 100000
          },
          {
            key: 'useSystemPrompt',
            label: 'Use System Prompt',
            type: 'checkbox',
            description: 'Enable system prompt for more control'
          },
          {
            key: 'systemPrompt',
            label: 'System Prompt',
            type: 'textarea',
            description: 'Instructions for the AI assistant',
            rows: 3,
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
        label: "Claude API",
        description: "Generates text using the Claude AI model",
        useGlobalSettingsOnly: true  // Use the global settings drawer only
      });
    }
  }, [id, data]);
  
  // Create model badge display
  const getModelBadge = () => {
    const model = (nodeData.model || defaultData.model) as string;
    let displayName = model;
    
    // Format the model name for display
    if (model.includes('claude-3-7')) {
      displayName = 'Claude 3.7 Sonnet';
    } else if (model.includes('claude-3-5')) {
      displayName = 'Claude 3.5 Sonnet';
    } else if (model.includes('claude-3-opus')) {
      displayName = 'Claude 3 Opus';
    } else if (model.includes('claude-3-sonnet')) {
      displayName = 'Claude 3 Sonnet';
    } else if (model.includes('claude-3-haiku')) {
      displayName = 'Claude 3 Haiku';
    }
    
    return (
      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
        {displayName}
      </Badge>
    );
  };
  
  // Custom content for the node
  const customContent = (
    <div className="p-3 flex flex-col gap-2">
      {/* API Status */}
      {!nodeData.apiKey && !hasClaudeApiKey && (
        <div className="mt-1 p-2 bg-amber-100/50 text-amber-800 text-xs rounded-md">
          Claude API key required in settings
        </div>
      )}
      {!nodeData.apiKey && hasClaudeApiKey && (
        <div className="mt-1 p-2 bg-emerald-100/50 text-emerald-800 text-xs rounded-md">
          Using Claude API key from environment variable
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
          <span className="text-xs font-medium">{nodeData.maxTokens}</span>
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
        ) : hasClaudeApiKey ? (
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
    <div className="bg-indigo-100 p-1.5 rounded-md">
      <Sparkles className="h-4 w-4 text-indigo-600" />
    </div>
  );

  // Prepare the node data with properties expected by BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: (nodeData.label || defaultData.label) as string,
    description: (nodeData.description || defaultData.description) as string,
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
      type="claude"
    />
  );
}

// Export the component with memo for optimization
export default memo(ClaudeNode);