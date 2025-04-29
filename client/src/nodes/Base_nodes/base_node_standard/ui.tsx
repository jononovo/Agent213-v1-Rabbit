/**
 * Base Standard Node UI Component
 * 
 * This component provides the configuration UI for the node.
 * Modify it to create the settings interface for your node.
 */

import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BaseNodeData } from './executor';

// Interface validation result
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates node configuration
 * Customize this function for your node's specific validation requirements
 */
export const validator = (data: BaseNodeData): ValidationResult => {
  const errors: string[] = [];
  
  // Example validation - modify according to your node's needs
  if (!data.setting1 || data.setting1.trim() === '') {
    errors.push('Setting 1 cannot be empty');
  }
  
  if (data.setting2 < 0) {
    errors.push('Setting 2 must be a positive number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Node configuration UI component
 * 
 * @param data Current node data
 * @param updateNodeData Function to update node data
 */
export const component = ({ 
  data, 
  updateNodeData 
}: { 
  data: BaseNodeData; 
  updateNodeData: (data: any) => void;
}) => {
  // Handler for text input changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData({
      ...data,
      [e.target.name]: e.target.value
    });
  }, [data, updateNodeData]);
  
  // Handler for number input changes
  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData({
      ...data,
      [e.target.name]: Number(e.target.value)
    });
  }, [data, updateNodeData]);
  
  // Handler for checkbox changes
  const handleCheckboxChange = useCallback((checked: boolean) => {
    updateNodeData({
      ...data,
      setting3: checked
    });
  }, [data, updateNodeData]);

  return (
    <div className="p-4 space-y-4">
      {/* Setting 1 - Text Input */}
      <div className="space-y-2">
        <Label htmlFor="setting1">Setting 1</Label>
        <Input
          id="setting1"
          name="setting1"
          value={data.setting1 || ''}
          onChange={handleTextChange}
          placeholder="Enter value for setting 1"
        />
      </div>
      
      {/* Setting 2 - Number Input */}
      <div className="space-y-2">
        <Label htmlFor="setting2">Setting 2</Label>
        <Input
          id="setting2"
          name="setting2"
          type="number"
          value={data.setting2 || 0}
          onChange={handleNumberChange}
        />
      </div>
      
      {/* Setting 3 - Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="setting3"
          checked={data.setting3 || false}
          onCheckedChange={handleCheckboxChange}
        />
        <Label htmlFor="setting3">Setting 3</Label>
      </div>
    </div>
  );
};