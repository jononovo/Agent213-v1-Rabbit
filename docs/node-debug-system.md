# Node Debug System

The Node Debug System provides a comprehensive test and debug environment for workflow nodes in the platform. This document explains the testing capabilities and architecture of the node debug system, as well as the workflow execution engine.

## Table of Contents

- [Overview](#overview)
- [Node Testing Framework](#node-testing-framework)
  - [Standard Tests](#standard-tests)
  - [Integration Tests](#integration-tests)
  - [Custom Tests](#custom-tests)
- [Execution Architecture](#execution-architecture)
  - [Workflow Execution Server](#workflow-execution-server)
  - [Integration Engine](#integration-engine)
- [Test Implementation Details](#test-implementation-details)

## Overview

The node debug system allows developers to verify and validate that nodes conform to the platform's requirements and specifications. It provides a testing interface with real-time test execution and results visualization.

Nodes are organized in a folder structure based on their type:
- `System` - Core system nodes
- `Integration` - External service integration nodes

While nodes are physically organized in these folders, their UI category (code, trigger, ai, etc.) is a separate concept for grouping similar functionality in the interface.

## Node Testing Framework

The testing framework is divided into three categories:

### Standard Tests

Standard tests are run on all nodes to ensure they adhere to basic requirements:

1. **File Structure Test**: Verifies that the node has the required `definition.ts` and `executor.ts` files.
2. **Export Validation Test**: Confirms the node properly exports required components.
3. **Metadata Completeness Test**: Validates that the node definition includes all required metadata fields.
4. **Port Definition Test**: Ensures both inputs and outputs are properly defined.
5. **Executor Signature Test**: Verifies the executor function has the correct parameter signature.
6. **Output Format Test**: Confirms the executor returns data in the expected format.
7. **Error Handling Test**: Tests that the node properly formats error responses.

### Integration Tests

Integration tests verify that nodes implementing external service integrations provide the necessary capabilities:

1. **Integration Capabilities Test**: Verifies that integration nodes declare their capabilities (provides/requires).
2. **Integration Requirements Test**: Confirms that integration nodes specify any external requirements.

Integration tests are shown for all nodes regardless of their category to ensure consistent testing across the platform.

### Custom Tests

Nodes can implement custom tests specific to their functionality. These tests are loaded from a `tests.ts` file in the node's folder and allow for testing unique behaviors or requirements.

Custom tests can access the node's definition and executor, and run specific scenarios to validate node behavior.

## Execution Architecture

The platform implements a robust execution architecture designed to isolate workflow processing from the main application, preventing crashes or performance issues from affecting the overall system.

### Workflow Execution Server

The Workflow Execution Server is a dedicated server that runs on port 3002 and handles the execution of workflows independently from the main application. This architecture provides:

1. **Isolation**: Workflow execution errors won't crash the main application.
2. **Resource Management**: Heavy workflows don't impact the performance of the main UI/API.
3. **Scalability**: The execution server can be scaled independently of the main application.

The execution server uses a simple queue system to manage workflow execution requests:

```typescript
// Simplified queue implementation
class SimpleQueue {
  private queue: Record<string, WorkflowJob> = {};
  
  // Add a job to the queue
  enqueue(job: WorkflowJob): string {
    // Implementation details
  }
  
  // Get a job from the queue
  getJob(jobId: string): WorkflowJob | undefined {
    // Implementation details
  }
  
  // Mark job as complete
  completeJob(jobId: string, result: any): void {
    // Implementation details
  }
}
```

### Integration Engine

The Integration Engine runs on port 3001 and manages all external service integrations. It provides:

1. **API Proxying**: Routes API requests through a single endpoint for security and monitoring.
2. **Authentication Management**: Handles authentication to external services.
3. **Endpoint Registration**: Manages webhook endpoints and callbacks.

The Integration Engine exposes a standardized interface for all integration nodes:

```typescript
interface IntegrationCapabilities {
  provides: {
    endpoint?: boolean;
    webhook?: boolean;
    connector?: boolean;
    scheduler?: boolean;
    ai?: boolean;
  };
  requires: {
    storage?: boolean;
    authentication?: boolean;
    proxy?: boolean;
  };
  // Additional configuration specific to the integration type
}
```

## Test Implementation Details

The node debug system uses a comprehensive set of helper functions to facilitate testing. The test runner loads and executes tests in real-time in the browser, displaying results immediately.

Key implementation details:

1. **File Resolution**: Tests check both `System` and `Integration` folders to locate node files:

```typescript
async function tryImportFromBothFolders(nodeType: string, filename: string) {
  try {
    // Try System folder first
    return await import(`../../../nodes/System/${nodeType}/${filename}`);
  } catch (e) {
    // Try Integration folder next
    return await import(`../../../nodes/Integration/${nodeType}/${filename}`);
  }
}
```

2. **Test Results Format**: Tests return a standardized result format:

```typescript
interface NodeTestResult {
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}
```

3. **Test Status**: Tests can have the following statuses:
   - `pending`: Test has not yet run
   - `running`: Test is currently executing
   - `passed`: Test completed successfully
   - `failed`: Test failed

4. **Real Execution**: Tests execute nodes with real inputs and verify their outputs, avoiding mock implementations to ensure authentic behavior.

The node debug system provides a robust framework for ensuring node quality and adherence to platform standards, helping developers create consistent, reliable workflow nodes.