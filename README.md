# AI Agent Workflow Platform

An advanced AI-powered workflow platform that enables dynamic webhook and API integrations with flexible, type-safe execution capabilities, focusing on intuitive node creation and modular AI-driven integrations.

## Core Architecture

This platform is built around a modular node-based architecture that allows for the composition of complex workflows through reusable components called "nodes". The system follows these key principles:

1. **Unified Node Registry**: The central source of truth for component loading and discovery.
2. **BaseNode Foundation**: All node UIs extend from a common BaseNode component that provides standardized behavior.
3. **Separation of Concerns**:
   - `definition.ts`: Defines what the node is (type, interface, metadata)
   - `executor.ts`: Handles what the node does (processing logic)
   - `ui.tsx`: Controls how the node looks (visual representation)
4. **Composition Over Inheritance**: Uses composition patterns rather than deep inheritance hierarchies.

## Project Structure

The project is organized into several key areas:

- `client/src/nodes/`: Contains node definitions, executors, and UI components
  - `components/`: Shared components used by multiple nodes
  - `System/`: Core system functionality nodes
  - `Custom/`: Application-specific nodes
  - `Integration/`: External API integration nodes
  - `Agents/`: Agent-specific nodes
  - `_node_templates/`: Templates for creating new nodes
- `client/src/lib/unifiedNodeRegistry.ts`: Central registry for node discovery
- `server/`: Express backend for API handling and workflow execution
- `shared/`: Types and utilities shared between client and server
- `docs/`: Detailed documentation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Access the application at http://localhost:3000

## Creating Nodes

The platform provides several templates for creating different types of nodes:

- `base_node_template`: Minimal template option
- `api_integration`: For external API integration
- `output_node`: For nodes that produce output
- `processing_node`: For data processing operations
- `webhook_integration`: For webhook functionality

For detailed instructions on creating nodes, refer to the [Ultra-Simple Node Creation Guide](docs/ultra-simple-node-creation.md).

## Node Organization

Nodes are organized in folders by category:

- `System/`: Core system functionality nodes (function_node, etc.)
- `Custom/`: Application-specific nodes
- `Integration/`: External API integration nodes (Claude, Perplexity API, etc.)
- `Agents/`: Agent-specific nodes

All nodes follow a standardized export pattern using `export default memo(ComponentName)`.

## Documentation

For more detailed information, refer to these documentation resources:

- [Node System Context](client/src/nodes/CONTEXT.md): Essential context for working with the node system
- [Ultra-Simple Node Creation Guide](docs/ultra-simple-node-creation.md): Comprehensive guide to creating nodes
- Additional documentation in the `docs/` folder

## Core Technologies

- TypeScript for type-safe development
- Express.js for API routing
- Zod for advanced validation
- Vite-powered dynamic node discovery
- React Flow for workflow visualization
- Comprehensive node creation documentation
- Modular AI integration capabilities
- Enhanced BaseNode component with UI customization
- Flexible webhook and API node template systems