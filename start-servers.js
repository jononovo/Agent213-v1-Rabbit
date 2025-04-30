/**
 * Start Servers Script
 * 
 * This script starts the specified server(s) for Lead Gen Rabbit:
 * - Integration Engine Server (port 3001)
 * - Workflow Execution Server (port 3002)
 * - Or both if no arguments are provided
 * 
 * Usage:
 *   node start-servers.js [integration|workflow|all]
 * 
 * The main server (port 5000) should be started separately with npm run dev
 */

const { spawn } = require('child_process');
const path = require('path');

// Start the Integration Engine Server
function startIntegrationEngine() {
  console.log('Starting Integration Engine Server...');
  
  const integrationEngine = spawn('node', [
    '--loader=ts-node/esm',
    path.join(__dirname, 'integration-engine', 'index.ts')
  ], {
    env: {
      ...process.env,
      INTEGRATION_ENGINE_PORT: '3001'
    },
    stdio: 'inherit' // Forward all stdio to parent process
  });
  
  integrationEngine.on('close', (code) => {
    console.log(`Integration Engine Server exited with code ${code}`);
    
    // Restart if crashed
    if (code !== 0) {
      console.log('Restarting Integration Engine Server...');
      setTimeout(startIntegrationEngine, 5000);
    }
  });
  
  return integrationEngine;
}

// Start the Workflow Execution Server
function startWorkflowExecution() {
  console.log('Starting Workflow Execution Server...');
  
  const workflowExecution = spawn('node', [
    '--loader=ts-node/esm',
    path.join(__dirname, 'workflow-execution', 'index.ts')
  ], {
    env: {
      ...process.env,
      WORKFLOW_EXECUTION_PORT: '3002'
    },
    stdio: 'inherit' // Forward all stdio to parent process
  });
  
  workflowExecution.on('close', (code) => {
    console.log(`Workflow Execution Server exited with code ${code}`);
    
    // Restart if crashed
    if (code !== 0) {
      console.log('Restarting Workflow Execution Server...');
      setTimeout(startWorkflowExecution, 5000);
    }
  });
  
  return workflowExecution;
}

function waitForSignal(processes) {
  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGINT');
      }
    });
    
    setTimeout(() => {
      console.log('Exiting...');
      process.exit(0);
    }, 1000);
  });
}

// Determine which servers to start based on command line argument
const serverArg = process.argv[2] || 'all';
const runningProcesses = [];

if (serverArg === 'integration' || serverArg === 'all') {
  runningProcesses.push(startIntegrationEngine());
}

if (serverArg === 'workflow' || serverArg === 'all') {
  runningProcesses.push(startWorkflowExecution());
}

// Handle graceful shutdown
waitForSignal(runningProcesses);

console.log(`Started ${serverArg} server(s). Press Ctrl+C to stop.`);