/**
 * HandleWithLabel
 * 
 * Handle component with an attached label for better clarity.
 */

import React from 'react';
import { Handle, Position, Connection } from 'reactflow';
import { cn } from '@/lib/utils';

interface HandleWithLabelProps {
  type: 'source' | 'target';
  position: Position;
  id: string;
  label: string;
  isConnectable?: boolean;
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
  onConnect?: (connection: Connection) => void;
}

export function HandleWithLabel({
  type,
  position,
  id,
  label,
  isConnectable = true,
  className,
  showLabel = true,
  labelClassName,
  onConnect
}: HandleWithLabelProps) {
  // Determine style based on position
  const isHorizontal = position === Position.Left || position === Position.Right;
  const isInput = type === 'target';
  
  // Determine label position based on handle position
  const labelPosition = {
    [Position.Left]: 'ml-2',
    [Position.Right]: 'mr-2',
    [Position.Top]: 'mt-2',
    [Position.Bottom]: 'mb-2'
  }[position];
  
  return (
    <div className={cn(
      'relative flex',
      isHorizontal ? 'items-center' : 'flex-col',
      isInput && position === Position.Left && 'flex-row',
      !isInput && position === Position.Right && 'flex-row-reverse',
      position === Position.Top && 'flex-col',
      position === Position.Bottom && 'flex-col-reverse',
      className
    )}>
      <Handle
        type={type}
        position={position}
        id={id}
        isConnectable={isConnectable}
        className={cn(
          'w-3 h-3 border-2 bg-background',
          type === 'target' ? 'border-blue-500' : 'border-green-500'
        )}
        onConnect={onConnect}
      />
      {showLabel && (
        <span className={cn(
          'text-xs text-muted-foreground px-1',
          labelPosition,
          labelClassName
        )}>
          {label}
        </span>
      )}
    </div>
  );
}