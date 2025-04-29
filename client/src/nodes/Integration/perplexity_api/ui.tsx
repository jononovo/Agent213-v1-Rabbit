/**
 * Perplexity API Node UI Component
 * 
 * This component renders a custom implementation of the Perplexity API node
 * with settings drawer integration and hover menu support.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Brain, Settings, Lock } from 'lucide-react';
import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NodeValidationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PerplexityApiNodeData, defaultData } from './executor';

// Check if PERPLEXITY_API_KEY exists in environment variables
const hasPerplexityApiKey = import.meta.env.VITE_PERPLEXITY_API_KEY ? true : false;
import NodeHoverMenu, { 
  createDuplicateAction, 
  createDeleteAction, 
  createSettingsAction,
  createRunAction,
  createAddNoteAction, 
  NodeHoverMenuAction
} from '@/components/nodes/common/NodeHoverMenu';

// Re-export defaultData from executor
export { defaultData } from './executor';

// Validator function for node data
const validator = (data: PerplexityApiNodeData): NodeValidationResult => {
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

// Export validator for use in other components
export { validator };

// UI component for the Perplexity node (custom implementation with hover menu)
export const component = function PerplexityApiNode({ data, id, selected, isConnectable }: NodeProps<PerplexityApiNodeData>) {
  // Store the merged data in state so we can update it when props change
  const [nodeData, setNodeData] = useState(() => ({ ...defaultData, ...data }));
  
  // Update nodeData when props change
  useEffect(() => {
    setNodeData({ ...defaultData, ...data });
  }, [data]);
  
  // Hover menu state
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverDelay = 300; // ms before showing menu
  const hideDelay = 400; // ms before hiding menu
  
  // Register with settings drawer
  useEffect(() => {
    // Define the settings for the global settings drawer
    const settings = {
      title: 'Perplexity API Settings',
      fields: [
        {
          key: 'model',
          label: 'Model',
          type: 'text',
          description: 'Perplexity AI model to use (e.g., sonar)'
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
          description: 'Instructions for the AI assistant'
        }
      ]
    };
    
    // Add the settings to the node data using onChange
    if (typeof (data as any).onChange === 'function') {
      (data as any).onChange({
        ...data,
        settings,
        label: "Perplexity API",
        description: "Generate text using Perplexity's AI models",
        useGlobalSettingsOnly: true  // Use the global settings drawer only
      });
    }
  }, [id, data]);
  
  // Handle node action from hover menu
  const handleSettingsClick = useCallback(() => {
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  }, [id]);
  
  const handleRunNode = useCallback(() => {
    if ((data as any).onRun) {
      (data as any).onRun(id);
    } else {
      const event = new CustomEvent('node-run', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  }, [id, data]);
  
  const handleDuplicateNode = useCallback(() => {
    if ((data as any).onDuplicate) {
      (data as any).onDuplicate(id);
    } else {
      const event = new CustomEvent('node-duplicate', { 
        detail: { 
          nodeId: id,
          nodeType: 'perplexity_api',
          nodeData: data 
        }
      });
      window.dispatchEvent(event);
    }
  }, [id, data]);
  
  const handleDeleteNode = useCallback(() => {
    if ((data as any).onDelete) {
      (data as any).onDelete(id);
    } else {
      const event = new CustomEvent('node-delete', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  }, [id, data]);
  
  const handleEditNote = useCallback(() => {
    const event = new CustomEvent('node-note-edit', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  }, [id]);
  
  // Function to handle hover start
  const handleHoverStart = useCallback(() => {
    // Set a timeout to show the menu after hovering for specified delay
    const timer = setTimeout(() => {
      setShowHoverMenu(true);
    }, hoverDelay);
    
    setHoverTimer(timer);
  }, [hoverDelay]);
  
  // Function to handle hover end
  const handleHoverEnd = useCallback(() => {
    // Clear the timeout if the user stops hovering before the menu appears
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    
    // Add a delay before hiding the menu to give users time to move to it
    const timer = setTimeout(() => {
      setShowHoverMenu(false);
    }, hideDelay);
    
    setHoverTimer(timer);
  }, [hoverTimer, hideDelay]);
  
  // Handle menu hovering to keep it visible when cursor moves from node to menu
  const handleMenuHoverStart = useCallback(() => {
    setShowHoverMenu(true);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);
  
  // Create hover menu actions
  const hoverMenuActions: NodeHoverMenuAction[] = [
    createRunAction(handleRunNode),
    createDuplicateAction(handleDuplicateNode),
    createAddNoteAction(handleEditNote),
    createSettingsAction(handleSettingsClick),
    createDeleteAction(handleDeleteNode)
  ];
  
  return (
    <div
      ref={nodeRef}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      className="relative"
    >
      {/* Hover Menu */}
      {showHoverMenu && (
        <div
          ref={menuRef}
          onMouseEnter={handleMenuHoverStart}
          onMouseLeave={handleHoverEnd}
        >
          <NodeHoverMenu
            nodeId={id}
            actions={hoverMenuActions}
            position="right"
          />
        </div>
      )}
      
      <NodeContainer selected={selected} className="overflow-visible">
        {/* Input Handles with Tooltips */}
        <div className="group relative">
          <Handle
            type="target"
            position={Position.Left}
            id="prompt"
            style={{ 
              top: '110px', 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #6366f1',
              left: -6, // Position it exactly at the edge
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs rounded px-2 py-1 left-0 -translate-x-full" style={{ top: '75px', left: '-15px' }}>
            Prompt
          </div>
        </div>
        
        {nodeData.useSystemPrompt && (
          <div className="group relative">
            <Handle
              type="target"
              position={Position.Left}
              id="system"
              style={{ 
                top: '140px', 
                width: '12px', 
                height: '12px', 
                background: 'white',
                border: '2px solid #6366f1',
                left: -6, // Position it exactly at the edge
              }}
              isConnectable={isConnectable}
            />
            <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs rounded px-2 py-1 left-0 -translate-x-full" style={{ top: '105px', left: '-15px' }}>
              System
            </div>
          </div>
        )}
        
        {/* Output Handles with Tooltips */}
        <div className="group relative">
          <Handle
            type="source"
            position={Position.Right}
            id="response"
            style={{ 
              top: '110px', 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #10b981',
              right: -6, // Position it exactly at the edge
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs rounded px-2 py-1 right-0 translate-x-full" style={{ top: '75px', right: '-15px' }}>
            Response
          </div>
        </div>
        
        <div className="group relative">
          <Handle
            type="source"
            position={Position.Right}
            id="metadata"
            style={{ 
              top: '140px', 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '2px solid #10b981',
              right: -6, // Position it exactly at the edge
            }}
            isConnectable={isConnectable}
          />
          <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-xs rounded px-2 py-1 right-0 translate-x-full" style={{ top: '105px', right: '-15px' }}>
            Metadata
          </div>
        </div>
        
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-3 border-b border-border rounded-t-md',
          'bg-gradient-to-r from-purple-500/10 to-blue-500/10'
        )}>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 p-1.5 rounded-md bg-indigo-100 text-indigo-600">
              <Brain className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-medium truncate text-indigo-700">Perplexity API</h3>
          </div>
          <div className="flex items-center gap-1">
            {!nodeData.apiKey && !hasPerplexityApiKey && (
              <Badge variant="outline" className="px-1.5 py-0 h-5 text-amber-600 border-amber-200 bg-amber-50">
                <Lock size={11} className="mr-1" /> Key Required
              </Badge>
            )}
            {!nodeData.apiKey && hasPerplexityApiKey && (
              <Badge variant="outline" className="px-1.5 py-0 h-5 text-emerald-600 border-emerald-200 bg-emerald-50">
                <Lock size={11} className="mr-1" /> Env Key
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-indigo-600"
              onClick={handleSettingsClick}
            >
              <Settings size={14} />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <NodeContent padding="normal">
          {/* API Status Warning or Info */}
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
          
          {/* Settings access button instead of showing settings in the node UI */}
          <div className="mt-2 mb-3 flex items-center justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-7 text-xs text-slate-600"
              onClick={handleSettingsClick}
            >
              <Settings size={12} className="mr-1.5" />
              Configure Settings
            </Button>
          </div>
          
          {/* Node Note Display */}
          {(data as any).note && (data as any).showNote && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-md">
              <div className="font-medium mb-1">Note:</div>
              <div>{(data as any).note}</div>
            </div>
          )}
        </NodeContent>
      </NodeContainer>
    </div>
  );
};