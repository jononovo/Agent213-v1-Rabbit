/**
 * Node Select Input
 * 
 * A standardized select dropdown control for node configuration.
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface NodeSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  description?: string;
}

export function NodeSelect({
  id,
  label,
  value,
  onChange,
  options,
  className,
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  description
}: NodeSelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between">
        <Label 
          htmlFor={id} 
          className="text-xs font-medium"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-8 text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="text-sm"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}