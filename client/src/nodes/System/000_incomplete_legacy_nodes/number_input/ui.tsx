/**
 * Number Input Node UI Component
 * 
 * This file contains the React component used to render the number input node
 * in the workflow editor, with a Simple AI Dev inspired UI featuring a slider.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Hash } from 'lucide-react';

// Default data for the node
export const defaultData = {
  min: 0,
  max: 100,
  step: 1,
  inputValue: 50,
  showSlider: true,
  label: 'Number Input'
};

// React component for the node
export const component = ({ data, isConnectable, selected }: any) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state for the input value
  const [value, setValue] = useState<number>(nodeData.inputValue || defaultData.inputValue);
  
  // Update local state when node data changes
  useEffect(() => {
    if (typeof nodeData.inputValue === 'number') {
      setValue(nodeData.inputValue);
    }
  }, [nodeData.inputValue]);
  
  // Handle slider change
  const handleSliderChange = useCallback((values: number[]) => {
    const newValue = values[0];
    setValue(newValue);
    
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        inputValue: newValue
      });
    }
  }, [data, nodeData]);
  
  // Handle direct input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    
    if (!isNaN(newValue)) {
      setValue(newValue);
      
      if (data.onChange) {
        data.onChange({
          ...nodeData,
          inputValue: newValue
        });
      }
    }
  }, [data, nodeData]);
  
  return (
    <div className={`p-3 rounded-md ${selected ? 'bg-muted/80 shadow-md' : 'bg-background/80'} border shadow-sm transition-all duration-200 min-w-[250px]`}>
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <div className="p-1 rounded bg-primary/10 text-primary">
          <Hash size={16} />
        </div>
        <div className="font-medium text-sm">{nodeData.label || 'Number Input'}</div>
        <div className="ml-auto bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
          {value}
        </div>
      </div>
      
      {/* Node Content */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">Value</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value}
              onChange={handleInputChange}
              min={nodeData.min}
              max={nodeData.max}
              step={nodeData.step}
              className="text-sm"
            />
          </div>
        </div>
        
        {/* Slider for visual input */}
        {nodeData.showSlider && (
          <div className="mt-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{nodeData.min}</span>
              <span>{nodeData.max}</span>
            </div>
            <Slider
              defaultValue={[value]}
              min={nodeData.min}
              max={nodeData.max}
              step={nodeData.step}
              value={[value]}
              onValueChange={handleSliderChange}
              className="my-2"
            />
          </div>
        )}
        
        {/* Range indicators */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Step: {nodeData.step}</span>
          <span>Range: {nodeData.min} - {nodeData.max}</span>
        </div>
      </div>
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="number"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-blue-500 -mr-0.5 top-1/3"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="numberAsString"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-green-500 -mr-0.5 top-2/3"
      />
    </div>
  );
};

export default component;