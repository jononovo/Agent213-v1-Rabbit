/**
 * Integration Engine Logging Module
 * 
 * Provides dedicated logging functionality for the Integration Engine,
 * with request tracking and persistent storage of webhook requests.
 */

import fs from 'fs';
import path from 'path';
import util from 'util';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Define log directory and file paths
const LOG_DIR = path.join(process.cwd(), 'logs');
const WEBHOOK_LOG_FILE = path.join(LOG_DIR, 'webhook-requests.log');
const INTEGRATION_LOG_FILE = path.join(LOG_DIR, 'integration-engine.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Initialize log files if they don't exist
if (!fs.existsSync(WEBHOOK_LOG_FILE)) {
  fs.writeFileSync(WEBHOOK_LOG_FILE, '');
}

if (!fs.existsSync(INTEGRATION_LOG_FILE)) {
  fs.writeFileSync(INTEGRATION_LOG_FILE, '');
}

/**
 * Format log message with timestamp and level
 */
function formatLogMessage(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (meta) {
    formattedMessage += '\n' + util.inspect(meta, { depth: 8, colors: false });
  }
  
  return formattedMessage;
}

/**
 * Write log entry to specified file
 */
function writeToLogFile(filePath: string, message: string): void {
  fs.appendFileSync(filePath, message + '\n');
}

/**
 * Log a general integration engine message
 */
export function logIntegration(level: LogLevel, message: string, meta?: any): void {
  const formattedMessage = formatLogMessage(level, message, meta);
  console.log(`[integration] ${formattedMessage}`);
  writeToLogFile(INTEGRATION_LOG_FILE, formattedMessage);
}

/**
 * Log a webhook request with detailed information
 */
export function logWebhookRequest(req: any, info: Record<string, any> = {}): void {
  const timestamp = new Date().toISOString();
  const requestId = info.requestId || `webhook_${Date.now()}`;
  
  // Extract relevant request info
  const requestInfo = {
    id: requestId,
    timestamp,
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers,
    body: req.body,
    workflowId: info.workflowId,
    nodeId: info.nodeId,
    ...info
  };
  
  // Log to console
  console.log(`[webhook] Request received:`, {
    id: requestId,
    method: req.method,
    path: req.path,
    workflowId: info.workflowId,
    nodeId: info.nodeId
  });
  
  // Log to webhook log file (with full details)
  const logEntry = JSON.stringify(requestInfo, null, 2);
  writeToLogFile(WEBHOOK_LOG_FILE, `\n===== WEBHOOK REQUEST ${timestamp} =====\n${logEntry}\n`);
  
  return requestInfo;
}

/**
 * Log a webhook response
 */
export function logWebhookResponse(requestId: string, response: any): void {
  const timestamp = new Date().toISOString();
  
  // Log to console
  console.log(`[webhook] Response sent for request ${requestId}:`, {
    timestamp,
    status: response.status || 200,
    data: response.data || response
  });
  
  // Log to webhook log file
  const logEntry = JSON.stringify({
    id: requestId,
    timestamp,
    response: response.data || response,
    status: response.status || 200
  }, null, 2);
  
  writeToLogFile(WEBHOOK_LOG_FILE, `\n===== WEBHOOK RESPONSE ${timestamp} =====\n${logEntry}\n`);
}

/**
 * Get recent webhook logs
 */
export function getRecentWebhookLogs(count: number = 10): string[] {
  try {
    const content = fs.readFileSync(WEBHOOK_LOG_FILE, 'utf8');
    const entries = content.split('\n===== WEBHOOK');
    
    // Return the most recent logs
    return entries
      .slice(-count)
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0)
      .map(entry => '===== WEBHOOK' + entry);
  } catch (error) {
    console.error('Error reading webhook logs:', error);
    return [];
  }
}

export default {
  debug: (message: string, meta?: any) => logIntegration(LogLevel.DEBUG, message, meta),
  info: (message: string, meta?: any) => logIntegration(LogLevel.INFO, message, meta),
  warn: (message: string, meta?: any) => logIntegration(LogLevel.WARN, message, meta),
  error: (message: string, meta?: any) => logIntegration(LogLevel.ERROR, message, meta),
  webhook: {
    request: logWebhookRequest,
    response: logWebhookResponse,
    getRecent: getRecentWebhookLogs
  }
};