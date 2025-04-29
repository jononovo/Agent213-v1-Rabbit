/**
 * Node Container
 * 
 * A wrapper component for workflow nodes that provides consistent styling.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface NodeContainerProps {
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
}

export const NodeContainer: React.FC<NodeContainerProps> = ({
  children,
  selected = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative bg-slate-50 shadow-sm rounded-lg border border-slate-200',
        'min-w-[240px] max-w-[320px] transition-all duration-200',
        selected && 'ring-2 ring-indigo-300 ring-opacity-50',
        className
      )}
    >
      {children}
    </div>
  );
};

export default NodeContainer;