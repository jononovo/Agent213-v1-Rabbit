/**
 * Default Node
 * 
 * This is the default node UI component used for basic node types
 * and as a fallback for node types without specific implementations.
 * 
 * Features:
 * - Settings drawer/sheet functionality
 * - Status badges for node execution state
 * - Settings summary display
 * - Error message display
 * - Hover menu for quick actions
 */

import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Settings, MoreHorizontal, AlertTriangle, Trash2, StickyNote, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DynamicIcon from '@/components/ui/dynamic-icon';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { NodeSettingsForm } from '@/components/nodes/common/NodeSettingsForm';
import NodeHoverMenu, { 
  createDuplicateAction, 
  createDeleteAction, 
  createSettingsAction,
  createRunAction,
  createAddNoteAction,
  NodeHoverMenuAction
} from '@/components/nodes/common/NodeHoverMenu';

interface SettingsField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'slider';
  options?: Array<{ label: string; value: string | number }>;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface NodeSettings {
  title?: string;
  fields?: SettingsField[];
}

export interface DefaultNodeData {
  label: string;
  description?: string;
  type?: string;
  category?: string;
  settings?: NodeSettings;
  settingsData?: Record<string, any>;
  isProcessing?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  icon?: string | React.ReactNode;
  onChange?: (data: any) => void;
  [key: string]: any;
}

/**
 * Default Node - A generic node type with settings functionality
 * 
 * This node type serves as a fallback for nodes that don't have
 * specific UI implementations, or for simple node types that don't
 * need custom rendering. It includes a settings drawer.
 */
function DefaultNode({ 
  data, 
  id, 
  selected = false, 
  isConnectable = true, 
  type = "default", 
  zIndex = undefined, 
  xPos = undefined, 
  yPos = undefined, 
  dragHandle = undefined, 
  ...rest 
}: Partial<NodeProps<DefaultNodeData>> & { id: string; data: DefaultNodeData }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showContextActions, setShowContextActions] = useState(false);
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverDelay = 300; // ms before showing menu
  const hideDelay = 400; // ms before hiding menu
  const hoverAreaRef = useRef<HTMLDivElement>(null);
  
  // Note-related state variables
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState(data.note || '');
  const [noteVisibility, setNoteVisibility] = useState(data.showNote || false);
  
  // Register with FlowEditor for settings and listen for node events
  useEffect(() => {
    // Add global event listener for node settings
    const handleNodeSettings = () => {
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    };
    
    // Add the settings click handler to the node data
    if (data.onSettingsClick === undefined && data.onChange) {
      // Only add if it doesn't already exist
      data.onChange({
        ...data,
        onSettingsClick: handleNodeSettings
      });
    }
    
    // Listen for note edit events that match this node
    const handleNoteEditEvent = (event: CustomEvent) => {
      if (event.detail.nodeId === id) {
        setNoteText(data.note || '');
        setNoteVisibility(data.showNote || false);
        setNoteDialogOpen(true);
      }
    };
    
    window.addEventListener('node-note-edit', handleNoteEditEvent as EventListener);
    
    return () => {
      window.removeEventListener('node-note-edit', handleNoteEditEvent as EventListener);
    };
  }, [id, data]);
  
  // Function to handle hover start
  const handleHoverStart = useCallback(() => {
    // Set a timeout to show the menu after hovering for specified delay
    const timer = setTimeout(() => {
      setShowHoverMenu(true);
    }, hoverDelay);
    
    setHoverTimer(timer);
  }, [hoverDelay]);
  
  // Function to handle hover end
  const handleHoverEnd = useCallback(() => {
    // Clear the timeout if the user stops hovering before the menu appears
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    
    // Add a delay before hiding the menu to give users time to move to it
    const timer = setTimeout(() => {
      setShowHoverMenu(false);
    }, hideDelay);
    
    setHoverTimer(timer);
  }, [hoverTimer, hideDelay]);
  
  // Handle menu hovering to keep it visible when cursor moves from node to menu
  const handleMenuHoverStart = useCallback(() => {
    setShowHoverMenu(true);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);
  
  // Destructure node data with defaults
  const {
    label = 'Node',
    description = 'Generic node',
    type: nodeType = 'default',
    category = 'general',
    settings = { fields: [] },
    settingsData = {},
    isProcessing = false,
    isComplete = false,
    hasError = false,
    errorMessage = '',
    icon = 'box',
    onChange
  } = data;
  
  // Settings icon click handler
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If we have an onSettingsClick function from FlowEditor, use it
    if (data.onSettingsClick) {
      data.onSettingsClick();
    } else if (data.useGlobalSettingsOnly) {
      // Only emit the event for nodes that should use the global settings drawer
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    } else {
      // Otherwise, fall back to local settings drawer
      setShowSettings(true);
      
      // Also emit the node-settings-open event for FlowEditor to catch
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  };
  
  // Settings submission handler
  const handleSubmitSettings = (updatedData: any) => {
    // Update node data when settings are changed
    if (onChange) {
      // If the updated data contains settingsData, handle it properly
      if (updatedData.settingsData) {
        onChange({
          ...data,
          settingsData: {
            ...(data.settingsData || {}),
            ...updatedData.settingsData
          }
        });
      } else {
        // Otherwise apply the updates directly
        onChange({
          ...data,
          ...updatedData
        });
      }
    }
    
    setShowSettings(false);
  };
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Get settings summary for display in the node
  const getSettingsSummary = () => {
    if (!settingsData || Object.keys(settingsData).length === 0) {
      return null;
    }
    
    // Format based on common settings patterns
    const summaryItems = [];
    
    if (settingsData.operation) {
      summaryItems.push(`Operation: ${settingsData.operation}`);
    }
    
    if (settingsData.method) {
      summaryItems.push(`Method: ${settingsData.method}`);
    }
    
    if (settingsData.format) {
      summaryItems.push(`Format: ${settingsData.format}`);
    }
    
    if (settingsData.triggerType) {
      summaryItems.push(`Trigger: ${settingsData.triggerType}`);
    }
    
    // Return formatted summary or just the first few settings
    if (summaryItems.length > 0) {
      return summaryItems.join(' • ');
    } else {
      // Just take first 2 settings if available
      const keys = Object.keys(settingsData).slice(0, 2);
      return keys.map(key => `${key}: ${String(settingsData[key])}`).join(' • ');
    }
  };
  
  // Node action handlers
  const handleRunNode = () => {
    console.log('Run node:', id);
    if (data.onRun) {
      data.onRun(id);
    }
  };
  
  // Handler for adding/editing a note
  const handleEditNote = () => {
    console.log('Edit note for node:', id);
    // Open the note dialog directly
    setNoteText(data.note || '');
    setNoteVisibility(data.showNote || false);
    setNoteDialogOpen(true);
  };
  
  // Dispatch a custom event to let the FlowEditor know about note updates
  const dispatchNoteUpdateEvent = (noteData: { note?: string, showNote?: boolean }) => {
    const event = new CustomEvent('node-note-update', { 
      detail: { 
        nodeId: id,
        ...noteData
      }
    });
    window.dispatchEvent(event);
    console.log('Dispatched node-note-update event:', id, noteData);
  };
  
  // Handler for saving note
  const handleSaveNote = () => {
    // Update local component data through onChange if available
    if (onChange) {
      onChange({
        ...data,
        note: noteText,
        showNote: noteVisibility
      });
    }

    // Also dispatch a global event for the FlowEditor to catch and save
    dispatchNoteUpdateEvent({ 
      note: noteText,
      showNote: noteVisibility 
    });
    setNoteDialogOpen(false);
  };
  
  // Handler for deleting a note
  const handleDeleteNote = () => {
    // Update local component data through onChange if available
    if (onChange) {
      onChange({
        ...data,
        note: '',
        showNote: false
      });
    }
    
    // Also dispatch a global event for the FlowEditor to catch and save
    dispatchNoteUpdateEvent({ 
      note: '',
      showNote: false 
    });
    setNoteDialogOpen(false);
  };
  
  const handleDuplicateNode = () => {
    console.log('Duplicate node:', id);
    if (data.onDuplicate) {
      data.onDuplicate(id);
    } else {
      // If no onDuplicate handler is provided, dispatch a custom event
      const event = new CustomEvent('node-duplicate', { 
        detail: { 
          nodeId: id,
          nodeType: type,
          nodeData: data,
          position: { x: data.position?.x, y: data.position?.y }
        }
      });
      window.dispatchEvent(event);
      console.log('Dispatched node-duplicate event for node:', id);
    }
  };
  
  const handleDeleteNode = () => {
    console.log('Delete node:', id);
    if (data.onDelete) {
      data.onDelete(id);
    }
  };
  
  // Settings click handler for the menu 
  const handleSettingsClickForMenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // If we have an onSettingsClick function from FlowEditor, use it
    if (data.onSettingsClick) {
      data.onSettingsClick();
    } else if (data.useGlobalSettingsOnly) {
      // Only emit the event for nodes that should use the global settings drawer
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    } else {
      // Otherwise, fall back to local settings drawer
      setShowSettings(true);
      
      // Also emit the node-settings-open event for FlowEditor to catch
      const event = new CustomEvent('node-settings-open', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    }
  };
  
  // State for the delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Delete confirmation handlers
  const openDeleteConfirmation = () => {
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    // Close the dialog
    setShowDeleteDialog(false);
    
    // Execute the delete action
    if (data.onDelete) {
      data.onDelete(id);
    } else {
      // If no onDelete handler is provided, dispatch a custom event
      const event = new CustomEvent('node-delete', { 
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
      console.log('Dispatched node-delete event for node:', id);
    }
  };
  
  // Custom delete action with confirmation
  const deleteAction: NodeHoverMenuAction = {
    id: 'delete',
    icon: <Trash2 className="h-4 w-4" />,
    label: 'Delete Node',
    onClick: openDeleteConfirmation,
    variant: 'destructive'
  };
  
  // Create hover menu actions
  const hoverMenuActions: NodeHoverMenuAction[] = [
    createRunAction(handleRunNode),
    createDuplicateAction(handleDuplicateNode),
    createAddNoteAction(handleEditNote),
    createSettingsAction(handleSettingsClickForMenu),
    deleteAction
  ];
  
  // Create context actions for the node (dropdown menu)
  const contextActions = [
    { label: 'Run Node', action: handleRunNode },
    { label: 'Add/Edit Note', action: handleEditNote },
    { label: 'Duplicate', action: handleDuplicateNode },
    { label: 'Delete', action: openDeleteConfirmation }
  ];
  
  const settingsSummary = getSettingsSummary();
  
  // Create the header actions slot
  const headerActions = (
    <div className="flex items-center gap-1.5">
      {getStatusBadge()}
      
      {/* Note button - only show if a note exists */}
      {data.note && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-amber-500 hover:text-amber-600"
          onClick={(e) => {
            e.stopPropagation();
            handleEditNote();
          }}
          title="Edit note"
        >
          <StickyNote className="h-3.5 w-3.5" />
        </Button>
      )}
      
      <Popover open={showContextActions} onOpenChange={setShowContextActions}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
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
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7"
        onClick={handleSettingsClick}
      >
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      {typeof icon === 'string' ? (
        <DynamicIcon icon={icon} className="h-4 w-4 text-primary" />
      ) : React.isValidElement(icon) ? (
        icon
      ) : icon && typeof icon === 'object' && Object.keys(icon).length === 0 ? (
        // Handle empty object case that was causing the React error
        <DynamicIcon icon="box" className="h-4 w-4 text-primary" />
      ) : (
        <DynamicIcon icon="box" className="h-4 w-4 text-primary" />
      )}
    </div>
  );
  
  // Additional class for animation and state indication
  const containerClass = cn(
    isProcessing && 'animate-pulse',
    isComplete && 'border-green-500/30',
    hasError && 'border-red-500/30'
  );
  
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Node</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this node? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-scroll">
          <SheetHeader>
            <SheetTitle>
              {settings.title || `${label} Settings`}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 pt-4">
            <NodeSettingsForm 
              nodeData={data} 
              settingsFields={settings.fields || []} 
              onChange={handleSubmitSettings} 
            />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Note editing dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Node Note</DialogTitle>
            <DialogDescription>
              Add notes or comments about this node's purpose or configuration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Textarea
              placeholder="Enter note text here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[120px]"
            />
            
            {/* Note visibility toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 text-sm">Show note on node</div>
              <div 
                className="cursor-pointer flex items-center" 
                onClick={() => setNoteVisibility(!noteVisibility)}
              >
                <div className={cn(
                  "w-10 h-5 rounded-full transition-colors flex items-center",
                  noteVisibility ? "bg-amber-500" : "bg-gray-300"
                )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-white transform transition-transform mx-0.5",
                    noteVisibility ? "translate-x-5" : ""
                  )} />
                </div>
                <div className="ml-2 text-sm">
                  {noteVisibility ? 
                    <span className="text-amber-500">Visible</span> : 
                    <span className="text-gray-500">Hidden</span>}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteNote}
                className="bg-red-600 hover:bg-red-700"
                disabled={!data.note && noteText.trim() === ''}
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setNoteDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
            <Button
              type="button"
              onClick={handleSaveNote}
              className={data.note ? '' : 'bg-amber-600 hover:bg-amber-700'}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div 
        ref={hoverAreaRef}
        className="relative"
        style={{ 
          // Add padding when menu is shown to create a seamless interaction area
          padding: showHoverMenu ? '8px 20px 8px 8px' : '0',
          margin: showHoverMenu ? '-8px -20px -8px -8px' : '0',
        }}
      >
        <div
          ref={nodeRef}
          onMouseEnter={handleHoverStart}
          onMouseLeave={handleHoverEnd}
          className="relative"
        >
          {/* Hover Menu */}
          {showHoverMenu && (
            <div 
              ref={menuRef}
              onMouseEnter={handleMenuHoverStart}
              onMouseLeave={handleHoverEnd}
              className="absolute z-50"
              style={{ right: '-8px', top: '0px' }}
            >
              <NodeHoverMenu 
                nodeId={id}
                actions={hoverMenuActions}
                position="right"
              />
            </div>
          )}
          
          <NodeContainer selected={selected} className={containerClass}>
            <NodeHeader 
              title={label} 
              description={description}
              icon={iconElement}
              actions={headerActions}
            />
            
            <NodeContent padding="normal">
              <div className="flex flex-col gap-2">
                {/* If custom content is provided, render it */}
                {data.childrenContent ? (
                  <div>{data.childrenContent}</div>
                ) : (
                  <>
                    {/* Node Type Badge */}
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-100/50 dark:bg-slate-800/50">
                        {category}
                      </Badge>
                      
                      {/* Settings Summary */}
                      {settingsSummary && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Settings className="h-3 w-3 mr-1 inline" />
                          <span className="truncate">{settingsSummary}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Status messages and errors - always show */}
                {hasError && errorMessage && (
                  <div className="p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">Error</span>
                    </div>
                    <div className="whitespace-pre-line">{errorMessage}</div>
                  </div>
                )}
                
                {/* Node Note - always show if showNote is true and there's a note */}
                {data.showNote && data.note && (
                  <div className="mt-2 p-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800/50">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center">
                        <StickyNote className="h-3 w-3 mr-1" />
                        <span className="font-medium">Note</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 -mr-1 -mt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote();
                        }}
                      >
                        <PenLine className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                      </Button>
                    </div>
                    <div className="whitespace-pre-line">{data.note}</div>
                  </div>
                )}
              </div>
            </NodeContent>
            
            {/* Input and output handles - only render if not explicitly hidden */}
            {!data.hideDefaultHandles && (
              <>
                {/* Input handle for triggering the node */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id="input"
                  style={{ 
                    top: 50, 
                    width: '12px', 
                    height: '12px', 
                    background: 'white',
                    border: '2px solid #3b82f6'
                  }}
                  isConnectable={true}
                />
                <div className="absolute left-2 top-[46px] text-xs text-muted-foreground">
                  In
                </div>

                {/* Output handle for continuing to the next node */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id="output"
                  style={{ 
                    top: 50, 
                    width: '12px', 
                    height: '12px', 
                    background: 'white',
                    border: '2px solid #10b981'
                  }}
                  isConnectable={true}
                />
                <div className="absolute right-2 top-[46px] text-xs text-muted-foreground text-right">
                  Out
                </div>
              </>
            )}
          </NodeContainer>
        </div>
      </div>
    </>
  );
}

export default memo(DefaultNode);