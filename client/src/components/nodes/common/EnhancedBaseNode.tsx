/**
 * Enhanced Base Node - DEPRECATED
 * 
 * @deprecated This component is deprecated. Use BaseNode from /nodes/Base/ui.tsx instead.
 * 
 * This component extends the standard node functionality with consistent UI patterns
 * including:
 * - Settings icon in the header that opens a drawer/sheet
 * - Contextual menu on hover/click
 * - Standardized styling and layout
 */

import React, { useState } from 'react';
import { Settings, MoreHorizontal } from 'lucide-react';
import { NodeProps, Node } from 'reactflow';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { NodeContainer } from './NodeContainer';
import { NodeHeader } from './NodeHeader';
import { NodeContent } from './NodeContent';
import { NodeSettingsForm } from './NodeSettingsForm';

export interface EnhancedNodeData {
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  category?: string;
  settings?: {
    title?: string;
    fields?: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'slider';
      options?: Array<{ label: string; value: string | number }>;
      description?: string;
      min?: number;
      max?: number;
      step?: number;
    }>;
  };
  [key: string]: any;
}

interface EnhancedNodeProps {
  id: string;
  selected?: boolean;
  children?: React.ReactNode;
  data: EnhancedNodeData;
  showContextMenu?: boolean;
  onSettingsSubmit?: (data: EnhancedNodeData) => void;
}

export const EnhancedBaseNode: React.FC<EnhancedNodeProps> = ({
  id,
  data,
  selected,
  children,
  showContextMenu = true,
  onSettingsSubmit,
  ...props
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showContextActions, setShowContextActions] = useState(false);
  
  // Settings icon click handler
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(true);
  };
  
  // Settings submission handler
  const handleSubmitSettings = (updatedData: EnhancedNodeData) => {
    // Update node data when settings are changed
    if (data.onChange) {
      data.onChange({
        ...data,
        ...updatedData
      });
    }
    
    // Call additional onSettingsSubmit if provided
    if (onSettingsSubmit) {
      onSettingsSubmit(updatedData);
    }
    
    setShowSettings(false);
  };

  // Create context actions for the node
  const contextActions = [
    { label: 'Run Node', action: () => console.log('Run node:', id) },
    { label: 'Duplicate', action: () => console.log('Duplicate node:', id) },
    { label: 'Delete', action: () => console.log('Delete node:', id) }
  ];
  
  // Determine node category badge
  const categoryBadge = data.category ? (
    <Badge variant="outline" className="bg-slate-100 text-slate-700 text-xs">
      {data.category.toUpperCase()}
    </Badge>
  ) : null;
  
  // Create header actions with settings icon
  const headerActions = (
    <div className="flex items-center gap-1">
      {categoryBadge}
      {showContextMenu && (
        <Popover open={showContextActions} onOpenChange={setShowContextActions}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full hover:bg-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={14} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="end">
            <div className="flex flex-col gap-1">
              {contextActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.action();
                    setShowContextActions(false);
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 rounded-full hover:bg-slate-200"
        onClick={handleSettingsClick}
      >
        <Settings size={14} />
      </Button>
    </div>
  );
  
  return (
    <>
      <NodeContainer selected={selected} className={data._hasError ? 'border-red-300' : ''}>
        <NodeHeader 
          title={data.label || 'Node'} 
          description={data.description}
          icon={data.icon}
          actions={headerActions}
        />
        
        <NodeContent>
          {children}
        </NodeContent>
      </NodeContainer>
      
      {/* Settings Sheet/Drawer */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent className="w-[350px] sm:w-[450px]">
          <SheetHeader>
            <SheetTitle>{data.settings?.title || `${data.label || 'Node'} Settings`}</SheetTitle>
          </SheetHeader>
          
          <div className="py-4">
            {data.settings?.fields && data.settings.fields.length > 0 ? (
              <NodeSettingsForm 
                nodeData={data}
                settingsFields={data.settings.fields}
                onChange={handleSubmitSettings}
              />
            ) : (
              <div className="text-sm text-slate-600">
                No configurable settings for this node.
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={() => handleSubmitSettings(data)}
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EnhancedBaseNode;