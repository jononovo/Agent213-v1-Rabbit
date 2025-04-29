/**
 * NodeTextInput
 * 
 * A standardized text input control for node configuration with label.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NodeTextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
}

export function NodeTextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  required = false,
  description
}: NodeTextInputProps) {
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
      
      <Input
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-8 text-sm"
      />
    </div>
  );
}