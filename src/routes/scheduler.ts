import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { schedulerController } from '../controllers/scheduler.js'

const scheduler = new Hono()

// All scheduler endpoints require admin role
scheduler.use('*', authMiddleware)
scheduler.use('*', requireRole('admin'))

// Get job status
scheduler.get('/jobs', schedulerController.getJobs)

// Get job names
scheduler.get('/jobs/names', schedulerController.getJobNames)

// Start job(s)
scheduler.post('/jobs/start', schedulerController.startJob)

// Stop job(s)
scheduler.post('/jobs/stop', schedulerController.stopJob)

// Manually trigger a job
scheduler.post('/jobs/:name/trigger', schedulerController.triggerJob)

// Get health metrics (from health check job)
scheduler.get('/health-metrics', schedulerController.getHealthMetrics)

// Get daily reports
scheduler.get('/daily-reports', schedulerController.getDailyReports)

export default scheduler