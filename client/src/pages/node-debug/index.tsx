/**
 * Node Debug Panel - Main Index
 * 
 * Main container component that manages the Node Debug Panel
 * Uses extracted components and utilities for better organization and maintainability
 */
import React, { useState, useEffect } from 'react';
import { 
  Search, FolderOpen, RotateCw, Beaker
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import MainContent from '@/components/layout/MainContent';
import { useToast } from '@/hooks/use-toast';
import NodeListTable from '@/components/node-list-table';

// Import test components and utilities
import TestResultsPanel from './components/TestResultsPanel';
import { 
  NodeType, TestResult, CustomTestResult, TestType,
  loadCustomTests, runCustomTests, runStandardTests,
  calculateTestStatus, initNodeForTesting
} from './utils/testRunner';
import { standardNodeTests, integrationNodeTests } from './utils/standardTests';

import { getAllNodes, initializeRegistry } from '@/nodes/core/registry/unifiedNodeRegistry';

// Status type for folder tests
type NodeTestStatus = 'queued' | 'running' | 'completed' | 'failed';

// Interface for a node folder test request
interface NodeFolderTest {
  path: string;
  nodeType: string;
  status: NodeTestStatus;
  startTime?: Date;
  endTime?: Date;
  results?: TestResult[];
  iterationCount?: number; // For AI agent improvement iterations
}

const NodeDebugPanel: React.FC = () => {
  const { toast } = useToast();
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  
  // State for node folder testing
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [nodeFolderPath, setNodeFolderPath] = useState('');
  const [nodeTypeFromFolder, setNodeTypeFromFolder] = useState('');
  const [folderTestRunning, setFolderTestRunning] = useState(false);
  const [folderTestProgress, setFolderTestProgress] = useState(0);
  const [folderTestResults, setFolderTestResults] = useState<NodeFolderTest | null>(null);

  // Directly use the registry data without API call
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize the registry and load nodes
  useEffect(() => {
    const loadRegistryNodes = async () => {
      try {
        console.log("Initializing unified node registry");
        // Initialize the registry first
        await initializeRegistry();
        
        console.log("Loading nodes from registry");
        // Get nodes from registry - using the correct function from unifiedNodeRegistry
        const registryNodes = getAllNodes();
        
        console.log("Node registry returned:", registryNodes.length, "nodes");
        
        // Create NodeType objects from registry info
        const nodes: NodeType[] = registryNodes.map((node: any) => ({
          type: node.type,
          name: node.name || node.type.split('_').map(
            (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
          ).join(' '),
          category: node.category || 'unknown',
          status: 'pending', // Default status
          customFolder: node.folderPath === 'Custom' ? `nodes/Custom/${node.type}` : undefined
        }));
        
        console.log("Transformed nodes:", nodes.length);
        setNodeTypes(nodes);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading nodes from registry:", error);
        setIsLoading(false);
      }
    };
    
    loadRegistryNodes();
  }, []);
  
  // Function to refresh the node list manually
  const refetch = async () => {
    setIsLoading(true);
    try {
      // Make sure registry is initialized
      await initializeRegistry();
      
      // Get nodes from registry
      const registryNodes = getAllNodes();
      
      // Transform to our node type format
      const nodes: NodeType[] = registryNodes.map((node: any) => ({
        type: node.type,
        name: node.name || node.type.split('_').map(
          (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
        ).join(' '),
        category: node.category || 'unknown',
        status: 'pending',
        customFolder: node.folderPath === 'Custom' ? `nodes/Custom/${node.type}` : undefined
      }));
      
      setNodeTypes(nodes);
    } catch (error) {
      console.error("Error refreshing nodes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter nodes based on search query and status filter
  const filteredNodes = nodeTypes.filter((node: NodeType) => {
    const matchesSearch = 
      searchQuery === '' || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter if one is selected
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        return matchesSearch && (node.status === 'pending' || !node.status);
      }
      return matchesSearch && node.status === statusFilter;
    }
    
    // No filter or "all" selected, return all matching nodes
    return matchesSearch;
  });

  // Handle selecting a node to view details
  const handleViewNode = (node: NodeType) => {
    setSelectedNode(node);
  };
  
  // Run tests for a node
  const handleRunTests = async (node: NodeType) => {
    setIsRunningTests(true);
    setTestProgress(0);
    
    // Load any custom tests for this node
    const customTests = await loadCustomTests(node.type);
    const hasCustomTests = customTests && customTests.length > 0;
    
    // Initialize the node for testing
    const updatedNode = initNodeForTesting(node, customTests);
    setSelectedNode(updatedNode);
    
    // Set up progress update function
    const updateProgressFn = (progress: number) => {
      setTestProgress(progress);
    };
    
    // Update node function
    const updateNodeFn = (updated: NodeType) => {
      setSelectedNode({...updated});
    };
    
    try {
      console.log(`Running standard tests for node ${node.type}`);
      
      // Start the test progress at 10%
      updateProgressFn(10);
      
      // Run standard tests first
      await runStandardTests(
        updatedNode,
        (node) => {
          // Standard tests complete, 75% progress
          updateProgressFn(75);
        },
        updateNodeFn
      );
      
      // Standard tests are complete, set progress to 75%
      updateProgressFn(75);
      
      // Now run custom tests if available
      if (hasCustomTests && customTests) {
        console.log(`Running custom tests for node ${node.type}`);
        
        await runCustomTests(
          updatedNode, 
          customTests, 
          finishTesting,
          updateNodeFn
        );
      } else {
        // No custom tests, we're done
        finishTesting(updatedNode);
      }
      
    } catch (error: any) {
      console.error("Error running node tests:", error);
      
      // Update the status to failed
      updatedNode.status = 'failed';
      setSelectedNode({ ...updatedNode });
      
      // Set progress to 100% even on error
      setTestProgress(100);
      finishTesting(updatedNode);
      
      // Show error toast
      toast({
        title: "Testing failed",
        description: `Error testing ${node.name}: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };
  
  // Helper to finish testing and update UI
  const finishTesting = (node: NodeType) => {
    setIsRunningTests(false);
    
    // Calculate overall status
    node.status = calculateTestStatus(node);
    
    // Update the selected node
    setSelectedNode({ ...node });
    
    // Also update the node in the main nodes list
    setNodeTypes(prev => {
      return prev.map(n => {
        if (n.type === node.type) {
          return { 
            ...n, 
            status: node.status,
            testResults: node.testResults,
            customTestResults: node.customTestResults
          };
        }
        return n;
      });
    });
    
    toast({
      title: "Testing completed",
      description: `${node.name} test suite has finished`,
    });
  };
  
  // Get status badge color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800 border-green-300';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      case 'pending': 
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };
  
  // Count nodes by status
  const getNodeStatusCount = (status: string) => {
    return nodeTypes.filter((node: NodeType) => node.status === status).length;
  };
  
  // Handle opening folder selection dialog
  const handleOpenFolderDialog = () => {
    setFolderDialogOpen(true);
  };
  
  // Handle folder path input change
  const handleFolderPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodeFolderPath(e.target.value);
    
    // Try to extract node type from path
    const pathParts = e.target.value.split('/');
    if (pathParts.length > 0) {
      // Get the last part of the path
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart !== '') {
        setNodeTypeFromFolder(lastPart);
      }
    }
  };
  
  // Handle starting folder test
  const handleStartFolderTest = () => {
    if (!nodeFolderPath) {
      toast({
        title: "Path required",
        description: "Please enter a valid node folder path",
        variant: "destructive"
      });
      return;
    }
    
    setFolderDialogOpen(false);
    setFolderTestRunning(true);
    setFolderTestProgress(0);
    
    // Clean previous results first
    setFolderTestResults(null);
    
    // Create a delay before initializing tests to ensure state update
    setTimeout(() => {
      // Use our standard tests array
      const testsToUse = standardNodeTests.concat(integrationNodeTests);
      
      // Create initial results array
      const initialResults: TestResult[] = testsToUse.map(test => ({
        name: test.name,
        test: test.category as TestType,
        status: 'running'
      }));
      
      // Create a new test result object
      const testData: NodeFolderTest = {
        path: nodeFolderPath,
        nodeType: nodeTypeFromFolder,
        status: 'running',
        startTime: new Date(),
        results: initialResults,
        iterationCount: 1
      };
      
      console.log("Setting folder test results:", testData);
      
      // Set initial state
      setFolderTestResults(testData);
      
      // Run the test suite with artificial delays
      const testDelay = 800; // ms per test
      const testsToRun = testsToUse.length;
      
      // Run tests sequentially with timeouts
      let completed = 0;
      
      for (let i = 0; i < testsToRun; i++) {
        setTimeout(() => {
          // Update progress
          const progress = Math.round(((i + 1) / testsToRun) * 100);
          setFolderTestProgress(progress);
          
          // Generate a result (random for demo)
          const result: TestResult = {
            name: testsToUse[i].name,
            test: testsToUse[i].category as TestType,
            status: Math.random() > 0.2 ? 'passed' : 'failed',
            duration: Math.floor(Math.random() * 300) + 50
          };
          
          if (result.status === 'failed') {
            result.message = `Test failed in ${nodeFolderPath}: ${testsToUse[i].name} validation error`;
          }
          
          // Update state in function form to ensure we have the latest state
          setFolderTestResults(prev => {
            if (!prev) return null;
            
            // Clone the results array and update the test result
            const updatedResults = [...prev.results || []];
            updatedResults[i] = result;
            
            // Determine overall status
            const hasFailures = updatedResults.some(r => r.status === 'failed');
            const hasPending = updatedResults.some(r => r.status === 'pending' || r.status === 'running');
            
            // Set status based on test results
            let newStatus: NodeTestStatus;
            if (hasFailures) {
              newStatus = 'failed';
            } else if (hasPending) {
              newStatus = 'running';
            } else if (completed === testsToRun - 1) {
              newStatus = 'completed';
            } else {
              newStatus = prev.status;
            }
            
            // Count completed tests
            completed++;
            
            // Return the updated state
            return {
              ...prev,
              results: updatedResults,
              status: newStatus,
              endTime: completed === testsToRun ? new Date() : prev.endTime
            };
          });
          
          // If this is the last test
          if (i === testsToRun - 1) {
            setFolderTestRunning(false);
            toast({
              title: "Folder testing completed",
              description: `Test suite for ${nodeTypeFromFolder} has finished`,
            });
          }
        }, testDelay * (i + 1));
      }
    }, 500);
  };
  
  return (
    <MainContent>
      {/* Folder test result panel */}
      {folderTestRunning || folderTestResults ? (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Folder Test: {nodeTypeFromFolder}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={folderTestResults?.status === 'failed' ? 'destructive' : 'default'}
                  className="capitalize"
                >
                  {folderTestResults?.status || 'Running'}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Testing folder: {nodeFolderPath}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {folderTestRunning && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Running tests...</span>
                  <span className="text-sm font-medium">{folderTestProgress}%</span>
                </div>
                <Progress value={folderTestProgress} className="h-2" />
              </div>
            )}
            
            {folderTestResults?.results && (
              <div className="space-y-3 mt-3">
                {folderTestResults.results.map((result, index) => (
                  <div 
                    key={`folder-test-${index}`} 
                    className={`p-3 rounded border ${
                      result.status === 'passed' ? 'border-green-200 bg-green-50' :
                      result.status === 'failed' ? 'border-red-200 bg-red-50' :
                      'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{result.name}</div>
                      <Badge 
                        variant={
                          result.status === 'passed' ? 'default' :
                          result.status === 'failed' ? 'destructive' :
                          'outline'
                        }
                        className="capitalize"
                      >
                        {result.status}
                      </Badge>
                    </div>
                    {result.message && (
                      <div className="text-sm mt-2">{result.message}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setFolderTestRunning(false);
                setFolderTestResults(null);
              }}
            >
              Close Results
            </Button>
          </CardFooter>
        </Card>
      ) : null}
      
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search nodes..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={statusFilter || ''}
            onValueChange={(value) => setStatusFilter(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={isLoading}
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpenFolderDialog}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Test Folder
          </Button>
        </div>
      </div>
      
      {/* Status Summary */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-sm">
          All: {nodeTypes.length}
        </div>
        <div className="bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-sm">
          Pending: {getNodeStatusCount('pending')}
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm">
          Validated: {getNodeStatusCount('validated')}
        </div>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm">
          Partial: {getNodeStatusCount('partial')}
        </div>
        <div className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm">
          Failed: {getNodeStatusCount('failed')}
        </div>
      </div>
      
      {/* Node Grid & Selected Node Details */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <div className="mb-4">
            {isLoading ? (
              <div className="p-8 text-center">
                <RotateCw className="h-8 w-8 mx-auto text-blue-500 animate-spin mb-2" />
                <p className="text-slate-500">Loading nodes...</p>
              </div>
            ) : (
              <NodeListTable 
                nodes={filteredNodes}
                selectedNode={selectedNode}
                onNodeSelect={handleViewNode}
                emptyMessage="No nodes match your search"
              />
            )}
          </div>
          
          {selectedNode && (
            <div className="flex flex-wrap gap-2 px-4 pb-4">
              <Button
                onClick={() => handleRunTests(selectedNode)}
                disabled={isRunningTests}
                className="w-full"
              >
                {isRunningTests ? (
                  <>
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Beaker className="mr-2 h-4 w-4" />
                    Run Tests
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="xl:col-span-3">
          {selectedNode ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedNode.name}</CardTitle>
                    <Badge 
                      className={`capitalize ${getStatusColor(selectedNode.status)}`}
                    >
                      {selectedNode.status || 'Pending'}
                    </Badge>
                  </div>
                  <CardDescription>
                    Node Type: <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{selectedNode.type}</code>
                    <span className="mx-2">•</span>
                    Category: {selectedNode.category}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleRunTests(selectedNode)}
                      disabled={isRunningTests}
                    >
                      {isRunningTests ? (
                        <>
                          <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                          Running Tests...
                        </>
                      ) : (
                        <>
                          <Beaker className="mr-2 h-4 w-4" />
                          Run Tests
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Test Results Panel */}
              <TestResultsPanel
                selectedNode={selectedNode}
                isRunningTests={isRunningTests}
                testProgress={testProgress}
              />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Node Testing</CardTitle>
                <CardDescription>
                  Select a node from the list to view details and run tests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  The Node Debug Panel allows you to validate node functionality 
                  through comprehensive testing. You can run standard tests that 
                  check basic node functionality, as well as custom tests that 
                  validate specific node behavior.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Folder Test Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Node Folder</DialogTitle>
            <DialogDescription>
              Enter the path to a node folder to run all tests for that node.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Folder Path:
              </Label>
              <Input
                id="path"
                placeholder="nodes/System/http_request"
                className="col-span-3"
                value={nodeFolderPath}
                onChange={handleFolderPathChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nodeType" className="text-right">
                Node Type:
              </Label>
              <Input
                id="nodeType"
                placeholder="Auto-detected"
                className="col-span-3"
                value={nodeTypeFromFolder}
                disabled
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartFolderTest}
              disabled={!nodeFolderPath || !nodeTypeFromFolder}
            >
              Start Tests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainContent>
  );
};

export default NodeDebugPanel;