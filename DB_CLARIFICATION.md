# Database Implementation Clarification

## Current Implementation
This application uses an **in-memory storage solution** with persistence to Replit Database, not PostgreSQL.

The core storage implementation is in `server/storage.ts` which uses a `MemStorage` class to store data in memory and periodically save it to Replit Database for persistence.

## PostgreSQL Configuration Files
While there are PostgreSQL-related configuration files present in the codebase (drizzle.config.ts, server/db.ts), these are not actively used in the current implementation.

The server/db.ts file has been modified to be a placeholder that doesn't actually connect to PostgreSQL.

## Why This Clarification Exists
This clarification file was created to avoid confusion about the database implementation, as there are references to PostgreSQL in the codebase that might suggest it's being used.

## Actual Data Flow
1. Data is stored in memory in the `MemStorage` class
2. Periodically, data is persisted to Replit Database
3. PostgreSQL is not used in the current implementation

For all database-related functionality, refer to `server/storage.ts` which contains the actual implementation.