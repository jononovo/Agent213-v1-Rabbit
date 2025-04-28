/**
 * Storage Module
 * 
 * This file defines and implements the storage interface for the application.
 * It uses an in-memory implementation for simplicity.
 */

import { 
  type User, type InsertUser,
  type Agent, type InsertAgent,
  type Workflow, type InsertWorkflow,
  type Node, type InsertNode,
  type Log, type InsertLog,
  type Settings, type InsertSettings
} from "@shared/schema";

/**
 * Storage interface for all data access
 */
export interface IStorage {
  // Database access for low-level operations
  db: Database;
  
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agent methods
  getAgents(type?: string): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;
  
  // Workflow methods
  getWorkflows(type?: string): Promise<Workflow[]>;
  getWorkflowsByAgentId(agentId: number): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  
  // Node methods
  getNodes(type?: string): Promise<Node[]>;
  getNode(id: number): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(id: number, node: Partial<Node>): Promise<Node | undefined>;
  deleteNode(id: number): Promise<boolean>;
  
  // Log methods
  getLogs(agentId?: number, limit?: number): Promise<Log[]>;
  getLog(id: number): Promise<Log | undefined>;
  createLog(log: InsertLog): Promise<Log>;
  updateLog(id: number, log: Partial<Log>): Promise<Log | undefined>;
  
  // Settings methods
  getSetting(id: string): Promise<Settings | undefined>;
  saveSetting(setting: InsertSettings): Promise<Settings>;
}

/**
 * In-memory storage implementation with Replit Database persistence
 */
import Database from '@replit/database';

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agents: Map<number, Agent>;
  private workflows: Map<number, Workflow>;
  private nodes: Map<number, Node>;
  private logs: Map<number, Log>;
  
  private userId: number;
  private agentId: number;
  private workflowId: number;
  private nodeId: number;
  private logId: number;
  
  // Public db property to allow access to the database
  public db: Database;
  private initializing: boolean;

  constructor() {
    this.initializing = true;
    this.users = new Map();
    this.agents = new Map();
    this.workflows = new Map();
    this.nodes = new Map();
    this.logs = new Map();
    
    this.userId = 1;
    this.agentId = 1;
    this.workflowId = 1;
    this.nodeId = 1;
    this.logId = 1;
    
    // Initialize Replit Database
    this.db = new Database();
    
    // Load persisted data or initialize with sample data
    this.initialize();
  }
  
  /**
   * Initialize the storage system and load persisted data
   */
  async initialize(): Promise<void> {
    try {
      await this.loadPersistedData();
      console.log('Storage system initialized');
      this.initializing = false;
    } catch (error) {
      console.error('Error initializing storage system:', error);
      // Initialize with sample data as fallback
      this.initializeDefaultData();
      this.initializing = false;
    }
  }
  
  /**
   * Save all data to Replit Database (useful for application shutdown or maintenance)
   */
  async saveAllData(): Promise<void> {
    try {
      // Temporarily disable initialization flag to allow saving
      const wasInitializing = this.initializing;
      this.initializing = false;
      
      // Simple parallel save of all data types
      await Promise.all([
        this.saveWorkflows(),
        this.saveAgents(),
        this.saveNodes(),
        this.saveLogs()
      ]);
      
      console.log('All data saved to Replit Database');
      
      // Restore initializing state
      this.initializing = wasInitializing;
    } catch (error) {
      console.error('Error saving all data:', error);
    }
  }
  
  // Settings methods
  async getSetting(id: string): Promise<Settings | undefined> {
    try {
      // Settings are stored directly in the Replit Database with their ID as the key
      // using the format: "setting:{id}"
      const settingKey = `setting:${id}`;
      const settingData = await this.db.get(settingKey) as unknown;
      
      if (!settingData) {
        return undefined;
      }
      
      const setting = this.parseDbResult(settingData);
      if (!setting) {
        return undefined;
      }
      
      return setting;
    } catch (error) {
      console.error(`Error getting setting ${id}:`, error);
      return undefined;
    }
  }
  
  async saveSetting(setting: InsertSettings): Promise<Settings> {
    try {
      const now = new Date();
      const newSetting: Settings = {
        ...setting,
        updatedAt: now
      };
      
      // Settings are stored directly with their ID as the key
      // using the format: "setting:{id}"
      const settingKey = `setting:${setting.id}`;
      await this.db.set(settingKey, JSON.stringify(newSetting));
      
      console.log(`Setting ${setting.id} saved successfully`);
      return newSetting;
    } catch (error) {
      console.error(`Error saving setting ${setting.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Helper to convert database result to usable data
   */
  private parseDbResult(data: unknown): any {
    if (!data) return null;
    
    // Handle different data types that might be returned
    console.log('Parsing data type:', typeof data);
    
    // Handle Replit Database format: { ok: true, value: "..." }
    if (typeof data === 'object' && data !== null) {
      const anyData = data as any;
      if (anyData.ok === true && anyData.value !== undefined) {
        console.log('Found Replit DB format with ok and value');
        // Use the value property which contains the actual data
        data = anyData.value;
      }
    }
    
    let dataStr: string;
    
    if (typeof data === 'string') {
      dataStr = data;
    } else if (typeof data === 'object') {
      dataStr = JSON.stringify(data);
    } else {
      console.warn('Unexpected data type from database:', typeof data);
      dataStr = String(data);
    }
    
    try {
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('Error parsing database result:', error);
      return null;
    }
  }
  
  private async loadPersistedData() {
    try {
      let hasData = false;
      
      // Output current database keys to help diagnose issues
      try {
        const keys = await this.db.list();
        console.log('Available Replit Database keys:', keys);
      } catch (error) {
        console.error('Error listing Replit Database keys:', error);
      }
      
      // Load workflows
      console.log('Attempting to load workflows from database...');
      const workflowsData = await this.db.get('workflows') as unknown;
      console.log('Raw workflows data:', workflowsData);
      
      if (workflowsData) {
        console.log('Parsing workflows data type:', typeof workflowsData);
        const workflows = this.parseDbResult(workflowsData);
        console.log('Parsed workflows:', workflows && Array.isArray(workflows) ? workflows.length : 'not an array');
        
        if (Array.isArray(workflows)) {
          workflows.forEach((workflow: Workflow) => {
            this.workflows.set(workflow.id, workflow);
            // Update workflowId counter to be higher than any existing workflow ID
            if (workflow.id >= this.workflowId) {
              this.workflowId = workflow.id + 1;
            }
          });
          console.log(`Loaded ${workflows.length} workflows from Replit Database`);
          hasData = true;
        } else {
          console.error('Workflows data is not an array:', workflows);
        }
      } else {
        console.log('No workflows data found in database');
      }
      
      // Load agents
      const agentsData = await this.db.get('agents') as unknown;
      if (agentsData) {
        const agents = this.parseDbResult(agentsData);
        
        if (Array.isArray(agents)) {
          agents.forEach((agent: Agent) => {
            this.agents.set(agent.id, agent);
            // Update agentId counter to be higher than any existing agent ID
            if (agent.id >= this.agentId) {
              this.agentId = agent.id + 1;
            }
          });
          console.log(`Loaded ${agents.length} agents from Replit Database`);
          hasData = true;
        }
      }
      
      // Load nodes
      const nodesData = await this.db.get('nodes') as unknown;
      if (nodesData) {
        const nodes = this.parseDbResult(nodesData);
        
        if (Array.isArray(nodes)) {
          // Array to store custom node types for registration with the front-end
          const customNodeTypes: string[] = [];
          
          nodes.forEach((node: Node) => {
            this.nodes.set(node.id, node);
            
            // Update nodeId counter to be higher than any existing node ID
            if (node.id >= this.nodeId) {
              this.nodeId = node.id + 1;
            }
            
            // Add custom nodes to the customNodeTypes array
            if (node.isCustom && node.type) {
              customNodeTypes.push(node.type);
            }
          });
          
          // Store custom node types in the database for the front-end to access
          if (customNodeTypes.length > 0) {
            this.saveData('customNodeTypes', customNodeTypes);
            console.log(`Registered ${customNodeTypes.length} custom node types`);
          }
          
          console.log(`Loaded ${nodes.length} nodes from Replit Database`);
          hasData = true;
        }
      }
      
      // Load logs
      const logsData = await this.db.get('logs') as unknown;
      if (logsData) {
        const logs = this.parseDbResult(logsData);
        
        if (Array.isArray(logs)) {
          logs.forEach((log: Log) => {
            this.logs.set(log.id, log);
            // Update logId counter to be higher than any existing log ID
            if (log.id >= this.logId) {
              this.logId = log.id + 1;
            }
          });
          console.log(`Loaded ${logs.length} logs from Replit Database`);
          hasData = true;
        }
      }
      
      // Initialize with sample data if no persisted data was found
      if (!hasData) {
        console.log('No persisted data found, initializing with default data');
        this.initializeDefaultData();
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
      // Initialize with sample data as fallback
      this.initializeDefaultData();
    }
  }

  private initializeDefaultData() {
    // This method deliberately left empty
    // No default data will be created to avoid hardcoded examples
    console.log('Initializing with empty data store');
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Agent methods
  async getAgents(type?: string): Promise<Agent[]> {
    const agents = Array.from(this.agents.values());
    if (type) {
      return agents.filter(agent => agent.type === type);
    }
    return agents;
  }
  
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }
  
  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.agentId++;
    const now = new Date();
    const agent: Agent = { 
      ...insertAgent,
      id,
      status: insertAgent.status || "active",
      description: insertAgent.description || null,
      icon: insertAgent.icon || null,
      userId: insertAgent.userId || null,
      configuration: insertAgent.configuration || {},
      createdAt: now,
      updatedAt: now
    };
    this.agents.set(id, agent);
    
    // Persist agents
    this.saveAgents();
    
    return agent;
  }
  
  async updateAgent(id: number, agentUpdate: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const now = new Date();
    const updatedAgent: Agent = { 
      ...agent,
      ...agentUpdate,
      id,
      updatedAt: now
    };
    this.agents.set(id, updatedAgent);
    
    // Persist agents
    this.saveAgents();
    
    return updatedAgent;
  }
  
  async deleteAgent(id: number): Promise<boolean> {
    const result = this.agents.delete(id);
    
    // Persist agents if deletion was successful
    if (result) {
      this.saveAgents();
    }
    
    return result;
  }
  
  // Workflow methods
  async getWorkflows(type?: string): Promise<Workflow[]> {
    const workflows = Array.from(this.workflows.values());
    if (type) {
      return workflows.filter(workflow => workflow.type === type);
    }
    return workflows;
  }
  
  async getWorkflowsByAgentId(agentId: number): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(
      workflow => workflow.agentId === agentId
    );
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }
  
  /**
   * Save data to Replit Database for persistence
   */
  private async saveData(key: string, data: any) {
    // Skip saving during initialization
    if (this.initializing) return;
    
    try {
      // Simple save implementation with just the essential functionality
      const jsonData = JSON.stringify(data);
      await this.db.set(key, jsonData);
      console.log(`Saved data to Replit Database: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error saving data to Replit Database (${key}):`, error);
      return false;
    }
  }
  
  /**
   * Save workflows to Replit Database
   */
  private async saveWorkflows() {
    if (this.initializing) return;
    const workflows = Array.from(this.workflows.values());
    return this.saveData('workflows', workflows);
  }
  
  /**
   * Save agents to Replit Database
   */
  private async saveAgents() {
    if (this.initializing) return;
    const agents = Array.from(this.agents.values());
    return this.saveData('agents', agents);
  }
  
  /**
   * Save nodes to Replit Database
   */
  private async saveNodes() {
    if (this.initializing) return;
    const nodes = Array.from(this.nodes.values());
    return this.saveData('nodes', nodes);
  }
  
  /**
   * Save logs to Replit Database
   */
  private async saveLogs() {
    if (this.initializing) return;
    // Only save the most recent logs (e.g., last 100) to avoid excessive storage usage
    const logs = Array.from(this.logs.values())
      .sort((a, b) => {
        // Convert strings to Date objects if needed
        const dateA = a.startedAt instanceof Date 
          ? a.startedAt 
          : a.startedAt 
            ? new Date(a.startedAt) 
            : new Date(0);
            
        const dateB = b.startedAt instanceof Date 
          ? b.startedAt 
          : b.startedAt 
            ? new Date(b.startedAt) 
            : new Date(0);
            
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 100); // Keep only the most recent 100 logs
    
    return this.saveData('logs', logs);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflowId++;
    const now = new Date();
    
    // Ensure flowData is stored properly
    let flowData = insertWorkflow.flowData;
    if (typeof flowData === 'string') {
      try {
        flowData = JSON.parse(flowData);
      } catch (e) {
        // If the string can't be parsed, keep it as-is
        console.warn('Could not parse flowData string:', e);
      }
    }
    
    const workflow: Workflow = { 
      ...insertWorkflow,
      id,
      name: insertWorkflow.name,
      type: insertWorkflow.type,
      description: insertWorkflow.description || null,
      icon: insertWorkflow.icon || null, 
      status: insertWorkflow.status || "draft",
      userId: insertWorkflow.userId || null,
      agentId: insertWorkflow.agentId || null,
      flowData,
      createdAt: now,
      updatedAt: now
    };
    this.workflows.set(id, workflow);
    
    // Persist the workflows
    this.saveWorkflows();
    
    return workflow;
  }
  
  async updateWorkflow(id: number, workflowUpdate: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const now = new Date();
    
    // Process flowData if it's provided as a string
    let flowData = workflowUpdate.flowData;
    if (typeof flowData === 'string') {
      try {
        flowData = JSON.parse(flowData);
        workflowUpdate.flowData = flowData;
      } catch (e) {
        console.warn('Could not parse flowData string:', e);
      }
    }
    
    const updatedWorkflow: Workflow = { 
      ...workflow,
      ...workflowUpdate,
      id,
      updatedAt: now
    };
    this.workflows.set(id, updatedWorkflow);
    
    // Persist the workflows
    this.saveWorkflows();
    
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: number): Promise<boolean> {
    const result = this.workflows.delete(id);
    
    // Persist the workflows if deletion was successful
    if (result) {
      this.saveWorkflows();
    }
    
    return result;
  }
  
  // Node methods
  async getNodes(type?: string): Promise<Node[]> {
    const nodes = Array.from(this.nodes.values());
    if (type) {
      return nodes.filter(node => node.type === type);
    }
    return nodes;
  }
  
  async getNode(id: number): Promise<Node | undefined> {
    return this.nodes.get(id);
  }
  
  async createNode(insertNode: InsertNode): Promise<Node> {
    const id = this.nodeId++;
    const now = new Date();
    
    // Add the category if not present
    const category = insertNode.category || 'general';
    
    const node: Node = { 
      ...insertNode,
      id,
      name: insertNode.name,
      type: insertNode.type,
      description: insertNode.description || null,
      icon: insertNode.icon || null,
      userId: insertNode.userId || null,
      configuration: insertNode.configuration || {},
      category,
      createdAt: now,
      updatedAt: now
    };
    this.nodes.set(id, node);
    
    // Persist nodes
    this.saveNodes();
    
    return node;
  }
  
  async updateNode(id: number, nodeUpdate: Partial<Node>): Promise<Node | undefined> {
    const node = this.nodes.get(id);
    if (!node) return undefined;
    
    const now = new Date();
    const updatedNode: Node = { 
      ...node,
      ...nodeUpdate,
      id,
      updatedAt: now
    };
    this.nodes.set(id, updatedNode);
    
    // Persist nodes
    this.saveNodes();
    
    return updatedNode;
  }
  
  async deleteNode(id: number): Promise<boolean> {
    const result = this.nodes.delete(id);
    
    // Persist nodes if deletion was successful
    if (result) {
      this.saveNodes();
    }
    
    return result;
  }
  
  // Log methods
  async getLogs(agentId?: number, limit: number = 20): Promise<Log[]> {
    const logs = Array.from(this.logs.values())
      .sort((a, b) => {
        // Sort by startedAt in descending order
        // Convert strings to Date objects if needed
        const dateA = a.startedAt instanceof Date 
          ? a.startedAt 
          : a.startedAt 
            ? new Date(a.startedAt) 
            : new Date(0);
            
        const dateB = b.startedAt instanceof Date 
          ? b.startedAt 
          : b.startedAt 
            ? new Date(b.startedAt) 
            : new Date(0);
            
        return dateB.getTime() - dateA.getTime();
      });
    
    // Filter by agentId if provided
    const filtered = agentId 
      ? logs.filter(log => log.agentId === agentId)
      : logs;
    
    // Apply limit
    return filtered.slice(0, limit);
  }
  
  async getLog(id: number): Promise<Log | undefined> {
    return this.logs.get(id);
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.logId++;
    const now = new Date();
    
    // Create log with required fields
    const log: Log = { 
      id,
      status: insertLog.status,
      agentId: insertLog.agentId,
      workflowId: insertLog.workflowId,
      input: insertLog.input || {},
      output: insertLog.output || {},
      error: insertLog.error || null,
      startedAt: now, // Always set startedAt to now
      completedAt: insertLog.completedAt || null,
      executionPath: insertLog.executionPath || {}
    };
    
    this.logs.set(id, log);
    
    // Persist logs
    this.saveLogs();
    
    return log;
  }
  
  async updateLog(id: number, logUpdate: Partial<Log>): Promise<Log | undefined> {
    const log = this.logs.get(id);
    if (!log) return undefined;
    
    const updatedLog: Log = { 
      ...log,
      ...logUpdate,
      id
    };
    this.logs.set(id, updatedLog);
    
    // Persist logs if this update completes the log (status is completed or error)
    if (logUpdate.status === 'completed' || logUpdate.status === 'error') {
      this.saveLogs();
    }
    
    return updatedLog;
  }
}

// Create and export a single instance of the storage
export const storage = new MemStorage();