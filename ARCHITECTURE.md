# Lead Gen Rabbit - Architecture Overview

This document provides an overview of Lead Gen Rabbit's three-server architecture, which has been designed for modularity, separation of concerns, and maintainability.

## Three-Server Architecture

The system is divided into three specialized servers, each with clear responsibilities:

### 1. Main Application Server (Port 5000)

The Main Application Server is the primary entry point for all user interactions. It handles:

- User interface serving (React frontend)
- API routing and coordination
- Authentication and session management
- Overall system coordination

Directory: `/server`

### 2. Workflow Execution Server (Port 3002)

The Workflow Execution Server is dedicated to executing user-defined workflows. It handles:

- Workflow execution and job queuing
- Node execution in the correct dependency order
- Webhook response handling
- Execution state management

Directory: `/workflow-execution`

### 3. Integration Engine Server (Port 3001)

The Integration Engine Server manages all external API integrations. It handles:

- External API communication
- Webhook registration and forwarding
- Authentication to third-party services
- API proxying for security and monitoring

Directory: `/integration-engine`

## Shared Components

Certain components are shared across servers:

- Common types and interfaces: `/shared/types`
- Database schema definitions: `/shared/schema.ts`
- Utility functions: `/shared/utils`

## Communication Flow

The typical request flow is:

1. User interacts with the frontend served by the Main Application Server
2. Main Application Server routes requests to the appropriate handler:
   - Workflow requests → Workflow Execution Server
   - API integration requests → Integration Engine Server
3. Specialized servers process the request and return results
4. Main Application Server delivers results to the user

## Migration Status

The migration to the three-server architecture is currently in progress:

| Component                    | Status      | Description                                                     |
|------------------------------|-------------|-----------------------------------------------------------------|
| Main Application Server      | In Progress | The core server continues to run while other components migrate |
| Workflow Execution Server    | ✓ Completed | Successfully migrated to `/workflow-execution` directory        |
| Integration Engine Server    | ✓ Completed | Successfully migrated to `/integration-engine` directory        |
| Shared Types                 | In Progress | Migrating types to `/shared/types` directory                   |
| Migration Documentation      | ✓ Completed | Documentation of the architecture and migration paths          |

The migration process is being done incrementally to maintain system stability while
restructuring the codebase. The transition uses import/export redirection to allow
for backward compatibility during the migration period.

## Benefits of This Architecture

- **Separation of Concerns**: Each server has a single, clear responsibility
- **Independent Scaling**: Servers can be scaled independently based on load
- **Fault Isolation**: Issues in one server won't affect others
- **Development Specialization**: Teams can focus on specific components
- **Clearer Code Organization**: Functionality is grouped logically in the file structure

## Future Enhancements

This architecture is designed to support future enhancements:

- Distributed execution across multiple instances
- Cloud deployment with independent scaling
- Microservice decomposition for larger components
- Independent development and deployment of each server component