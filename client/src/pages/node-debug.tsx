/**
 * Node Debug Panel
 * 
 * A dedicated page for testing and validating nodes in the system.
 * This panel allows developers to commission, test, and validate nodes
 * without impacting the main workflow editor.
 * 
 * Features:
 * - Node Directory Testing: Select a node folder to run all tests on that node
 * - Detailed Test Results: View individual test results and feedback
 * - AI Agent Testing Support: Structured for programmatic use by AI agents
 * - Custom Node Tests: Support for node-specific custom tests
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle2, XCircle, AlertTriangle, RefreshCcw, FileSymlink, Search, 
  Play, Zap, LayoutGrid, Clock, Link, FolderOpen, Upload, Download, 
  FileCode, Bot, RotateCw, Save, ClipboardCheck, Cpu, Beaker
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainContent from '@/components/layout/MainContent';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NodeListTable from '@/components/node-list-table';
import { 
  getAllNodes, 
  initializeRegistry 
} from '@/lib/unifiedNodeRegistry';

// Import the node test interfaces
import { NodeTest, NodeTestResult } from '@/nodes/types/nodeTestsStandard';

// Helper types
interface NodeType {
  type: string;
  name: string;
  category: string;
  status?: 'validated' | 'partial' | 'failed' | 'pending';
  testResults?: TestResult[];
  customTestResults?: CustomTestResult[];
  customFolder?: string; // Path to custom folder for folder-based nodes
}

interface TestResult {
  name: string;
  test: TestType;
  status: 'passed' | 'failed' | 'pending' | 'running';
  message?: string;
  duration?: number; 
}

// Interface for custom test results
interface CustomTestResult {
  name: string;
  description: string;
  category?: string;
  status: 'passed' | 'failed' | 'pending' | 'running';
  message?: string;
  duration?: number;
  details?: Record<string, any>;
}

type TestType = 'definition' | 'interface' | 'execution' | 'error' | 'ui' | 'performance' | 'integration';

interface TestDefinition {
  id: TestType;
  name: string;
  description: string;
  icon: React.ElementType;
}

// Test definitions
const TESTS: TestDefinition[] = [
  {
    id: 'definition',
    name: 'Definition Validation',
    description: 'Verifies all required fields are present and correctly formatted',
    icon: FileSymlink
  },
  {
    id: 'interface',
    name: 'Input/Output Interface',
    description: 'Tests that declared I/O ports work as expected',
    icon: Link
  },
  {
    id: 'execution',
    name: 'Execution Testing',
    description: 'Verifies the node executor works with sample inputs',
    icon: Play
  },
  {
    id: 'error',
    name: 'Error Handling',
    description: 'Tests how the node behaves with invalid inputs or failure conditions',
    icon: AlertTriangle
  },
  {
    id: 'ui',
    name: 'UI Rendering',
    description: 'Validates the node\'s visual representation renders properly',
    icon: LayoutGrid
  },
  {
    id: 'performance',
    name: 'Performance Testing',
    description: 'Measures execution time and resource usage',
    icon: Clock
  },
  {
    id: 'integration',
    name: 'Integration Testing',
    description: 'Tests the node working with other connected nodes',
    icon: Zap
  }
];

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
  
  // New state for node folder testing
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
    if (statusFilter) {
      if (statusFilter === 'pending') {
        return matchesSearch && (node.status === 'pending' || !node.status);
      }
      return matchesSearch && node.status === statusFilter;
    }
    
    // No filter, return all matching nodes
    return matchesSearch;
  });

  // Select a node to view its details
  const handleViewNode = (node: NodeType) => {
    setSelectedNode(node);
  };

  // Function to try loading custom tests for a node
  const loadCustomTests = async (nodeType: string): Promise<NodeTest[] | null> => {
    try {
      // Map of known node types to their test file paths
      const nodeTestPaths: Record<string, string> = {
        'text_formatter': '@/nodes/System/text_formatter/tests',
        'http_request': '@/nodes/System/http_request/tests',
        'send_to_webhook': '@/nodes/System/send_to_webhook/tests'
      };
      
      // Check if we have a registered test path for this node
      if (nodeType in nodeTestPaths) {
        try {
          const testPath = nodeTestPaths[nodeType];
          const testsModule = await import(/* @vite-ignore */ testPath);
          console.log(`Loaded custom tests for ${nodeType}:`, testsModule.default);
          return testsModule.default;
        } catch (e) {
          console.warn(`Tests for ${nodeType} failed to load:`, e);
          return null;
        }
      }
      
      // No tests found for this node type
      return null;
    } catch (error) {
      console.error(`Error loading custom tests for ${nodeType}:`, error);
      return null;
    }
  };

  // Run tests for a node
  const handleRunTests = async (node: NodeType) => {
    setIsRunningTests(true);
    setTestProgress(0);
    
    // Create a copy of the node to manipulate during testing
    const updatedNode = { ...node };
    
    // Load any custom tests for this node
    const customTests = await loadCustomTests(node.type);
    const hasCustomTests = customTests && customTests.length > 0;
    
    // Reset test results
    updatedNode.testResults = [];
    updatedNode.customTestResults = [];
    
    // Set up standard tests
    TESTS.forEach(test => {
      updatedNode.testResults?.push({
        name: test.name,
        test: test.id,
        status: 'running'
      });
    });
    
    // Set up custom tests if available
    if (hasCustomTests) {
      customTests.forEach(test => {
        updatedNode.customTestResults?.push({
          name: test.name,
          description: test.description,
          category: test.category,
          status: 'running'
        });
      });
    }
    
    setSelectedNode(updatedNode);
    
    // Standard tests
    const testDelay = 600; // ms per test
    const standardTestsToRun = TESTS.length;
    
    // Simulate running each standard test with a delay
    TESTS.forEach((test, index) => {
      setTimeout(() => {
        // Update progress
        setTestProgress(Math.round(((index + 1) / standardTestsToRun) * 100));
        
        // Simulate a test result (random for demo)
        const result: TestResult = {
          name: test.name,
          test: test.id,
          status: Math.random() > 0.2 ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 300) + 50
        };
        
        if (result.status === 'failed') {
          result.message = `Test failed: ${test.name} validation error`;
        }
        
        // Update the node's test results
        if (updatedNode.testResults) {
          updatedNode.testResults[index] = result;
          
          // Determine overall status based on test results
          const hasFailures = updatedNode.testResults.some(r => r.status === 'failed');
          const hasPending = updatedNode.testResults.some(r => r.status === 'pending' || r.status === 'running');
          
          if (hasFailures) {
            updatedNode.status = 'failed';
          } else if (hasPending) {
            updatedNode.status = 'partial';
          } else {
            updatedNode.status = 'validated';
          }
          
          setSelectedNode({ ...updatedNode });
        }
        
        // When all standard tests are completed
        if (index === standardTestsToRun - 1) {
          // Now run custom tests if available
          if (hasCustomTests && customTests) {
            runCustomTests(updatedNode, customTests);
          } else {
            // No custom tests, we're done
            finishTesting(updatedNode);
          }
        }
      }, testDelay * (index + 1));
    });
  };
  
  // Run custom tests for a node
  const runCustomTests = async (node: NodeType, customTests: NodeTest[]) => {
    if (!node.customTestResults) return;
    
    // Run each custom test for real (not simulated)
    for (let i = 0; i < customTests.length; i++) {
      const customTest = customTests[i];
      
      try {
        // Actually run the test
        const testStartTime = performance.now();
        const result = await customTest.run();
        const testDuration = Math.round(performance.now() - testStartTime);
        
        // Convert to our internal format
        const customResult: CustomTestResult = {
          name: customTest.name,
          description: customTest.description,
          category: customTest.category,
          status: result.passed ? 'passed' : 'failed',
          message: result.message,
          duration: testDuration,
          details: result.details
        };
        
        // Update the node's custom test results
        node.customTestResults[i] = customResult;
        setSelectedNode({ ...node });
        
        // Short delay between tests for UI update
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        // Handle test execution error
        node.customTestResults[i] = {
          name: customTest.name,
          description: customTest.description,
          category: customTest.category,
          status: 'failed',
          message: `Test execution error: ${error instanceof Error ? error.message : String(error)}`
        };
        setSelectedNode({ ...node });
      }
    }
    
    // Custom tests are complete
    finishTesting(node);
  };
  
  // Helper to finish testing and update UI
  const finishTesting = (node: NodeType) => {
    setIsRunningTests(false);
    
    // Calculate overall status
    const standardFailures = node.testResults?.some(r => r.status === 'failed') || false;
    const customFailures = node.customTestResults?.some(r => r.status === 'failed') || false;
    const hasFailures = standardFailures || customFailures;
    
    if (hasFailures) {
      node.status = 'failed';
    } else {
      node.status = 'validated';
    }
    
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

  // Get test status icon
  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <RefreshCcw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending': 
      default: return <AlertTriangle className="h-5 w-5 text-slate-300" />;
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
      // Create initial results array
      const initialResults: TestResult[] = TESTS.map(test => ({
        name: test.name,
        test: test.id,
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
      const testsToRun = TESTS.length;
      
      // Run tests sequentially with timeouts
      let completed = 0;
      
      for (let i = 0; i < testsToRun; i++) {
        setTimeout(() => {
          // Update progress
          const progress = Math.round(((i + 1) / testsToRun) * 100);
          setFolderTestProgress(progress);
          
          // Generate a result (random for demo)
          const result: TestResult = {
            name: TESTS[i].name,
            test: TESTS[i].id,
            status: Math.random() > 0.2 ? 'passed' : 'failed',
            duration: Math.floor(Math.random() * 300) + 50
          };
          
          if (result.status === 'failed') {
            result.message = `Test failed in ${nodeFolderPath}: ${TESTS[i].name} validation error`;
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
            
            // Make sure our state is fully updated
            setTimeout(() => {
              setFolderTestResults(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  status: prev.results?.some(r => r.status === 'failed') ? 'failed' : 'completed'
                };
              });
            }, 100);
          }
        }, testDelay * (i + 1));
      }
    }, 100);
  };

  return (
    <MainContent>
      {/* Folder test result panel */}
      {folderTestRunning || folderTestResults ? (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2 text-blue-500" />
                  Node Folder Test
                </CardTitle>
                <CardDescription>
                  Testing node in folder: <span className="bg-slate-100 px-1 py-0.5 rounded font-mono text-sm">{nodeFolderPath}</span>
                </CardDescription>
              </div>
              
              {folderTestRunning ? (
                <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                  Testing in progress
                </Badge>
              ) : folderTestResults?.status === 'completed' ? (
                <Badge className="bg-green-100 text-green-800 border border-green-300">
                  Testing completed
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 border border-red-300">
                  Testing failed
                </Badge>
              )}
            </div>
            
            {folderTestRunning && (
              <div className="mt-4">
                <Label className="text-xs text-slate-500 mb-1 block">Test Progress</Label>
                <Progress value={folderTestProgress} />
                <div className="text-xs text-slate-500 mt-1">Running test suite for {nodeTypeFromFolder}: {folderTestProgress}% complete</div>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {folderTestResults?.results && folderTestResults.results.length > 0 ? (
              <div className="space-y-3">
                {TESTS.map((testDef, idx) => {
                  const testResult = folderTestResults.results?.[idx];
                  return (
                    <div key={testDef.id} className="border rounded-md overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                        <div className="flex items-center space-x-3">
                          <div className="bg-slate-200 p-1.5 rounded">
                            <testDef.icon className="h-4 w-4 text-slate-700" />
                          </div>
                          <div>
                            <h4 className="font-medium">{testDef.name}</h4>
                            <p className="text-xs text-slate-500">{testDef.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {testResult ? getTestStatusIcon(testResult.status) : getTestStatusIcon('pending')}
                          {testResult?.duration && testResult.duration > 0 && (
                            <span className="text-xs text-slate-500 ml-2">{testResult.duration}ms</span>
                          )}
                        </div>
                      </div>
                      
                      {testResult?.status === 'failed' && testResult.message && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm">
                          {testResult.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Test Results</AlertTitle>
                <AlertDescription>
                  {folderTestRunning ? 'Tests are currently running...' : 'No test results available'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setFolderTestResults(null);
                setFolderTestRunning(false);
              }}
            >
              Dismiss
            </Button>
          </CardFooter>
        </Card>
      ) : null}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Node listing */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Nodes</CardTitle>
            <CardDescription>Available nodes in the system</CardDescription>
            
            <div className="mt-4 flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search nodes..." 
                  className="pl-8" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge 
                    variant={statusFilter === null ? "default" : "outline"} 
                    className="cursor-pointer"
                    onClick={() => setStatusFilter(null)}
                  >
                    All ({nodeTypes.length})
                  </Badge>
                  <Badge 
                    variant={statusFilter === 'validated' ? "default" : "outline"} 
                    className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
                    onClick={() => setStatusFilter('validated')}
                  >
                    Validated ({getNodeStatusCount('validated')})
                  </Badge>
                  <Badge 
                    variant={statusFilter === 'partial' ? "default" : "outline"} 
                    className="cursor-pointer bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    onClick={() => setStatusFilter('partial')}
                  >
                    Partial ({getNodeStatusCount('partial')})
                  </Badge>
                  <Badge 
                    variant={statusFilter === 'failed' ? "default" : "outline"} 
                    className="cursor-pointer bg-red-100 text-red-800 hover:bg-red-200"
                    onClick={() => setStatusFilter('failed')}
                  >
                    Failed ({getNodeStatusCount('failed')})
                  </Badge>
                  <Badge 
                    variant={statusFilter === 'pending' ? "default" : "outline"} 
                    className="cursor-pointer"
                    onClick={() => setStatusFilter('pending')}
                  >
                    Pending ({getNodeStatusCount('pending')})
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh]">
              <NodeListTable 
                nodes={filteredNodes}
                selectedNode={selectedNode}
                onNodeSelect={handleViewNode}
                emptyMessage={
                  statusFilter 
                    ? `No ${statusFilter} nodes found matching your criteria` 
                    : "No nodes found matching your criteria"
                }
              />
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button 
              variant="default" 
              onClick={handleOpenFolderDialog}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Test Node Folder
            </Button>
          </CardFooter>
          
          {/* Folder testing dialog */}
          <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Test Node Folder</DialogTitle>
                <DialogDescription>
                  Enter the path to the node folder you want to test.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="folder-path" className="text-right col-span-1">
                    Folder Path
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="folder-path"
                      placeholder="nodes/System/my_node_name"
                      value={nodeFolderPath}
                      onChange={handleFolderPathChange}
                      className="col-span-3"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: nodes/System/webhook_trigger or nodes/Custom/my_new_node
                    </p>
                  </div>
                </div>
                
                {nodeTypeFromFolder && (
                  <div className="flex items-center px-4">
                    <div className="text-sm">
                      Detected node type: <Badge variant="outline">{nodeTypeFromFolder}</Badge>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Load the node into the test suite instead of directly testing
                  if (!nodeFolderPath) {
                    toast({
                      title: "Path required",
                      description: "Please enter a valid node folder path",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Create a new node based on folder path
                  const newNode: NodeType = {
                    type: nodeTypeFromFolder,
                    name: nodeTypeFromFolder.split('_').map(
                      s => s.charAt(0).toUpperCase() + s.slice(1)
                    ).join(' '),
                    category: 'custom',
                    status: 'pending',
                    // Add a customFolder property to track this is a custom folder node
                    customFolder: nodeFolderPath
                  };
                  
                  // Select the new node for testing
                  setSelectedNode(newNode);
                  setFolderDialogOpen(false);
                  
                  toast({
                    title: "Node loaded",
                    description: `${nodeTypeFromFolder} loaded into testing suite. You can now run tests on it.`,
                  });
                }}>
                  Load Node into Testing Suite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
        
        {/* Right panel - Test details and execution */}
        <Card className="lg:col-span-2">
          {selectedNode ? (
            <>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedNode.name}</CardTitle>
                    <CardDescription>Type: {selectedNode.type}</CardDescription>
                  </div>
                  
                  <Button 
                    onClick={() => handleRunTests(selectedNode)}
                    disabled={isRunningTests}
                  >
                    {isRunningTests ? (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Tests
                      </>
                    )}
                  </Button>
                </div>
                
                {isRunningTests && (
                  <div className="mt-4">
                    <Label className="text-xs text-slate-500 mb-1 block">Test Progress</Label>
                    <Progress value={testProgress} />
                    <div className="text-xs text-slate-500 mt-1">Running test suite: {testProgress}% complete</div>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Node Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-500">Type:</span> {selectedNode.type}
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-500">Category:</span> {selectedNode.category}
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-500">Status:</span> 
                      <Badge 
                        className={`ml-2 ${getStatusColor(selectedNode.status)} border`}
                      >
                        {selectedNode.status || 'pending'}
                      </Badge>
                    </div>
                    <div className="bg-slate-50 p-2 rounded col-span-2">
                      <span className="text-slate-500">Tests Available:</span> 
                      <span className="ml-2">{TESTS.length} standard tests</span>
                      {selectedNode.customTestResults && selectedNode.customTestResults.length > 0 && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800 border border-blue-300">
                          +{selectedNode.customTestResults.length} custom tests
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <Tabs defaultValue="standard">
                  <TabsList className="mb-2">
                    <TabsTrigger value="standard">Standard Tests</TabsTrigger>
                    <TabsTrigger value="custom" disabled={!selectedNode.customTestResults || selectedNode.customTestResults.length === 0}>
                      Custom Tests {selectedNode.customTestResults && selectedNode.customTestResults.length > 0 ? 
                        `(${selectedNode.customTestResults.length})` : ''}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="standard">
                    <h3 className="text-sm font-medium mb-2">Standard Test Results</h3>
                    
                    {selectedNode.testResults && selectedNode.testResults.length > 0 ? (
                      <div className="space-y-3">
                        {TESTS.map((testDef) => {
                          const testResult = selectedNode.testResults?.find(r => r.test === testDef.id);
                          return (
                            <div key={testDef.id} className="border rounded-md overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-slate-200 p-1.5 rounded">
                                    <testDef.icon className="h-4 w-4 text-slate-700" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{testDef.name}</h4>
                                    <p className="text-xs text-slate-500">{testDef.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  {testResult ? getTestStatusIcon(testResult.status) : getTestStatusIcon('pending')}
                                  {testResult?.duration ? (
                                    <span className="text-xs text-slate-500 ml-2">
                                      {testResult.duration > 0 ? `${testResult.duration}ms` : null}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              
                              {testResult?.status === 'failed' && testResult.message && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm">
                                  {testResult.message}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Tests Run</AlertTitle>
                        <AlertDescription>
                          This node hasn't been tested yet. Click "Run Tests" to start the test suite.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="custom">
                    <div className="flex items-center mb-3">
                      <h3 className="text-sm font-medium">Custom Node Tests</h3>
                      <Badge className="ml-2 bg-blue-100 text-blue-800 border border-blue-300">
                        Node-Specific
                      </Badge>
                    </div>
                    
                    {selectedNode.customTestResults && selectedNode.customTestResults.length > 0 ? (
                      <div className="space-y-3">
                        {selectedNode.customTestResults.map((testResult, index) => (
                          <div key={`custom-${index}`} className="border rounded-md overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 p-1.5 rounded">
                                  <Beaker className="h-4 w-4 text-blue-700" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{testResult.name}</h4>
                                  <p className="text-xs text-slate-500">{testResult.description}</p>
                                  {testResult.category && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {testResult.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {getTestStatusIcon(testResult.status)}
                                {testResult.duration ? (
                                  <span className="text-xs text-slate-500 ml-2">
                                    {testResult.duration > 0 ? `${testResult.duration}ms` : null}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            
                            {testResult.status === 'failed' && testResult.message && (
                              <div className="p-3 bg-red-50 text-red-700 text-sm">
                                {testResult.message}
                              </div>
                            )}
                            
                            {testResult.details && Object.keys(testResult.details).length > 0 && (
                              <div className="p-3 border-t bg-slate-50">
                                <details className="text-xs">
                                  <summary className="cursor-pointer font-medium text-slate-700">
                                    Test Details
                                  </summary>
                                  <div className="mt-2 p-2 bg-slate-100 rounded font-mono overflow-x-auto">
                                    <pre>{JSON.stringify(testResult.details, null, 2)}</pre>
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Custom Tests Available</AlertTitle>
                        <AlertDescription>
                          This node doesn't have any custom tests defined.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-20 px-6 text-center text-slate-500">
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">No Node Selected</h3>
                <p>Select a node from the list to view details and run tests</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainContent>
  );
};

export default NodeDebugPanel;