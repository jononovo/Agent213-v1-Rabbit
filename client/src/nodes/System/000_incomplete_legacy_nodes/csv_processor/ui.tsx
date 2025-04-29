/**
 * CSV Processor Node UI Component
 * 
 * This file contains the React component used to render the CSV processor node
 * in the workflow editor, with a modern hover menu and better UI.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, Settings, MoreHorizontal, AlertTriangle, Rows, Split } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { NodeContainer } from '@/components/nodes/common/NodeContainer';
import { NodeHeader } from '@/components/nodes/common/NodeHeader';
import { NodeContent } from '@/components/nodes/common/NodeContent';
import { NodeSettingsForm } from '@/components/nodes/common/NodeSettingsForm';
import { LabeledHandle } from '@/components/ui/labeled-handle';
import NodeHoverMenu, { 
  createDuplicateAction, 
  createDeleteAction, 
  createSettingsAction,
  createRunAction
} from '@/components/nodes/common/NodeHoverMenu';

// Default data for the node
export const defaultData = {
  hasHeader: true,
  delimiter: ',',
  trimValues: true,
  columnsToInclude: '',
  filterColumn: '',
  filterValue: '',
  filterOperation: 'equals',
  label: 'CSV Processor',
  preview: null
};

// Filter operations
const filterOperations = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' }
];

// CSV Processor node component
export const component = ({ data, id, isConnectable, selected }: NodeProps<any>) => {
  // States for component functionality
  // Removed showSettings state as we're using the centralized drawer
  const [showContextActions, setShowContextActions] = useState(false);
  const [showHoverMenu, setShowHoverMenu] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Refs for hover management
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverDelay = 300; // ms before showing menu
  const hideDelay = 400; // ms before hiding menu
  const hoverAreaRef = useRef<HTMLDivElement>(null);
  
  // Combine default data with passed data
  const nodeData = { ...defaultData, ...data };
  
  // Local state
  const [hasHeader, setHasHeader] = useState<boolean>(
    nodeData.hasHeader ?? defaultData.hasHeader
  );
  
  const [delimiter, setDelimiter] = useState<string>(
    nodeData.delimiter || defaultData.delimiter
  );
  
  const [trimValues, setTrimValues] = useState<boolean>(
    nodeData.trimValues ?? defaultData.trimValues
  );
  
  const [columnsToInclude, setColumnsToInclude] = useState<string>(
    nodeData.columnsToInclude || defaultData.columnsToInclude
  );
  
  const [filterColumn, setFilterColumn] = useState<string>(
    nodeData.filterColumn || defaultData.filterColumn
  );
  
  const [filterValue, setFilterValue] = useState<string>(
    nodeData.filterValue || defaultData.filterValue
  );
  
  const [filterOperation, setFilterOperation] = useState<string>(
    nodeData.filterOperation || defaultData.filterOperation
  );
  
  const [activeTab, setActiveTab] = useState<string>('general');
  
  // Preview state (would be populated from processed data)
  const [preview, setPreview] = useState<any>(nodeData.preview);
  
  // Update local state when node data changes
  useEffect(() => {
    if (nodeData.hasHeader !== undefined) setHasHeader(nodeData.hasHeader);
    if (nodeData.delimiter !== undefined) setDelimiter(nodeData.delimiter);
    if (nodeData.trimValues !== undefined) setTrimValues(nodeData.trimValues);
    if (nodeData.columnsToInclude !== undefined) setColumnsToInclude(nodeData.columnsToInclude);
    if (nodeData.filterColumn !== undefined) setFilterColumn(nodeData.filterColumn);
    if (nodeData.filterValue !== undefined) setFilterValue(nodeData.filterValue);
    if (nodeData.filterOperation !== undefined) setFilterOperation(nodeData.filterOperation);
    if (nodeData.preview !== undefined) setPreview(nodeData.preview);
  }, [nodeData]);
  
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
  
  // Callback for updating node data
  const updateNodeData = (updates: Record<string, any>) => {
    if (data.onChange) {
      data.onChange({
        ...nodeData,
        ...updates
      });
    }
  };
  
  // Handler for header toggle
  const handleHeaderToggle = (checked: boolean) => {
    setHasHeader(checked);
    updateNodeData({ hasHeader: checked });
  };
  
  // Handler for trim values toggle
  const handleTrimToggle = (checked: boolean) => {
    setTrimValues(checked);
    updateNodeData({ trimValues: checked });
  };
  
  // Handler for delimiter change
  const handleDelimiterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDelimiter(newValue);
    updateNodeData({ delimiter: newValue });
  };
  
  // Handler for columns to include change
  const handleColumnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setColumnsToInclude(newValue);
    updateNodeData({ columnsToInclude: newValue });
  };
  
  // Handler for filter column change
  const handleFilterColumnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFilterColumn(newValue);
    updateNodeData({ filterColumn: newValue });
  };
  
  // Handler for filter value change
  const handleFilterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFilterValue(newValue);
    updateNodeData({ filterValue: newValue });
  };
  
  // Handler for filter operation change
  const handleFilterOperationChange = (newValue: string) => {
    setFilterOperation(newValue);
    updateNodeData({ filterOperation: newValue });
  };
  
  // Settings icon click handler
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Always use the centralized settings drawer by dispatching the event
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };
  
  // Settings changes are now handled by the central settings drawer in FlowEditor
  
  // Node action handlers
  const handleRunNode = () => {
    console.log('Run node:', id);
    if (nodeData.onRun) {
      nodeData.onRun(id);
    }
  };
  
  const handleDuplicateNode = () => {
    console.log('Duplicate node:', id);
    if (nodeData.onDuplicate) {
      nodeData.onDuplicate(id);
    }
  };
  
  const handleDeleteNode = () => {
    console.log('Delete node:', id);
    if (nodeData.onDelete) {
      nodeData.onDelete(id);
    }
  };
  
  // Settings click handler for the menu 
  const handleSettingsClickForMenu = () => {
    // Always use the centralized settings drawer by dispatching the event
    const event = new CustomEvent('node-settings-open', { 
      detail: { nodeId: id }
    });
    window.dispatchEvent(event);
  };
  
  // Create hover menu actions
  const hoverMenuActions = [
    createRunAction(handleRunNode),
    createDuplicateAction(handleDuplicateNode),
    createSettingsAction(handleSettingsClickForMenu),
    createDeleteAction(handleDeleteNode)
  ];
  
  // Create context actions for the node (dropdown menu)
  const contextActions = [
    { label: 'Run Node', action: handleRunNode },
    { label: 'Duplicate', action: handleDuplicateNode },
    { label: 'Delete', action: handleDeleteNode }
  ];
  
  // Settings for the node settings form
  const settings = {
    title: "CSV Processor Settings",
    fields: [
      {
        key: "label",
        label: "Node Label",
        type: "text" as const,
        description: "Display name for this node"
      },
      {
        key: "hasHeader",
        label: "Has Header Row",
        type: "checkbox" as const,
        description: "Whether CSV has column headers in the first row"
      },
      {
        key: "delimiter",
        label: "Delimiter",
        type: "text" as const,
        description: "Character used to separate values (e.g., comma, tab, semicolon)"
      },
      {
        key: "trimValues",
        label: "Trim Values",
        type: "checkbox" as const,
        description: "Remove whitespace from beginning and end of values"
      },
      {
        key: "columnsToInclude",
        label: "Columns to Include",
        type: "text" as const,
        description: "Comma-separated list of columns to include (empty = all)"
      },
      {
        key: "filterColumn",
        label: "Filter Column",
        type: "text" as const,
        description: "Column name to filter on"
      },
      {
        key: "filterValue",
        label: "Filter Value",
        type: "text" as const,
        description: "Value to filter by"
      },
      {
        key: "filterOperation",
        label: "Filter Operation",
        type: "select" as const,
        description: "Operation to use when filtering rows",
        options: filterOperations
      }
    ]
  };
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (nodeData.isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
    if (nodeData.isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    if (nodeData.hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Create the header actions slot
  const headerActions = (
    <div className="flex items-center gap-1.5">
      {getStatusBadge()}
      
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
      <Table className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Additional class for animation and state indication
  const containerClass = cn(
    nodeData.isProcessing && 'animate-pulse',
    nodeData.isComplete && 'border-green-500/30',
    nodeData.hasError && 'border-red-500/30'
  );
  
  return (
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
              title={nodeData.label || "CSV Processor"} 
              description={nodeData.description || "Processes CSV data with column mapping and filtering"}
              icon={iconElement}
              actions={headerActions}
            />
            
            <NodeContent padding="normal">
              {/* Node Type Badge */}
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-100/50 dark:bg-slate-800/50">
                  {nodeData.category || "data"}
                </Badge>
                
                {/* Status badges */}
                <div className="flex gap-1">
                  {columnsToInclude && (
                    <Badge variant="outline" className="text-xs">
                      {columnsToInclude.split(',').filter(c => c.trim()).length} cols
                    </Badge>
                  )}
                  
                  {filterColumn && filterValue && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
                      Filter: {filterOperation}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Configuration section */}
              <div className="flex flex-col gap-3 mt-3">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-2">
                    <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                    <TabsTrigger value="filter" className="text-xs">Filter</TabsTrigger>
                  </TabsList>
                  
                  {/* General Tab */}
                  <TabsContent value="general" className="pt-1">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs cursor-pointer" htmlFor="has-header">
                          Has Header Row
                        </Label>
                        <Switch
                          id="has-header"
                          checked={hasHeader}
                          onCheckedChange={handleHeaderToggle}
                          className="scale-75"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-xs cursor-pointer" htmlFor="trim-values">
                          Trim Whitespace
                        </Label>
                        <Switch
                          id="trim-values"
                          checked={trimValues}
                          onCheckedChange={handleTrimToggle}
                          className="scale-75"
                        />
                      </div>
                      
                      <div className="mt-1">
                        <Label className="text-xs mb-1 block" htmlFor="delimiter">
                          Delimiter
                        </Label>
                        <Input
                          id="delimiter"
                          value={delimiter}
                          onChange={handleDelimiterChange}
                          className="h-8 text-sm"
                          placeholder=","
                        />
                      </div>
                      
                      <div className="mt-1">
                        <Label className="text-xs mb-1 block" htmlFor="columns-to-include">
                          Columns to Include
                        </Label>
                        <Input
                          id="columns-to-include"
                          value={columnsToInclude}
                          onChange={handleColumnsChange}
                          className="h-8 text-sm"
                          placeholder="col1,col2,col3"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Leave empty to include all columns
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Filter Tab */}
                  <TabsContent value="filter" className="pt-1">
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label className="text-xs mb-1 block" htmlFor="filter-column">
                          Filter Column
                        </Label>
                        <Input
                          id="filter-column"
                          value={filterColumn}
                          onChange={handleFilterColumnChange}
                          className="h-8 text-sm"
                          placeholder="Column name"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs mb-1 block" htmlFor="filter-operation">
                          Filter Operation
                        </Label>
                        <Select value={filterOperation} onValueChange={handleFilterOperationChange}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select operation" />
                          </SelectTrigger>
                          <SelectContent>
                            {filterOperations.map(op => (
                              <SelectItem key={op.value} value={op.value} className="text-sm">
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs mb-1 block" htmlFor="filter-value">
                          Filter Value
                        </Label>
                        <Input
                          id="filter-value"
                          value={filterValue}
                          onChange={handleFilterValueChange}
                          className="h-8 text-sm"
                          placeholder="Value to filter by"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* Preview section - would show a small sample of data if available */}
                {preview && (
                  <div className="mt-2">
                    <Separator className="my-2" />
                    <div className="text-xs font-medium mb-1">Preview</div>
                    <div className="text-xs text-muted-foreground">
                      {preview.rowCount} rows, {preview.columnCount} columns
                    </div>
                  </div>
                )}
              </div>
              
              {/* Status messages and errors */}
              {nodeData.hasError && nodeData.errorMessage && (
                <div className="mt-2 p-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium">Error</span>
                  </div>
                  {nodeData.errorMessage}
                </div>
              )}
            </NodeContent>
            
            {/* Input Handles - Kept as LabeledHandle for this node */}
            <LabeledHandle
              type="target"
              position={Position.Left}
              id="csvInput"
              label="CSV Input"
              isConnectable={isConnectable}
              handlePosition={0.5}
              bgColor="bg-blue-500"
            />
            
            {/* Output Handles - Kept as LabeledHandle for this node */}
            <LabeledHandle
              type="source"
              position={Position.Right}
              id="data"
              label="Processed Data"
              isConnectable={isConnectable}
              handlePosition={0.33}
              bgColor="bg-green-500"
            />
            
            <LabeledHandle
              type="source"
              position={Position.Right}
              id="metadata"
              label="Metadata"
              isConnectable={isConnectable}
              handlePosition={0.66}
              bgColor="bg-yellow-500"
            />
          </NodeContainer>
        </div>
      </div>
  );
};

export default component;