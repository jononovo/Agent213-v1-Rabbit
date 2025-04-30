/**
 * Processing Node Template - UI Component
 * 
 * This component renders the processing node in the workflow editor.
 * It uses the BaseNode component to ensure consistency with the system.
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Code } from 'lucide-react';
import { BaseNode } from '@/nodes/core/base';
import { ProcessingNodeData } from './executor';

/**
 * React component for the Processing Node
 */
export default function ProcessingNodeComponent({ 
  id, 
  data, 
  selected, 
  isConnectable 
}: NodeProps<ProcessingNodeData>) {
  // Create the custom content for the node
  const customContent = (
    <>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          width: '12px',
          height: '12px',
          background: 'white',
          border: '2px solid #10b981'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute left-2 top-[46px] text-xs text-muted-foreground">
        In
      </div>

      {/* Code preview */}
      <div className="mt-3 border rounded-md p-2 bg-muted/30 text-xs font-mono overflow-hidden max-h-20">
        <div className="text-muted-foreground">
          {data.code?.substring(0, 100)}
          {data.code?.length > 100 ? '...' : ''}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          width: '12px',
          height: '12px',
          background: 'white',
          border: '2px solid #10b981'
        }}
        isConnectable={isConnectable}
      />
      <div className="absolute right-2 top-[46px] text-xs text-muted-foreground text-right">
        Out
      </div>
    </>
  );

  // Create node settings definition
  const settings = {
    title: 'Processing Node Settings',
    fields: [
      {
        key: 'code',
        label: 'Processing Code',
        type: 'code' as const,
        description: 'JavaScript code to process the input data'
      },
      {
        key: 'selectedTemplate',
        label: 'Code Template',
        type: 'select' as const,
        description: 'Pre-defined template to use',
        options: [
          { value: 'basic', label: 'Basic (return input)' },
          { value: 'transform', label: 'Data Transform' },
          { value: 'filter', label: 'Filter Data' },
          { value: 'enrich', label: 'Enrich Data' }
        ]
      },
      {
        key: 'useAsyncFunction',
        label: 'Use Async Function',
        type: 'toggle' as const,
        description: 'Enable for async operations like API calls'
      },
      {
        key: 'timeout',
        label: 'Timeout (ms)',
        type: 'number' as const,
        description: 'Maximum execution time',
        min: 100,
        max: 30000
      }
    ]
  };

  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Code className="h-4 w-4 text-primary" />
    </div>
  );

  // Prepare the node data with the properties expected by BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: data.label || 'Process',
    description: data.description || 'Processes data using JavaScript',
    settingsData: data,
    // Add the custom content to the node data instead of using children prop
    childrenContent: customContent,
    // Maintain the existing custom handles flag if present,
    // otherwise don't hide the default handles
    hideDefaultHandles: true
  };
  
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="processing_node"
    />
  );
}