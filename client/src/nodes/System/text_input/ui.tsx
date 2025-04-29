/**
 * Text Input Node UI Component
 * 
 * This file contains the React component used to render the text input node
 * in the workflow editor. This node uses BaseNode as a wrapper to ensure
 * consistent hover menu behavior and UI patterns.
 */

import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { memo } from 'react';

// Node interface
interface TextInputNodeData {
  inputText: string;
  label: string;
  placeholder: string;
  required?: boolean;
  onChange?: (data: any) => void;
  description?: string;
  category?: string;
  [key: string]: any;
}

// Default data for the node
export const defaultData: TextInputNodeData = {
  inputText: '',
  label: 'Input Text',
  placeholder: 'Enter text here...',
  required: false,
  description: 'Text input node for workflows',
  category: 'input'
};

// Validator for the node data
export const validator = (data: TextInputNodeData) => {
  const errors = [];
  
  if (!data.inputText && data.required) {
    errors.push('Input text is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// React component for the node, using BaseNode as a wrapper
export const component = memo(({ data, id, isConnectable, selected }: NodeProps<TextInputNodeData>) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state for the input text
  const [inputText, setInputText] = useState<string>(
    nodeData.inputText || defaultData.inputText
  );
  
  // Update input text when node data changes
  useEffect(() => {
    if (nodeData.inputText !== undefined) {
      setInputText(nodeData.inputText);
    }
  }, [nodeData.inputText]);
  
  // Handle change in the input field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    
    // Call the onChange handler if provided
    if (nodeData.onChange) {
      nodeData.onChange({
        ...nodeData,
        inputText: newText
      });
    }
  };
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Type className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Create the custom content for the node
  const customContent = (
    <>
      {/* Input Field */}
      <div className="mt-3">
        <Label htmlFor={`inputText-${id}`} className="mb-2 block text-xs">
          {nodeData.label}
          {nodeData.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <Input 
          id={`inputText-${id}`}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={nodeData.placeholder}
          className="w-full"
        />
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          top: 50, 
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
    title: `${nodeData.label || 'Text Input'} Settings`,
    fields: [
      {
        key: 'label',
        label: 'Node Label',
        type: 'text' as const,
        description: 'Display name for this node'
      },
      {
        key: 'placeholder',
        label: 'Placeholder Text',
        type: 'text' as const,
        description: 'Text shown when input is empty'
      },
      {
        key: 'required',
        label: 'Required',
        type: 'checkbox' as const,
        description: 'Whether input is required'
      }
    ]
  };
  
  // Enhanced data with settings and icon
  const enhancedData = {
    ...nodeData,
    icon: iconElement,
    settings,
    // These properties define custom content to render inside the BaseNode
    childrenContent: customContent,
    // Don't render the default handles since we're adding our own
    hideDefaultHandles: true
  };
  
  // Return the base node wrapper with our customizations
  return <BaseNode 
    data={enhancedData}
    id={id} 
    selected={selected}
    isConnectable={isConnectable}
    type="text_input"
  />;
});