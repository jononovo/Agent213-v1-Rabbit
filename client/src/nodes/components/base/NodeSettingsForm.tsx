/**
 * Node Settings Form
 * 
 * A dynamic form component that renders form controls based on a node's settings configuration.
 * Used within the settings drawer/sheet to allow users to configure node parameters.
 */

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

/**
 * Settings field definition for node configuration
 */
export interface SettingsField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'slider';
  options?: Array<{ label: string; value: string | number }>;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Props for the NodeSettingsForm component
 */
export interface NodeSettingsFormProps {
  nodeData: Record<string, any>;
  settingsFields: SettingsField[];
  onChange: (updatedData: Record<string, any>) => void;
}

export interface NodeSettingsFormRef {
  submitForm: () => void;
}

export const NodeSettingsForm = forwardRef<NodeSettingsFormRef, NodeSettingsFormProps>((props, ref) => {
  const { nodeData, settingsFields, onChange } = props;
  
  // Extract settingsData if it exists, otherwise use just nodeData
  // Make sure nodeData exists and has properties before accessing settingsData
  const initialData = nodeData && typeof nodeData === 'object' ? 
    (nodeData.settingsData || nodeData) : {};
  const [formData, setFormData] = useState<Record<string, any>>({ ...initialData });
  
  // Method to submit the form data to the parent component
  const submitForm = () => {
    // Create a copy of the form data for the callback
    const updatedData = { ...formData };
    
    // If the node data has a settingsData property, update it properly
    if ('settingsData' in nodeData) {
      onChange({ settingsData: updatedData });
    } else {
      // Otherwise update the node data directly
      onChange(updatedData);
    }
  };
  
  // Expose the submitForm method via the ref
  useImperativeHandle(ref, () => ({
    submitForm
  }));
  
  // Handle changes to form fields
  const handleFieldChange = (key: string, value: any) => {
    const updatedData = {
      ...formData,
      [key]: value
    };
    
    setFormData(updatedData);
    // Don't call onChange here, wait until the user clicks Apply
  };
  
  // Render the appropriate form control based on field type
  const renderField = (field: SettingsField) => {
    const value = formData[field.key] !== undefined ? formData[field.key] : '';
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.key}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
        
      case 'number':
        return (
          <Input
            id={field.key}
            type="number"
            value={value}
            min={field.min}
            max={field.max}
            step={field.step || 1}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
          />
        );
        
      case 'textarea':
        return (
          <Textarea
            id={field.key}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="min-h-[80px]"
          />
        );
        
      case 'checkbox':
        return (
          <Checkbox
            id={field.key}
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
          />
        );
        
      case 'select':
        return (
          <Select
            value={String(value)}
            onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'slider':
        return (
          <div className="flex flex-col gap-2">
            <Slider
              id={field.key}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              value={[value || 0]}
              onValueChange={([newValue]) => handleFieldChange(field.key, newValue)}
            />
            <div className="text-xs text-right">{value}</div>
          </div>
        );
        
      default:
        return <div>Unsupported field type: {field.type}</div>;
    }
  };

  return (
    <div className="space-y-4 py-2">
      {settingsFields.map((field) => (
        <div key={field.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            {field.type === 'checkbox' && renderField(field)}
          </div>
          
          {field.description && (
            <div className="text-xs text-slate-500 mb-1">{field.description}</div>
          )}
          
          {field.type !== 'checkbox' && renderField(field)}
        </div>
      ))}
    </div>
  );
});

export default NodeSettingsForm;