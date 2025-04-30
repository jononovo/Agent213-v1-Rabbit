# Main Application Server

The Main Application Server is the central coordination component of the system. It handles the frontend UI, authentication, and basic API routing. It runs on port 5000 and acts as the entry point for all user interactions.

## Future Structure

In the ongoing architectural reorganization, the server directory will be refactored to focus solely on its core responsibilities:

```
server/
├── api/               # API route definitions
├── auth/              # Authentication logic
├── config/            # Configuration files
├── middleware/        # Express middleware
├── utils/             # Utilities 
└── index.ts           # Main server entry point
```

## Migration Plan

The migration involves:

1. **Move Specialized Services**:
   - ✓ Workflow execution moved to `workflow-execution/`
   - Integration engine will be moved to `integration-engine/`

2. **Clarify Component Roles**:
   - Main Server: UI, routing, authentication
   - Workflow Execution Server: Running workflows
   - Integration Engine: External service communication

3. **Update Imports & References**:
   - Update import paths as components are moved
   - Maintain clean architectural boundaries

## Server Responsibilities

The Main Application Server is responsible for:

1. **Frontend Serving**: Delivering the React application to clients
2. **API Routing**: Routing requests to appropriate handlers
3. **User Sessions**: Managing authentication and user sessions
4. **Coordination**: Starting and orchestrating the other servers

This server is the only public-facing component, running on port 5000, while the other servers operate on internal ports.