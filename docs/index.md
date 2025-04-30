# Lead Gen Rabbit Documentation

Welcome to the Lead Gen Rabbit documentation. This guide provides comprehensive information about the platform's architecture, components, and development guides.

## Core Documentation

- [Node Debug System](node-debug-system.md): Documentation on the testing framework for nodes
- [Workflow Execution Engine](workflow-execution-engine.md): Guide to the isolated workflow execution architecture
- [Integration Engine](integration-engine.md): Overview of the external service integration system

## Architecture Overview

Lead Gen Rabbit is built around a modular node-based workflow architecture with the following key components:

1. **Main Application Server** (Port 5000)
   - Serves the frontend application
   - Handles user authentication and permissions
   - Manages workflow and node configuration
   - Stores execution logs and results
   - Proxies requests to specialized servers

2. **Workflow Execution Server** (Port 3002)
   - Executes workflows in isolation
   - Prevents workflow errors from affecting the main application
   - Provides job queuing and status tracking
   - Returns execution results to the main server

3. **Integration Engine Server** (Port 3001)
   - Manages connections to external services
   - Handles API authentication and proxying
   - Registers and manages webhook endpoints
   - Standardizes integration patterns

## Development Guides

### Node Development

Nodes are the fundamental building blocks of the platform. Each node consists of:

- `definition.ts`: Declares node metadata, inputs, and outputs
- `executor.ts`: Contains the execution logic
- `ui.tsx` (optional): Provides custom UI components
- `capabilities.ts` (for integration nodes): Declares integration capabilities
- `tests.ts` (optional): Provides custom tests

### Testing Framework

The platform includes a comprehensive testing framework for nodes with three types of tests:

1. **Standard Tests**: Basic tests that all nodes must pass
2. **Integration Tests**: Tests specific to integration nodes
3. **Custom Tests**: Node-specific test implementations

### Workflow Development

Workflows connect nodes together to create processing pipelines:

- Workflows are stored as JSON with nodes and connections
- Each workflow can be triggered manually or by webhook events
- Workflows are executed in isolation to prevent system crashes

## API Reference

- `/api/workflow-execution/`: Endpoints for workflow execution
- `/api/integration/`: Endpoints for integration management
- `/api/node-debug/`: Endpoints for node testing and debugging

## Contributing

Contributions to the platform should follow these guidelines:

1. Follow the node structure pattern
2. Write comprehensive tests for all node types
3. Document all interfaces and capabilities
4. Use the node debug system to validate functionality