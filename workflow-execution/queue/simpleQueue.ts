/**
 * Simple Workflow Queue
 * 
 * A lightweight job queue for workflow execution that uses in-memory storage
 * with persistence to Replit Database. This provides a simpler alternative
 * to Redis-based queues for the current needs of the application.
 */

import { storage } from '../../server/storage';
import { v4 as uuidv4 } from 'uuid';
import { Job } from '../../shared/types/workflow';

export class SimpleWorkflowQueue {
  private queue: Job[] = [];
  private processing: boolean = false;
  private workers: Map<string, (job: Job) => Promise<any>> = new Map();
  
  constructor() {
    // Load pending jobs from storage on startup
    this.loadPendingJobs();
  }
  
  // Register a worker function for a specific job type
  registerWorker(jobType: string, workerFn: (job: Job) => Promise<any>) {
    this.workers.set(jobType, workerFn);
    console.log(`[Workflow Queue] Registered worker for job type: ${jobType}`);
  }
  
  // Add a new job to the queue
  async addJob(type: string, data: any): Promise<string> {
    const job: Job = {
      id: uuidv4(),
      type,
      data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to in-memory queue
    this.queue.push(job);
    
    // Persist to storage
    await this.saveJob(job);
    
    console.log(`[Workflow Queue] Added job ${job.id} of type ${type}`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processNextJob();
    }
    
    return job.id;
  }
  
  // Get job status by ID
  async getJob(id: string): Promise<Job | undefined> {
    // Check in-memory queue first
    let job = this.queue.find(j => j.id === id);
    
    // If not found, try to load from storage
    if (!job) {
      job = await this.loadJob(id);
    }
    
    return job;
  }
  
  // Process the next job in the queue
  private async processNextJob() {
    if (this.queue.length === 0 || this.processing) {
      return;
    }
    
    this.processing = true;
    
    // Find the next pending job
    const jobIndex = this.queue.findIndex(j => j.status === 'pending');
    
    if (jobIndex === -1) {
      this.processing = false;
      return;
    }
    
    const job = this.queue[jobIndex];
    const worker = this.workers.get(job.type);
    
    if (!worker) {
      // No worker registered for this job type
      job.status = 'failed';
      job.error = `No worker registered for job type: ${job.type}`;
      job.updatedAt = new Date();
      
      await this.saveJob(job);
      this.processing = false;
      this.processNextJob();
      return;
    }
    
    try {
      // Update job status
      job.status = 'processing';
      job.startedAt = new Date();
      job.updatedAt = new Date();
      await this.saveJob(job);
      
      console.log(`[Workflow Queue] Processing job ${job.id} of type ${job.type}`);
      
      // Execute the worker function
      const result = await worker(job);
      
      // Update job with result
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      
      console.log(`[Workflow Queue] Completed job ${job.id}`);
    } catch (error) {
      // Handle error
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      job.updatedAt = new Date();
      
      console.error(`[Workflow Queue] Failed job ${job.id}:`, job.error);
    }
    
    // Save updated job
    await this.saveJob(job);
    
    // Remove completed/failed jobs from memory after some time
    setTimeout(() => {
      const index = this.queue.findIndex(j => j.id === job.id);
      if (index !== -1) {
        this.queue.splice(index, 1);
      }
    }, 3600000); // Keep in memory for 1 hour
    
    // Continue processing
    this.processing = false;
    this.processNextJob();
  }
  
  // Save job to persistent storage
  private async saveJob(job: Job) {
    try {
      await storage.saveSetting({
        id: `workflow_job_${job.id}`,
        value: JSON.stringify(job)
      });
    } catch (error) {
      console.error(`[Workflow Queue] Error saving job ${job.id}:`, error);
    }
  }
  
  // Load job from persistent storage
  private async loadJob(id: string): Promise<Job | undefined> {
    try {
      const setting = await storage.getSetting(`workflow_job_${id}`);
      
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
      
      return undefined;
    } catch (error) {
      console.error(`[Workflow Queue] Error loading job ${id}:`, error);
      return undefined;
    }
  }
  
  // Load pending jobs from storage on startup
  private async loadPendingJobs() {
    try {
      // In a production system, we would scan all settings with a workflow_job_ prefix
      // For simplicity in this implementation, we'll just log initialization
      console.log(`[Workflow Queue] Initialized`);
    } catch (error) {
      console.error(`[Workflow Queue] Error loading pending jobs:`, error);
    }
  }
}

// Create singleton instance
export const workflowQueue = new SimpleWorkflowQueue();