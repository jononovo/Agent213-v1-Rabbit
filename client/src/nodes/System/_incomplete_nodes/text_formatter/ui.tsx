/**
 * Text Formatter Node UI Component
 * 
 * This file contains the React component used to render the text formatter node
 * in the workflow editor, featuring Simple AI Dev inspired styles.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from 'lucide-react'; // Import the Text icon from lucide-react

// Default data for the node
export const defaultData = {
  formatType: 'uppercase',
  addPrefix: '',
  addSuffix: '',
  label: 'Text Formatter'
};

// Component for the node UI
export const component = ({ data, isConnectable, selected }: any) => {
  // Get values from data or use defaults
  const nodeData = { ...defaultData, ...data };
  
  // Local state for displaying real-time preview
  const [preview, setPreview] = useState('Preview will appear here');
  
  // Handle formatType change
  const handleFormatTypeChange = useCallback((value: string) => {
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        formatType: value
      });
    }
  }, [data, nodeData]);
  
  // Handle prefix input change
  const handlePrefixChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        addPrefix: e.target.value
      });
    }
  }, [data, nodeData]);
  
  // Handle suffix input change
  const handleSuffixChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        addSuffix: e.target.value
      });
    }
  }, [data, nodeData]);
  
  // Update preview based on current settings and last received input
  useEffect(() => {
    let sampleText = data.lastInputText || 'Hello World';
    
    // Apply format based on settings
    switch (nodeData.formatType) {
      case 'uppercase':
        sampleText = sampleText.toUpperCase();
        break;
      case 'lowercase':
        sampleText = sampleText.toLowerCase();
        break;
      case 'titlecase':
        sampleText = sampleText.replace(
          /\w\S*/g,
          (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case 'trim':
        sampleText = sampleText.trim();
        break;
    }
    
    // Add prefix and suffix
    if (nodeData.addPrefix) {
      sampleText = nodeData.addPrefix + sampleText;
    }
    
    if (nodeData.addSuffix) {
      sampleText = sampleText + nodeData.addSuffix;
    }
    
    setPreview(sampleText);
  }, [nodeData.formatType, nodeData.addPrefix, nodeData.addSuffix, data.lastInputText]);
  
  return (
    <div className={`p-3 rounded-md ${selected ? 'bg-muted/80 shadow-md' : 'bg-background/80'} border shadow-sm transition-all duration-200 min-w-[300px]`}>
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <div className="p-1 rounded bg-primary/10 text-primary">
          <Text size={16} />
        </div>
        <div className="font-medium text-sm">{nodeData.label || 'Text Formatter'}</div>
      </div>
      
      {/* Node Content */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">Format Type</Label>
          <Select 
            value={nodeData.formatType} 
            onValueChange={handleFormatTypeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
              <SelectItem value="titlecase">Title Case</SelectItem>
              <SelectItem value="trim">Trim Whitespace</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Prefix</Label>
            <Input 
              value={nodeData.addPrefix} 
              onChange={handlePrefixChange}
              placeholder="Add prefix" 
              className="text-sm"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Suffix</Label>
            <Input 
              value={nodeData.addSuffix} 
              onChange={handleSuffixChange}
              placeholder="Add suffix" 
              className="text-sm"
            />
          </div>
        </div>
        
        {/* Preview Section */}
        <div className="mt-2 p-2 bg-muted/30 rounded border border-dashed text-xs">
          <div className="text-muted-foreground mb-1">Preview:</div>
          <div className="font-mono truncate">{preview}</div>
        </div>
      </div>
      
      {/* Input & Output Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="text"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-blue-500 -ml-0.5 top-1/3"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="formattedText"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-green-500 -mr-0.5 top-1/3"
      />
    </div>
  );
};

export default component;