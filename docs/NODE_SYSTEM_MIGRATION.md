# Node System Migration Guide

This document outlines the migration process for the node system from the legacy flat structure to the new modular, category-based organization.

## Overview of Changes

The node system has been reorganized to provide clearer separation of concerns and better modularity:

### Before (Legacy Structure)
```
client/src/nodes/
├── Base/                # Base node components
├── System/              # System nodes
├── Custom/              # Custom nodes
├── Integration/         # Integration nodes
├── components/          # Shared UI components
└── _node_templates/     # Node templates
```

### After (New Structure)
```
client/src/nodes/
├── core/                # Core node functionality
│   ├── base/            # Base node components
│   ├── registry/        # Node registration and discovery
│   └── types/           # Type definitions and interfaces
├── categories/          # Node categories
│   ├── System/          # System nodes
│   ├── Custom/          # Custom nodes
│   ├── Integration/     # Integration nodes
│   └── Agents/          # Agent nodes
├── components/          # Shared UI components
└── _node_templates/     # Node templates
```

## Key Architectural Changes

1. **Separation of Core Functionality**: The `core` directory now contains all essential node system infrastructure.
2. **Category-Based Node Organization**: Nodes are now organized into categories under the `categories` directory.
3. **Clearer Module Boundaries**: Each node is a self-contained module with its own definition, execution, and UI components.
4. **Improved Import Structure**: Imports now follow a more consistent pattern.

## Migration Steps

The migration was performed using a "clean break" approach with no backward compatibility to avoid duplication and confusion:

1. **Create New Directory Structure**:
   - Created `client/src/nodes/core` with `base`, `registry`, and `types` subdirectories
   - Created `client/src/nodes/categories` with category subdirectories
   - Maintained `client/src/nodes/components` in its original location

2. **Move Base Node**:
   - Moved BaseNode from `client/src/nodes/Base` to `client/src/nodes/core/base`
   - Updated all imports referencing BaseNode throughout the codebase

3. **Separate Registry Functionality**:
   - Split unifiedNodeRegistry.ts into separate modules with clear responsibilities
   - Created dedicated modules for discovery, validation, and registration

4. **Migrate Nodes**:
   - Moved nodes to appropriate category folders
   - Updated all import/export paths
   - Ensured consistent file structure within each node

5. **Update Documentation**:
   - Updated CONTEXT.md with new file locations
   - Updated ultra-simple-node-creation.md with new paths
   - Added this migration guide

## Import Path Changes

| Legacy Import | New Import |
|---------------|------------|
| `import { BaseNode } from '@/nodes/Base';` | `import { BaseNode } from '@/nodes/core/base';` |
| `import { SomeNode } from '@/nodes/System/some_node';` | `import { SomeNode } from '@/nodes/categories/System/some_node';` |
| `import { NodeDefinition } from '@/nodes/types';` | `import { NodeDefinition } from '@/nodes/core/types/nodeDefinitions';` |

## Node Creation Changes

Creating a new node now requires placing it in the appropriate category folder:

```bash
# Old way
cp -r client/src/nodes/_node_templates/base_node_template client/src/nodes/Custom/my_new_node

# New way
cp -r client/src/nodes/_node_templates/base_node_template client/src/nodes/categories/Custom/my_new_node
```

## Node Discovery and Registration Changes

The node discovery system now looks for nodes in the category folders:

```typescript
// Legacy pattern
const systemDefinitions = import.meta.glob('../nodes/System/*/definition.ts', { eager: true });

// New pattern
const systemDefinitions = import.meta.glob('../nodes/categories/System/*/definition.ts', { eager: true });
```

## Migrated Nodes

The following nodes have been migrated to the new structure:

1. claude (System)
2. function_node (System)
3. send_to_webhook (System)

## Important Notes

1. **Breaking Change**: This migration is a breaking change. All code that imports nodes needs to be updated.
2. **No Legacy Support**: The old directory structure has been completely removed to avoid confusion.
3. **Template Updates**: All node templates have been updated to use the new import paths.
4. **Documentation Update**: The documentation has been updated to reflect the new structure.

## Testing Considerations

When testing nodes after migration, verify:
- Node appears in the node palette correctly
- Node executes properly in workflows
- Node UI renders correctly
- Node settings work as expected
- Node handles (input/output ports) connect properly

## Troubleshooting Common Issues

1. **Import Errors**: If you see `Module not found` errors, check that the import path has been updated to the new structure.
2. **Node Registration Failures**: If nodes don't appear in the palette, check that the discovery paths in unifiedNodeRegistry.ts have been updated.
3. **UI Rendering Issues**: If the node UI doesn't render correctly, verify that the BaseNode import path is correct.