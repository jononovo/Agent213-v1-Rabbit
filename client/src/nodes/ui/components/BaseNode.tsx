/**
 * Base Node Component
 * 
 * This is the base UI component for all nodes in the system.
 * It provides a standardized layout and styling for nodes,
 * as well as common behaviors such as selecting, dragging, etc.
 */

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeToolbar } from 'reactflow';
import { NodeDefinition } from '../../core/types/nodeDefinitions';

export interface BaseNodeProps extends NodeProps {
  data: {
    label: string;
    icon?: string;
    color?: string;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    parameters?: Record<string, any>;
    definition?: NodeDefinition;
    [key: string]: any;
  };
  selected: boolean;
  isConnectable: boolean;
}

const BaseNode = ({ id, data, selected, isConnectable }: BaseNodeProps) => {
  const { label, icon = 'box', color = '#718096' } = data;
  
  // Define input and output ports based on node definition
  const inputPorts = data.definition?.inputs || {};
  const outputPorts = data.definition?.outputs || {};

  // Function to handle node selection
  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Add your selection logic here
  }, []);

  return (
    <div
      className={`border rounded-md p-2 min-w-[200px] bg-card ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleNodeClick}
    >
      {/* Optional Node Toolbar */}
      <NodeToolbar>
        <div className="bg-popover p-1 rounded shadow-sm flex gap-1">
          <button className="p-1 hover:bg-muted rounded">
            <span className="sr-only">Delete</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
          <button className="p-1 hover:bg-muted rounded">
            <span className="sr-only">Duplicate</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="8" y="8" width="12" height="12" rx="2"></rect>
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
            </svg>
          </button>
        </div>
      </NodeToolbar>

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <i className={`icon-${icon} text-white text-xs`}></i>
        </div>
        <div className="text-sm font-medium truncate">{label}</div>
      </div>

      {/* Input Ports */}
      <div className="space-y-2">
        {Object.entries(inputPorts).map(([key, port]) => (
          <div key={`input-${key}`} className="flex items-center relative">
            <Handle
              type="target"
              position={Position.Left}
              id={key}
              isConnectable={isConnectable}
              className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white absolute -left-4"
            />
            <div className="text-xs text-gray-600 truncate pl-1">
              {key}: <span className="text-gray-400">{port.type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Parameters (if any) */}
      {data.parameters && Object.keys(data.parameters).length > 0 && (
        <div className="my-2 p-2 bg-muted/50 rounded text-xs">
          {Object.entries(data.parameters).map(([key, value]) => (
            <div key={`param-${key}`} className="truncate">
              <span className="font-medium">{key}:</span>{' '}
              <span className="text-muted-foreground">
                {typeof value === 'string' ? value : JSON.stringify(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Output Ports */}
      <div className="space-y-2 mt-2">
        {Object.entries(outputPorts).map(([key, port]) => (
          <div
            key={`output-${key}`}
            className="flex items-center justify-end relative"
          >
            <div className="text-xs text-gray-600 truncate pr-1">
              {key}: <span className="text-gray-400">{port.type}</span>
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={key}
              isConnectable={isConnectable}
              className="w-3 h-3 rounded-full bg-green-500 border-2 border-white absolute -right-4"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(BaseNode);