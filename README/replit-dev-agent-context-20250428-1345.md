# Replit Dev Agent Context - AI Agent Workflow Platform

## System Architecture

### Core Components

- **React-Flow**: Powers interactive node-based workflow visualization
- **TypeScript**: Ensures type-safe development throughout the codebase
- **Express Backend**: API server for workflow persistence and execution
- **Shadcn UI**: Modern component library for UI elements

### Node System
 
The platform uses an automatic node discovery system:

- **Node Registry**: Central index of all available node types (single source of truth)
- **Automatic Discovery**: Vite's glob imports scan the filesystem at build time
- **Folder-Based Structure**:
  - `nodes/System/` - Core system nodes
  - `nodes/Custom/` - User-defined nodes
- **Standardized Node Implementation**: Each node consists of:
  - `definition.ts` - Metadata and type definitions
  - `ui.tsx` - React component for visual rendering
  - `executor.ts` - Runtime logic implementation
  - `tests.ts` - Optional custom test definitions

### Node Testing Framework

A comprehensive testing framework has been implemented for nodes:

- **Test Discovery System**: Automatically finds and loads tests for each node
- **Standard + Custom Tests**: Runs both platform-defined and node-specific tests
- **Modular Architecture**:
  - `client/src/pages/node-debug/` - Main testing interface
  - `client/src/lib/nodeTestLoader.ts` - Dynamic test discovery utility
  - `client/src/pages/node-debug/utils/testRunner.ts` - Test execution engine
- **Test Results Visualization**: UI components for displaying test outcomes

### Key Files

- `client/src/lib/nodeRegistry.ts`: Central node type registry
- `client/src/components/flow/FlowEditor.tsx`: Main workflow editor component
- `client/src/components/flow/NodesPanel.tsx`: Node selection sidebar using registry
- `client/src/components/nodes/common/NodeHoverMenu.tsx`: Node action menu component
- `client/src/lib/nodeValidator.ts`: Node validation utility using registry
- `client/src/lib/nodeTestLoader.ts`: Dynamic node test discovery utility
- `client/src/pages/node-debug/index.tsx`: Node testing dashboard
- `client/src/pages/node-debug/utils/testRunner.ts`: Test execution utilities
- `server/services/workflowGenerationService.ts`: AI-assisted workflow generation
- `server/routes.ts`: API endpoints for workflow management and execution
- `server/importTestWorkflow.ts`: Utility for importing test workflows

## Common Patterns and Usage

### Node Testing

1. **Creating Custom Node Tests**:
   - Add a `tests.ts` file to the node's folder
   - Export an array of test objects following the `NodeTest` interface:
   ```typescript
   const tests: NodeTest[] = [
     {
       name: 'Test Name',
       description: 'What this test verifies',
       category: 'validation',
       run: async () => {
         try {
           // Test implementation
           return { passed: true, message: 'Success message' };
         } catch (error) {
           return { passed: false, message: `Error: ${error.message}` };
         }
       }
     }
   ];
   export default tests;
   ```

2. **Running Tests**:
   - Navigate to the Node Debug Panel
   - Select a node type from the dropdown
   - Click "Run Tests" to execute both standard and custom tests
   - Review results in the TestResultsPanel

### Node Development

1. **Creating New Nodes**:
   - Create a folder in the appropriate category directory
   - Implement required files (definition.ts, executor.ts, ui.tsx)
   - Optionally add tests.ts for custom test cases
   - No manual registration needed - nodes are auto-discovered

2. **Single Source of Truth**:
   - All node operations must use the central registry (`nodeRegistry.ts`)
   - Never hardcode node types or maintain secondary lists
   - All node discovery happens through the registry APIs:
     - `getAllNodeTypes()` - Get all available node types
     - `getNodeUIPath()` - Get path to node UI component
     - `getNodeExecutorPath()` - Get path to node executor
     - `hasNodeType()` - Check if node type exists
     - `getNodeInfo()` - Get metadata for a node type

## Recent Improvements

1. **Node Testing Framework**: Comprehensive system for validating node functionality
2. **Dynamic Test Discovery**: Automatic loading of node-specific tests without hardcoding
3. **Modular Debug Panel Architecture**: Restructured node-debug page into a maintainable, modular system
4. **Test Results Visualization**: Enhanced UI for test outcome display
5. **Single Source of Truth for Node Registry**: Reinforced nodeRegistry as the only authoritative source for node information

## Troubleshooting Common Issues

1. **Node not appearing in registry**:
   - Verify folder structure follows the convention
   - Check that definition.ts exports required metadata
   - Look for TypeScript errors in node implementation

2. **Tests not showing up for node**:
   - Ensure tests.ts exists in the node's folder
   - Verify the test file exports default array of test objects
   - Check console for any import errors

3. **Node Debug Page errors**:
   - Look for errors in component props or test execution
   - Verify nodeTestLoader.ts can properly discover tests
   - Check that test format follows required interface

## Update History

### 2025-04-28 13:45
- Added comprehensive Node Testing Framework documentation
- Updated key files to include test-related components
- Added Single Source of Truth concept for node registry
- Documented the new modular node-debug page architecture
- Added guidance for creating and running custom node tests
- Fixed server error with missing importTestWorkflow.ts

### 2025-04-24 10:51
- Replaced manual node type registration with automatic discovery system
- Fixed event handling in NodeHoverMenu components
- Implemented performance optimizations for React Flow rendering
- Added comprehensive node category management
- Standardized node folder structure for easier extensibility

### Previous versions
- Initial implementation of node-based workflow editor
- Basic API integration for AI model access
- Fundamental node types for workflow construction