/**
 * Node Header
 * 
 * A consistent header component for workflow nodes with title, icon, and actions.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface NodeHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  className,
}) => {
  return (
    <div className={cn('px-3 py-2 border-b border-slate-200', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="font-medium text-sm text-slate-800 truncate">
            {title}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center">
            {actions}
          </div>
        )}
      </div>
      
      {description && (
        <div className="mt-1 text-xs text-slate-500">
          {description}
        </div>
      )}
    </div>
  );
};

export default NodeHeader;