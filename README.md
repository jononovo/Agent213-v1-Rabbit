# AI Agent Workflow Platform

This project implements a flexible, extensible node-based workflow system for creating, visualizing, and executing workflows. The architecture uses a convention-over-configuration pattern with automatic node discovery based on folder structure, making it easy to add new node types.

## Core Architecture

The AI Agent Workflow Platform is built around a modular node-based architecture that enables the composition of complex workflows through simple, reusable components:

- **Modularity**: Each node is a self-contained unit with well-defined interfaces
- **Discoverability**: Components are automatically discovered and registered
- **Type Safety**: Strong typing ensures consistent interfaces and validation
- **Separation of Concerns**: Clear boundaries between definition, execution, and presentation

## Key Features

- **Folder-based Node Architecture**: Each node is a self-contained module with definition, execution logic, and UI
- **Enhanced Node Pattern**: Standardized UI with settings drawer and hover menu functionality
- **Consistent User Experience**: All nodes follow the same visual design patterns
- **Type Safety**: Strong TypeScript typing throughout the system
- **Replit Database Integration**: Persistent storage using Replit's Key-Value Database

## Database Implementation

**Important Note**: This application uses an **in-memory storage solution** with persistence to Replit Database, not PostgreSQL. 

While there are PostgreSQL-related configuration files present in the codebase (drizzle.config.ts, server/db.ts), these are not actively used in the current implementation.

For all database-related functionality, refer to `server/storage.ts` which contains the actual implementation.

## Technical Stack

- **Frontend**: React, Tailwind CSS, shadcn/ui, React Flow
- **Backend**: Node.js, Express
- **Storage**: In-memory with Replit Database persistence
- **Typing**: TypeScript with Zod for validation

## Development

Start the application with:

```bash
npm run dev
```

This starts the Express server for the backend and serves the React frontend.

## Project Structure

```
client/src/nodes/          # Node implementation folders
  ├── System/              # System nodes (core functionality)
  ├── Custom/              # Domain-specific custom nodes
  └── Default/             # Default node implementation pattern

client/src/components/     # Shared UI components
  └── nodes/common/        # Common node UI components

client/src/lib/            # Core system libraries
  ├── nodeSystem.ts        # Node registration and discovery
  ├── nodeExecution.ts     # Node execution utilities

server/                    # Backend implementation
  ├── routes.ts            # API routes 
  ├── storage.ts           # Data storage implementation
  └── services/            # Service modules
```

## Documentation

For more detailed documentation, see the files in the README folder.