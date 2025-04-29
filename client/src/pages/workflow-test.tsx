/**
 * Workflow Test Bench
 * 
 * This page provides a comprehensive UI for testing workflow execution 
 * directly in the client. The structure is designed to be both user-friendly
 * and programmatically accessible for agent use.
 */
"use client";

import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { executeWorkflow, executeWorkflowIsolated, loadWorkflow } from '@/lib/workflowClient';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { NodeState, WorkflowExecutionState } from '@/lib/types/workflow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { registerAllEnhancedNodeExecutors } from '@/lib/enhancedWorkflowEngine';
import { ChevronLeft, Play, Download, Upload, Copy, Check, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Simplified content wrapper without header and sidebar for test page
const TestContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex-grow overflow-y-auto">
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

// Input templates by workflow type to help both users and agents
const inputTemplates = {
  'agent_creation': {
    name: "New Agent Name",
    description: "Detailed description of what this agent does",
    type: "ai_assistant", // or 'workflow', 'custom', etc.
    icon: "sparkles", // icon name
    status: "active",
    source: "ui_form" // or 'ai_chat'
  },
  'weather_check': {
    location: "New York",
    units: "metric", // or 'imperial'
    source: "ui_form"
  },
  'text_analysis': {
    text: "This is sample text that needs to be analyzed",
    analysis_type: "sentiment", // or 'entities', 'keywords', etc.
    source: "ui_form"
  },
  'default': {
    inputText: "Write a poem about a pig"
  }
};

export default function WorkflowTestBench() {
  // URL parameters
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  
  // State
  const [workflowId, setWorkflowId] = useState<string>(params.id || '15'); // Default to workflow 15 or URL param
  const [inputData, setInputData] = useState<string>(''); 
  const [jsonInput, setJsonInput] = useState<string>('{\n  "inputText": "Write a poem about a pig"\n}');
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [inputTab, setInputTab] = useState<string>('json');
  const [skipLogging, setSkipLogging] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Initialize workflow engine and load workflow when component mounts
  useEffect(() => {
    const initWorkflowEngine = async () => {
      try {
        // Initialize the unified node registry directly
        
        // Update the enhancedWorkflowEngine registration
        await registerAllEnhancedNodeExecutors();
        
        // Log success message
        console.log('Workflow engine initialized with unified node registry');
      } catch (err) {
        console.error('Failed to initialize workflow engine:', err);
        setError('Failed to initialize workflow engine. See console for details.');
      }
    };

    initWorkflowEngine();

    // If we have a workflow ID (either from URL or default), load it
    if (workflowId) {
      handleLoadWorkflow();
    }
  }, []); // Run only on initial render

  // Watch for URL param changes
  useEffect(() => {
    if (params.id && params.id !== workflowId) {
      setWorkflowId(params.id);
      handleLoadWorkflow();
    }
  }, [params.id]);

  const handleLoadWorkflow = async () => {
    if (!workflowId || !/^\d+$/.test(workflowId)) {
      setError('Please enter a valid workflow ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setWorkflowData(null);
      setExecutionResult(null);
      setNodeStates({});
      setExecutionLogs([]);

      const workflow = await loadWorkflow(parseInt(workflowId));
      setWorkflowData(workflow);
      
      // Update URL if it doesn't match the current workflow ID
      if (params.id !== workflowId) {
        navigate(`/workflow-test/${workflowId}`, { replace: true });
      }
      
      // Select an appropriate template based on workflow type
      if (workflow.type) {
        const templateKey = Object.keys(inputTemplates).find(key => 
          workflow.type.toLowerCase().includes(key.toLowerCase())
        ) || 'default';
        
        setSelectedTemplate(templateKey);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading workflow:', err);
      setError(`Failed to load workflow: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteWorkflow = async () => {
    try {
      setIsExecuting(true);
      setError(null);
      setExecutionResult(null);
      setNodeStates({});
      setExecutionLogs([]);

      // Parse input data based on the selected input tab
      let parsedInput: any;
      
      if (inputTab === 'json') {
        try {
          parsedInput = jsonInput ? JSON.parse(jsonInput) : {};
        } catch (err) {
          setError('Invalid JSON input. Please check your syntax.');
          setIsExecuting(false);
          return;
        }
      } else {
        // Simple text input
        parsedInput = inputData || '';
      }

      // Add log entry
      addExecutionLog(`Executing workflow ${workflowId} with input: ${typeof parsedInput === 'string' ? parsedInput : JSON.stringify(parsedInput, null, 2)}`);

      const result = await executeWorkflow(
        parseInt(workflowId), 
        parsedInput,
        {
          onNodeStateChange: (nodeId, state) => {
            addExecutionLog(`Node ${nodeId} [${state.status}]: ${state.message || ''}`);
            setNodeStates(prev => ({
              ...prev,
              [nodeId]: state
            }));
          },
          onWorkflowComplete: (finalState) => {
            addExecutionLog(`Workflow execution completed with status: ${finalState.status}`);
            if (finalState.error) {
              addExecutionLog(`Error: ${finalState.error}`);
            }
          },
          metadata: {
            source: parsedInput.source || 'ui_form',
            test_execution: true,
            debug_mode: debugMode
          },
          logToServer: !skipLogging
        }
      );

      setExecutionResult(result);
    } catch (err: any) {
      console.error('Error executing workflow:', err);
      setError(`Failed to execute workflow: ${err.message || 'Unknown error'}`);
      addExecutionLog(`Execution error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Handle isolated workflow execution using the dedicated server
  const handleExecuteIsolatedWorkflow = async () => {
    try {
      setIsExecuting(true);
      setError(null);
      setExecutionResult(null);
      setNodeStates({});
      setExecutionLogs([]);

      // Parse input data based on the selected input tab
      let parsedInput: any;
      
      if (inputTab === 'json') {
        try {
          parsedInput = jsonInput ? JSON.parse(jsonInput) : {};
        } catch (err) {
          setError('Invalid JSON input. Please check your syntax.');
          setIsExecuting(false);
          return;
        }
      } else {
        // Simple text input
        parsedInput = inputData || '';
      }

      // Add log entry
      addExecutionLog(`Executing workflow ${workflowId} in isolated mode with input: ${typeof parsedInput === 'string' ? parsedInput : JSON.stringify(parsedInput, null, 2)}`);

      // Use the isolated execution service
      addExecutionLog('Using isolated workflow execution server for enhanced stability');
      
      // Start a polling status indicator
      const statusInterval = setInterval(() => {
        addExecutionLog('Waiting for isolated execution server response...');
      }, 3000);
      
      try {
        const result = await executeWorkflowIsolated(
          parseInt(workflowId), 
          parsedInput,
          {
            timeout: 60000 // 1 minute timeout
          }
        );
        
        clearInterval(statusInterval);
        
        // Process the result
        addExecutionLog(`Isolated workflow execution completed successfully`);
        
        // Create a compatible result format for the UI
        const formattedResult: WorkflowExecutionState = {
          status: 'completed',
          output: result,
          nodeStates: {},
          nodeOutputs: {},
          startTime: new Date(),
          endTime: new Date()
        };
        
        setExecutionResult(formattedResult);
        addExecutionLog(`Result: ${JSON.stringify(result, null, 2)}`);
      } catch (error: any) {
        clearInterval(statusInterval);
        throw error;
      }
    } catch (err: any) {
      console.error('Error executing isolated workflow:', err);
      setError(`Failed to execute workflow: ${err.message || 'Unknown error'}`);
      addExecutionLog(`Execution error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const addExecutionLog = (message: string) => {
    setExecutionLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'running': return 'text-blue-500';
      case 'waiting': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'destructive';
      case 'running': return 'default';
      case 'waiting': return 'secondary';
      default: return 'outline';
    }
  };

  const getNodeStatusSummary = () => {
    const statusCounts: Record<string, number> = {};
    Object.values(nodeStates).forEach(state => {
      statusCounts[state.status] = (statusCounts[state.status] || 0) + 1;
    });
    return statusCounts;
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "The execution result has been copied to your clipboard.",
    });
  };
  
  const loadInputTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = inputTemplates[templateKey as keyof typeof inputTemplates] || inputTemplates.default;
    setJsonInput(JSON.stringify(template, null, 2));
    setInputTab('json');
  };
  
  const downloadResults = () => {
    if (!executionResult) return;
    
    const data = {
      workflowId: parseInt(workflowId),
      workflowName: workflowData?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      status: executionResult.status,
      output: executionResult.output,
      error: executionResult.error,
      nodeStates: Object.entries(nodeStates).map(([nodeId, state]) => ({
        nodeId,
        nodeName: state.nodeName,
        status: state.status,
        input: state.input,
        output: state.output,
        error: state.error,
        startTime: state.startTime?.toISOString(),
        endTime: state.endTime?.toISOString()
      })),
      logs: executionLogs
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${workflowId}-execution-${new Date().toISOString().replace(/\:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Results downloaded",
      description: "The execution results have been downloaded as a JSON file.",
    });
  };
  
  // Handle file upload for JSON inputs
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Attempt to parse to validate it's proper JSON
        JSON.parse(content);
        setJsonInput(content);
        setInputTab('json');
        toast({
          title: "File loaded",
          description: "JSON input loaded from file successfully.",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Invalid JSON",
          description: "The selected file does not contain valid JSON.",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <TestContent>
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              className="mr-2"
              onClick={() => navigate('/workflow-editor/' + workflowId)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Editor
            </Button>
            <h1 className="text-2xl font-bold">Workflow Test Bench</h1>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Selection</CardTitle>
                  <CardDescription>Load a workflow by ID</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input 
                      type="number"
                      placeholder="Workflow ID"
                      value={workflowId}
                      onChange={(e) => setWorkflowId(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleLoadWorkflow}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Load'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Details</CardTitle>
                  <CardDescription>
                    {workflowData ? `${workflowData.name} (ID: ${workflowData.id})` : 'No workflow loaded'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workflowData ? (
                    <div>
                      <p className="mb-2"><strong>Description:</strong> {workflowData.description || 'No description'}</p>
                      <p className="mb-2"><strong>Type:</strong> {workflowData.type || 'Unknown'}</p>
                      <p className="mb-2"><strong>Agent ID:</strong> {workflowData.agentId || 'None'}</p>
                      <p className="mb-2"><strong>Nodes:</strong> {workflowData.flowData?.nodes?.length || 0}</p>
                    </div>
                  ) : (
                    <p>{isLoading ? 'Loading workflow...' : 'Enter a workflow ID and click Load'}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Input Data</CardTitle>
                <CardDescription>Provide input for the workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="template-select">Select input template</Label>
                  <div className="flex space-x-2 mt-1">
                    <Select value={selectedTemplate} onValueChange={loadInputTemplate}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(inputTemplates).map(key => (
                          <SelectItem key={key} value={key}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" className="flex items-center" asChild>
                      <label>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload JSON
                        <input 
                          type="file" 
                          accept=".json" 
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                      </label>
                    </Button>
                  </div>
                </div>
                
                <Tabs defaultValue={inputTab} onValueChange={setInputTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="json">JSON Input</TabsTrigger>
                    <TabsTrigger value="text">Text Input</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="json">
                    <Textarea 
                      placeholder="Enter JSON input"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="font-mono text-sm min-h-[200px]"
                    />
                  </TabsContent>
                  
                  <TabsContent value="text">
                    <Textarea 
                      placeholder="Enter text input"
                      value={inputData}
                      onChange={(e) => setInputData(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skip-logging" 
                    checked={skipLogging} 
                    onCheckedChange={(checked) => setSkipLogging(!!checked)}
                  />
                  <Label htmlFor="skip-logging">Skip server logging</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="debug-mode" 
                    checked={debugMode} 
                    onCheckedChange={(checked) => setDebugMode(!!checked)}
                  />
                  <Label htmlFor="debug-mode">Debug mode</Label>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Execution</CardTitle>
                <CardDescription>Run the workflow and view results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    onClick={handleExecuteWorkflow}
                    disabled={isExecuting || !workflowData}
                    className="w-full"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Execute In-Process
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleExecuteIsolatedWorkflow}
                    disabled={isExecuting || !workflowData}
                    className="w-full"
                    variant="outline"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Execute Isolated
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Use isolated execution for enhanced stability and crash resistance
                  </p>
                </div>
                
                {executionResult && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Result:</h3>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(executionResult, null, 2))}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={downloadResults}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <p className={`mb-2 ${getStatusColor(executionResult.status)}`}>
                      Status: <strong>{executionResult.status}</strong>
                    </p>
                    
                    {executionResult.error && (
                      <Alert variant="destructive" className="mb-2">
                        <AlertDescription>{executionResult.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="mb-2">
                      <h4 className="font-semibold">Node Status:</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(getNodeStatusSummary()).map(([status, count]) => (
                          <Badge key={status} variant={getBadgeVariant(status)}>
                            {status}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {executionResult.output && (
                      <div className="mb-2">
                        <h4 className="font-semibold">Output:</h4>
                        <div className="bg-gray-100 p-2 rounded-md mt-1 max-h-[200px] overflow-auto">
                          <pre className="text-xs whitespace-pre-wrap">{
                            typeof executionResult.output === 'string'
                              ? executionResult.output
                              : JSON.stringify(executionResult.output, null, 2)
                          }</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution Logs</CardTitle>
                <CardDescription>Detailed logs of the workflow execution</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full">
                  {executionLogs.length > 0 ? (
                    <div className="space-y-1">
                      {executionLogs.map((log, index) => (
                        <div key={index} className="text-sm">
                          <pre className="whitespace-pre-wrap">{log}</pre>
                          {index < executionLogs.length - 1 && <Separator className="my-1" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No execution logs yet.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {Object.keys(nodeStates).length > 0 && (
            <Card className="mt-4 mb-12">
              <CardHeader>
                <CardTitle>Node Execution Details</CardTitle>
                <CardDescription>Status and outputs for each node</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(nodeStates)
                    .sort(([_aId, a], [_bId, b]) => {
                      // Sort by execution order (timestamp) if available
                      const aTime = a.startTime?.getTime() || 0;
                      const bTime = b.startTime?.getTime() || 0;
                      return aTime - bTime;
                    })
                    .map(([nodeId, state]) => (
                      <div key={nodeId} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {state.nodeName || `Node ${nodeId}`} 
                            <span className="ml-2 text-xs text-gray-500">({nodeId})</span>
                          </h4>
                          <Badge variant={getBadgeVariant(state.status)}>{state.status}</Badge>
                        </div>
                        
                        {state.message && (
                          <p className="text-sm mb-2">{state.message}</p>
                        )}
                        
                        {state.error && (
                          <div className="bg-red-50 text-red-700 p-2 rounded-md text-sm mb-2">
                            {state.error}
                          </div>
                        )}
                        
                        {state.input && (
                          <div className="mb-2">
                            <h5 className="text-xs font-medium text-gray-500">Input:</h5>
                            <div className="bg-gray-50 p-2 rounded-md mt-1">
                              <pre className="text-xs whitespace-pre-wrap">{
                                typeof state.input === 'string'
                                  ? state.input
                                  : JSON.stringify(state.input, null, 2)
                              }</pre>
                            </div>
                          </div>
                        )}
                        
                        {state.output && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-500">Output:</h5>
                            <div className="bg-gray-50 p-2 rounded-md mt-1">
                              <pre className="text-xs whitespace-pre-wrap">{
                                typeof state.output === 'string'
                                  ? state.output
                                  : JSON.stringify(state.output, null, 2)
                              }</pre>
                            </div>
                          </div>
                        )}
                        
                        {(state.startTime || state.endTime) && (
                          <div className="mt-2 text-xs text-gray-500">
                            {state.startTime && (
                              <span>Started: {state.startTime.toISOString()}</span>
                            )}
                            {state.startTime && state.endTime && <span> • </span>}
                            {state.endTime && (
                              <span>Ended: {state.endTime.toISOString()}</span>
                            )}
                            {state.startTime && state.endTime && (
                              <span> • Duration: {((state.endTime.getTime() - state.startTime.getTime()) / 1000).toFixed(2)}s</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TestContent>
    </div>
  );
}