/**
 * Text Formatter Node UI Component
 * 
 * This is the BaseNode-based implementation of the Text Formatter node.
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Type, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BaseNode } from '@/nodes/core/base';
import { defaultData, TextFormatterData } from './definition';

function TextFormatterNode({ id, data, selected, isConnectable }: NodeProps<TextFormatterData>) {
  // Merge incoming data with default data
  const nodeData = { ...defaultData, ...data };
  
  // Get the current operation with fallback
  const operation = nodeData.operation || 'uppercase';
  
  // Format operation name for display
  const getOperationDisplay = (op: string) => {
    switch (op) {
      case 'uppercase': return 'Uppercase';
      case 'lowercase': return 'Lowercase';
      case 'titlecase': return 'Title Case';
      case 'trim': return 'Trim Whitespace';
      case 'reverse': return 'Reverse Text';
      default: return op;
    }
  };
  
  // Get a sample transformation based on the operation
  const getSampleTransformation = (op: string) => {
    const sample = 'Sample Text';
    switch (op) {
      case 'uppercase': return { before: sample, after: 'SAMPLE TEXT' };
      case 'lowercase': return { before: sample, after: 'sample text' };
      case 'titlecase': return { before: 'sample text', after: 'Sample Text' };
      case 'trim': return { before: '  Sample Text  ', after: 'Sample Text' };
      case 'reverse': return { before: sample, after: 'txeT elpmaS' };
      default: return { before: sample, after: sample };
    }
  };
  
  // Get sample before/after for the current operation
  const { before, after } = getSampleTransformation(operation);
  
  // Create a custom content element for the node
  const customContent = (
    <div className="p-3 flex flex-col gap-2">
      {/* Operation Display */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Operation:</span>
        <Badge variant="outline" className="bg-primary/10 px-2 py-1 rounded text-primary">
          {getOperationDisplay(operation)}
        </Badge>
      </div>
      
      {/* Sample Transformation */}
      <div className="mt-2 p-2 bg-secondary/20 rounded-md">
        <div className="text-xs font-medium mb-1">Sample Transformation:</div>
        <div className="flex items-center text-xs">
          <div className="px-2 py-1 bg-secondary/30 rounded">{before}</div>
          <ArrowRight className="h-3 w-3 mx-2 text-muted-foreground" />
          <div className="px-2 py-1 bg-primary/10 text-primary rounded">{after}</div>
        </div>
      </div>
    </div>
  );
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Type className="h-4 w-4 text-primary" />
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
    // Pass through any properties needed for settings
    useGlobalSettingsOnly: true  // Use the global settings drawer
  };
  
  // Render the node using BaseNode component
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="text_formatter"
    />
  );
}

// Export the component with memo for optimization
// IMPORTANT: Must use default export for dynamic loading to work
export default memo(TextFormatterNode);