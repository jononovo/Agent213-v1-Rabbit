# Base Node Templates

This directory contains base templates for creating new nodes in the workflow system. These templates provide starting points for developers to create both standard and integration nodes.

## Available Templates

### 1. Standard Node Template (`base_node_standard`)

A template for creating standard nodes that process data within workflows. Standard nodes typically:
- Accept input from other nodes
- Process data based on configuration
- Provide output to downstream nodes
- Do not require external integration

Use this template for creating nodes like:
- Text processors
- Mathematical operations
- Data transformers
- Conditional nodes
- Input and output nodes

### 2. Integration Node Template (`base_node_integration`)

A template for creating nodes that integrate with external services through the Integration Engine. Integration nodes typically:
- Connect to external APIs
- Provide webhook endpoints
- Schedule operations
- Require authentication

Use this template for creating nodes like:
- API connectors
- Webhook triggers
- External service integrations
- Scheduled tasks

## How to Use These Templates

1. Choose the appropriate template based on your node's requirements
2. Copy the entire template folder to the correct destination:
   - Standard nodes: `client/src/nodes/[Category]/[your_node_type]`
   - Integration nodes: `client/src/nodes/Integration/[Category]/[your_node_type]`
3. Update the files as specified in the template's README.md
4. Test your node using the node-debug page

## Important Differences Between Node Types

### Structure
Both node types have the same basic file structure:
- `definition.ts` - Node interface definition
- `executor.ts` - Execution logic
- `ui.tsx` - Configuration UI
- `tests.ts` - Node tests
- `index.ts` - Component exports

### Key Differences

| Feature | Standard Node | Integration Node |
|---------|--------------|------------------|
| Location | Any category folder | Must be in `Integration` folder |
| Definition | Basic definition | Requires `integrationConfig` section |
| Execution | Simple input/output | Often requires registration with Integration Engine |
| API Access | Limited to workflow | Can access external APIs and services |
| Testing | Basic functionality tests | Tests for API connectivity, registration, etc. |

## Need Help?

For detailed instructions, refer to the complete documentation:
- Standard nodes: `client/src/nodes/Base_nodes/base_node_standard/README.md`
- Integration nodes: `client/src/nodes/Base_nodes/base_node_integration/README.md`
- Full guide: `README/step-by-step-guide-creating-new-nodes.md`