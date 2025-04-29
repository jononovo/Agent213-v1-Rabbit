/**
 * Toggle Switch Node UI Component
 * 
 * This file contains the React component used to render the toggle switch node
 * in the workflow editor, with Simple AI Dev inspired UI.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleLeft, ToggleRight } from 'lucide-react';

// Default data for the node
export const defaultData = {
  toggleState: false,
  trueLabel: 'On',
  falseLabel: 'Off',
  iconColor: 'blue',
  label: 'Toggle Switch'
};

// React component for the node
export const component = ({ data, isConnectable, selected }: any) => {
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state for the toggle
  const [isChecked, setIsChecked] = useState<boolean>(!!nodeData.toggleState);
  
  // Update local state when node data changes
  useEffect(() => {
    setIsChecked(!!nodeData.toggleState);
  }, [nodeData.toggleState]);
  
  // Handle toggle change
  const handleToggleChange = useCallback((checked: boolean) => {
    setIsChecked(checked);
    
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        toggleState: checked
      });
    }
  }, [data, nodeData]);
  
  // Handle true label change
  const handleTrueLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        trueLabel: e.target.value
      });
    }
  }, [data, nodeData]);
  
  // Handle false label change
  const handleFalseLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        falseLabel: e.target.value
      });
    }
  }, [data, nodeData]);
  
  // Determine icon color based on settings and state
  const iconColorClass = isChecked ? `text-${nodeData.iconColor}-500` : 'text-slate-400';
  
  return (
    <div className={`p-3 rounded-md ${selected ? 'bg-muted/80 shadow-md' : 'bg-background/80'} border shadow-sm transition-all duration-200 min-w-[250px]`}>
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <div className="p-1 rounded bg-primary/10 text-primary">
          {isChecked ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </div>
        <div className="font-medium text-sm">{nodeData.label || 'Toggle Switch'}</div>
        <div className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
          isChecked 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-slate-100 text-slate-700'
        }`}>
          {isChecked ? nodeData.trueLabel : nodeData.falseLabel}
        </div>
      </div>
      
      {/* Node Content */}
      <div className="flex flex-col gap-4">
        {/* Main Toggle Switch */}
        <div className="flex items-center justify-center gap-4 p-3 border rounded-md bg-muted/10">
          <span className="text-sm text-muted-foreground">{nodeData.falseLabel}</span>
          <Switch
            checked={isChecked}
            onCheckedChange={handleToggleChange}
            className="data-[state=checked]:bg-blue-500"
          />
          <span className="text-sm text-muted-foreground">{nodeData.trueLabel}</span>
        </div>
        
        {/* Label Settings */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">True Label</Label>
            <Input 
              value={nodeData.trueLabel}
              onChange={handleTrueLabelChange}
              placeholder="On"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">False Label</Label>
            <Input 
              value={nodeData.falseLabel}
              onChange={handleFalseLabelChange}
              placeholder="Off"
              className="text-sm"
            />
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="mt-2 text-center">
          <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
            isChecked 
              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}>
            {isChecked ? (
              <ToggleRight size={14} className={iconColorClass} />
            ) : (
              <ToggleLeft size={14} className={iconColorClass} />
            )}
            <span>
              Status: <strong>{isChecked ? 'Active' : 'Inactive'}</strong>
            </span>
          </div>
        </div>
      </div>
      
      {/* Input Handle - for override */}
      <Handle
        type="target"
        position={Position.Left}
        id="state"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-blue-500 -ml-0.5 top-1/3"
      />
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="boolean"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-blue-500 -mr-0.5 top-1/3"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="condition"
        isConnectable={isConnectable}
        className="w-2 h-6 rounded-sm bg-green-500 -mr-0.5 top-2/3"
      />
    </div>
  );
};

export default component;