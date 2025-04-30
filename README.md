# Lead Gen Rabbit - Advanced Workflow Platform

An advanced AI-powered workflow platform that enables dynamic webhook and API integrations with flexible, type-safe execution capabilities, featuring a comprehensive node testing and debugging ecosystem.

## Core Architecture

The platform is built around a modular node-based workflow architecture with a three-server design:

1. **Main Application Server** (Port 5000)
   - Serves the frontend application and handles core functionality
   - Manages workflow and node configuration

2. **Workflow Execution Server** (Port 3002)
   - Executes workflows in isolation
   - Prevents workflow errors from affecting the main application

3. **Integration Engine Server** (Port 3001)
   - Manages connections to external services
   - Directly receives and processes webhook requests
   - Provides persistent storage for webhook responses

## Key Features

- **Direct Webhook Architecture**: Integration Engine receives webhook requests directly
- **Self-Contained Webhook Nodes**: Handle their own URL generation and registration
- **Comprehensive Node Testing**: Debug and validate nodes with powerful testing tools
- **Three-Server Coordination**: Clean separation of concerns between components
- **Modular Node System**: Easily create and extend workflow nodes
- **Type-Safe Execution**: Strong validation throughout the execution pipeline

## Documentation

For detailed information, please refer to:

- [Platform Documentation](docs/DOCUMENTATION.md) - Comprehensive platform documentation
- [Node Creation Guide](docs/ultra-simple-node-creation.md) - Detailed guide for creating custom nodes
- [Node Debug System](docs/DOCUMENTATION.md#node-debug-system) - Information about testing and debugging nodes
- [Webhook System](docs/DOCUMENTATION.md#webhook-integration-system) - Details on webhook architecture

## Getting Started

1. Start the application with:
   ```
   npm run dev
   ```

2. Access the application at: http://localhost:5000

## Development

This project follows a modular structure with clean separation of concerns. Key directories:

- `/client` - Frontend React application
- `/server` - Main application server
- `/integration-engine` - Integration and webhook server
- `/workflow-execution` - Workflow execution server
- `/shared` - Shared types and utilities
- `/docs` - Comprehensive documentation