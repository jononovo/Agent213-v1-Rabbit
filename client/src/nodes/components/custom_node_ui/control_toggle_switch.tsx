/**
 * NodeToggleSwitch
 * 
 * A standardized toggle switch control for node configuration.
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NodeToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  description?: string;
}

export function NodeToggleSwitch({
  id,
  label,
  checked,
  onCheckedChange,
  className,
  disabled = false,
  description
}: NodeToggleSwitchProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="space-y-1">
        <Label 
          htmlFor={id} 
          className="text-xs font-medium"
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}