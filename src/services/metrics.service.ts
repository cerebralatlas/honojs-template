import * as promClient from 'prom-client'
import { logger } from '../config/logger.js'

export class MetricsService {
  private registry: promClient.Registry
  
  // Core application metrics
  private httpRequestDuration!: promClient.Histogram<string>
  private httpRequestTotal!: promClient.Counter<string>
  private httpActiveConnections!: promClient.Gauge<string>
  
  // Business metrics
  private userRegistrations!: promClient.Counter<string>
  private userLogins!: promClient.Counter<string>
  private authFailures!: promClient.Counter<string>
  
  // System metrics  
  private databaseConnections!: promClient.Gauge<string>
  private redisConnections!: promClient.Gauge<string>
  private schedulerJobExecutions!: promClient.Counter<string>
  private schedulerJobDuration!: promClient.Histogram<string>
  
  // SSE metrics
  private sseConnections!: promClient.Gauge<string>
  private sseMessagesTotal!: promClient.Counter<string>
  
  constructor() {
    this.registry = new promClient.Registry()
    
    // Initialize metrics
    this.initializeHttpMetrics()
    this.initializeBusinessMetrics()
    this.initializeSystemMetrics()
    this.initializeSSEMetrics()
    
    // Collect default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({
      register: this.registry,
      prefix: 'honojs_',
    })
    
    logger.info('📊 Prometheus metrics service initialized')
  }
  
  private initializeHttpMetrics(): void {
    this.httpRequestDuration = new promClient.Histogram({
      name: 'honojs_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry]
    })
    
    this.httpRequestTotal = new promClient.Counter({
      name: 'honojs_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    })
    
    this.httpActiveConnections = new promClient.Gauge({
      name: 'honojs_http_active_connections',
      help: 'Number of active HTTP connections',
      registers: [this.registry]
    })
  }
  
  private initializeBusinessMetrics(): void {
    this.userRegistrations = new promClient.Counter({
      name: 'honojs_user_registrations_total',
      help: 'Total number of user registrations',
      registers: [this.registry]
    })
    
    this.userLogins = new promClient.Counter({
      name: 'honojs_user_logins_total', 
      help: 'Total number of user logins',
      labelNames: ['status'],
      registers: [this.registry]
    })
    
    this.authFailures = new promClient.Counter({
      name: 'honojs_auth_failures_total',
      help: 'Total number of authentication failures',
      labelNames: ['reason'],
      registers: [this.registry]
    })
  }
  
  private initializeSystemMetrics(): void {
    this.databaseConnections = new promClient.Gauge({
      name: 'honojs_database_connections',
      help: 'Number of active database connections',
      registers: [this.registry]
    })
    
    this.redisConnections = new promClient.Gauge({
      name: 'honojs_redis_connections',
      help: 'Number of active Redis connections',
      registers: [this.registry]
    })
    
    this.schedulerJobExecutions = new promClient.Counter({
      name: 'honojs_scheduler_job_executions_total',
      help: 'Total number of scheduler job executions',
      labelNames: ['job_name', 'status'],
      registers: [this.registry]
    })
    
    this.schedulerJobDuration = new promClient.Histogram({
      name: 'honojs_scheduler_job_duration_seconds',
      help: 'Duration of scheduler job executions in seconds',
      labelNames: ['job_name'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
      registers: [this.registry]
    })
  }
  
  private initializeSSEMetrics(): void {
    this.sseConnections = new promClient.Gauge({
      name: 'honojs_sse_connections',
      help: 'Number of active SSE connections',
      labelNames: ['channel'],
      registers: [this.registry]
    })
    
    this.sseMessagesTotal = new promClient.Counter({
      name: 'honojs_sse_messages_total',
      help: 'Total number of SSE messages sent',
      labelNames: ['event_type', 'channel'],
      registers: [this.registry]
    })
  }
  
  // HTTP metrics methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() })
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration)
  }
  
  incrementActiveConnections(): void {
    this.httpActiveConnections.inc()
  }
  
  decrementActiveConnections(): void {
    this.httpActiveConnections.dec()
  }
  
  // Business metrics methods
  recordUserRegistration(): void {
    this.userRegistrations.inc()
  }
  
  recordUserLogin(success: boolean): void {
    this.userLogins.inc({ status: success ? 'success' : 'failure' })
  }
  
  recordAuthFailure(reason: string): void {
    this.authFailures.inc({ reason })
  }
  
  // System metrics methods
  setDatabaseConnections(count: number): void {
    this.databaseConnections.set(count)
  }
  
  setRedisConnections(count: number): void {
    this.redisConnections.set(count)
  }
  
  recordSchedulerJobExecution(jobName: string, success: boolean, duration: number): void {
    this.schedulerJobExecutions.inc({ 
      job_name: jobName, 
      status: success ? 'success' : 'failure' 
    })
    this.schedulerJobDuration.observe({ job_name: jobName }, duration)
  }
  
  // SSE metrics methods
  setSSEConnections(channel: string, count: number): void {
    this.sseConnections.set({ channel }, count)
  }
  
  recordSSEMessage(eventType: string, channel: string): void {
    this.sseMessagesTotal.inc({ event_type: eventType, channel })
  }
  
  // Registry access
  getRegistry(): promClient.Registry {
    return this.registry
  }
  
  async getMetrics(): Promise<string> {
    return await this.registry.metrics()
  }
  
  // Health check for metrics collection
  isHealthy(): boolean {
    try {
      // Check if default metrics are being collected
      return this.registry.getSingleMetric('honojs_process_start_time_seconds') !== undefined
    } catch (error) {
      logger.error({ error }, 'Metrics service health check failed')
      return false
    }
  }
  
  // Custom metrics for specific use cases
  createCustomCounter(name: string, help: string, labelNames?: string[]): promClient.Counter<string> {
    return new promClient.Counter({
      name: `honojs_${name}`,
      help,
      labelNames: labelNames || [],
      registers: [this.registry]
    })
  }
  
  createCustomGauge(name: string, help: string, labelNames?: string[]): promClient.Gauge<string> {
    return new promClient.Gauge({
      name: `honojs_${name}`,
      help,
      labelNames: labelNames || [],
      registers: [this.registry]
    })
  }
  
  createCustomHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): promClient.Histogram<string> {
    return new promClient.Histogram({
      name: `honojs_${name}`,
      help,
      labelNames: labelNames || [],
      buckets: buckets || [0.001, 0.01, 0.1, 1, 10],
      registers: [this.registry]
    })
  }
}

// Singleton instance
export const metricsService = new MetricsService()