/**
 * Output Node Template - UI Component
 * 
 * This component renders the output node in the workflow editor.
 * It uses the BaseNode component to ensure consistency with the system.
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ExternalLink } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { OutputNodeData } from './executor';

/**
 * React component for the Output Node
 */
export default function OutputNodeComponent({ 
  id, 
  data, 
  selected, 
  isConnectable 
}: NodeProps<OutputNodeData>) {
  // Get the destination display for the node
  const getDestinationDisplay = () => {
    const { outputType, destination } = data;
    
    if (!destination) {
      return <span className="text-muted-foreground italic">No destination set</span>;
    }
    
    // Truncate long destinations
    const maxLength = 30;
    const displayText = destination.length > maxLength
      ? destination.substring(0, maxLength) + '...'
      : destination;
    
    switch (outputType) {
      case 'webhook':
      case 'api':
        return (
          <div className="flex items-center space-x-1">
            <span className="font-mono text-xs">{data.method || 'POST'}</span>
            <span className="font-mono text-xs text-primary">{displayText}</span>
          </div>
        );
      case 'database':
        return <span className="font-mono text-xs">DB: {displayText}</span>;
      case 'file':
        return <span className="font-mono text-xs">File: {displayText}</span>;
      case 'console':
        return <span className="font-mono text-xs text-muted-foreground">Console output</span>;
      default:
        return <span className="text-muted-foreground italic">Unknown output type</span>;
    }
  };

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

      {/* Output type and destination */}
      <div className="mt-3 flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold">Type:</span>
          <span className="text-xs capitalize">{data.outputType || 'webhook'}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold">Destination:</span>
          {getDestinationDisplay()}
        </div>
      </div>
    </>
  );

  // Prepare settings data for the node settings panel
  const settingsData = {
    ...data
  };

  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <ExternalLink className="h-4 w-4 text-primary" />
    </div>
  );

  // Prepare the node data with the properties expected by BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: data.label || 'Output',
    description: data.description || 'Sends data to external system',
    settingsData,
    // Add the custom content to the node data
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
      type="output_node"
    />
  );
}