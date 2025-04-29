/**
 * Node Content
 * 
 * A consistent content wrapper for workflow nodes that provides padding and styling.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface NodeContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
}

export const NodeContent: React.FC<NodeContentProps> = ({
  children,
  className,
  padding = 'normal'
}) => {
  // Map padding values to actual classes
  const paddingClass = {
    'none': 'p-0',
    'small': 'p-2',
    'normal': 'p-3',
    'large': 'p-4'
  }[padding];
  
  return (
    <div className={cn(paddingClass, className)}>
      {children}
    </div>
  );
};

export default NodeContent;