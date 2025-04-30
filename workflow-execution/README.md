# Workflow Execution Server

The Workflow Execution Server is a standalone service responsible for executing workflows and handling webhook responses. It runs on port 3002 and provides a clean separation of concerns for workflow execution.

## Architecture

This server follows a modular architecture:

```
workflow-execution/
├── engine/             # Core workflow execution logic
│   └── workflowEngine.ts
├── queue/              # Job queue management
│   └── simpleQueue.ts
├── webhooks/           # Webhook response handling
│   └── webhookHandler.ts
├── nodes/              # (Future) Node execution code
├── index.ts            # Main server entry point
└── README.md           # This documentation file
```

## Key Functionality

The Workflow Execution Server provides:

1. **Workflow Execution**: Runs workflows by executing nodes in the correct dependency order
2. **Job Queue Management**: Manages a queue of workflow execution jobs
3. **Webhook Handling**: Directly responds to webhook requests based on workflow results
4. **Status Tracking**: Provides job status information and execution results

## API Endpoints

The server exposes these main endpoints:

- `POST /api/execute`: Queues a workflow for execution
- `GET /api/status/:jobId`: Gets the status of a workflow execution job
- `POST /api/webhook`: Executes a workflow from a webhook with direct response handling
- `POST /api/webhook-response`: Sends a response to a pending webhook request
- `GET /api/webhook-stats`: Gets statistics about pending webhook responses

## Integration Points

The Workflow Execution Server integrates with:

1. **Main Application Server**: Receives execution requests and forwards webhook calls
2. **Integration Engine**: Communicates with external services for workflow nodes

## Future Enhancements

The server architecture supports future extensions:

1. **Scalable Queue**: Replace the in-memory queue with a distributed solution
2. **Distributed Execution**: Run workflow nodes across multiple instances
3. **Real-time Monitoring**: Add WebSocket support for real-time execution updates