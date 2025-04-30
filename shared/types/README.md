# Shared Types

This directory contains type definitions shared across all components of the three-server architecture. These types provide a consistent interface between the Main Application Server, Workflow Execution Server, and Integration Engine Server.

## Purpose

The shared types ensure type safety and consistency across server boundaries. By maintaining a single source of truth for common data structures, we avoid inconsistencies and make it easier to trace data flow through the system.

## Key Type Categories

1. **API Types**
   - Request/response interfaces for API endpoints
   - Parameter validation schemas

2. **Workflow Types**
   - Workflow definitions and execution contexts
   - Node types and execution data structures
   - Job queue interfaces

3. **Integration Types**
   - Webhook definitions and payloads
   - API client interfaces
   - Integration provider schemas

4. **Shared Models**
   - Core domain entities
   - Database schema types

## Usage Guidelines

1. **Data Interfaces**: Define interfaces for data passed between servers
2. **Type Guards**: Include runtime type guards for validation
3. **Versioning**: Comment changes carefully for backward compatibility
4. **Minimalism**: Keep only what's truly shared; server-specific types stay in their module
5. **Documentation**: Include JSDoc comments for all type definitions

## Current Files

- `workflow.ts`: Workflow execution and job queue types
- `integration.ts`: Integration engine and provider types
- `node.ts`: Node interface and execution data types