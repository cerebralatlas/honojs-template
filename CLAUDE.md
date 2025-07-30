# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a production-ready Hono.js TypeScript template project designed for building fast, scalable backend services. The project implements a complete modern web application stack with authentication, database integration, caching, monitoring, and containerized deployment.

## Architecture

- **Framework**: Hono.js with @hono/node-server adapter
- **Runtime**: Node.js 18+
- **Language**: TypeScript with strict mode enabled
- **Package Manager**: pnpm (evidenced by pnpm-lock.yaml)
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Sessions**: Redis with ioredis client
- **Authentication**: JWT with bcrypt password hashing + RBAC system
- **Validation**: Zod schemas for runtime type checking
- **Logging**: Structured logging with Pino
- **Process Management**: PM2 for production deployment
- **Containerization**: Multi-stage Docker builds with Docker Compose
- **Reverse Proxy**: Nginx configuration for production
- **Scheduled Tasks**: node-cron for automated job scheduling
- **Real-time Communication**: Server-Sent Events (SSE) for live updates
- **Enterprise Monitoring**: Prometheus + Grafana + AlertManager stack
- **Observability**: OpenTelemetry for distributed tracing
- **Metrics Collection**: Custom application and business metrics

## Project Structure

```
src/
├── config/          # Configuration modules
│   ├── database.ts  # Prisma client configuration
│   ├── env.ts       # Environment variable validation with Zod
│   ├── logger.ts    # Pino logger configuration
│   └── redis.ts     # Redis connection management
├── controllers/     # Request handlers
│   ├── auth.ts      # Authentication endpoints
│   ├── health.ts    # Health check endpoints
│   ├── rbac.ts      # RBAC management endpoints
│   ├── scheduler.ts # Cron job management endpoints
│   ├── sse.ts       # Server-Sent Events endpoints
│   └── user.ts      # User management endpoints
├── jobs/            # Scheduled task definitions
│   ├── cache-warmup.ts    # Cache warming job
│   ├── cleanup-sessions.ts # Session cleanup job
│   ├── daily-report.ts    # Daily reporting job
│   ├── health-check.ts    # Health monitoring job
│   └── index.ts           # Job initialization
├── middleware/      # Custom middleware
│   ├── auth.ts      # JWT authentication middleware
│   ├── cors.ts      # CORS configuration
│   ├── error-handler.ts # Global error handling
│   ├── logger.ts    # Request/response logging
│   ├── metrics.ts   # Prometheus metrics middleware
│   ├── rate-limit.ts # Redis-based rate limiting
│   └── rbac.ts      # Role-based access control middleware
├── routes/          # Route definitions
│   ├── auth.ts      # Authentication routes
│   ├── health.ts    # Health check routes
│   ├── index.ts     # Main API router
│   ├── rbac.ts      # RBAC management routes
│   ├── scheduler.ts # Scheduler management routes
│   ├── sse.ts       # Server-Sent Events routes
│   └── users.ts     # User management routes
├── services/        # Business logic layer
│   ├── auth.service.ts        # Authentication business logic
│   ├── health.service.ts      # Health monitoring logic
│   ├── metrics.service.ts     # Prometheus metrics collection service
│   ├── notification.service.ts # Real-time notification service
│   ├── rbac.service.ts        # RBAC management service
│   ├── scheduler.service.ts   # Cron job scheduler service
│   ├── sse.service.ts         # Server-Sent Events service
│   └── user.service.ts        # User management logic
├── schemas/         # Zod validation schemas
│   ├── auth.ts      # Authentication request/response schemas
│   ├── common.ts    # Common validation schemas
│   ├── rbac.ts      # RBAC validation schemas
│   └── user.ts      # User data validation schemas
├── utils/           # Utility functions
│   └── auth.ts      # Authentication utilities (JWT, bcrypt)
├── types/           # TypeScript type definitions
│   └── hono.ts      # Hono context type extensions
└── index.ts         # Application entry point

monitoring/           # Enterprise monitoring stack
├── grafana/         # Grafana configuration
│   ├── dashboards/  # Pre-built dashboards
│   └── provisioning/ # Auto-provisioning configs
├── prometheus/      # Prometheus configuration
│   ├── prometheus.yml # Main Prometheus config
│   └── rules/       # Alerting rules
└── alertmanager/    # AlertManager configuration
    └── alertmanager.yml # Alert routing config
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start

# Process management with PM2
pnpm run start:pm2
pnpm run stop:pm2
pnpm run restart:pm2

# Database operations
pnpm run db:generate    # Generate Prisma client
pnpm run db:push        # Push schema to database
pnpm run db:migrate     # Run migrations
pnpm run db:studio      # Open Prisma Studio

# RBAC operations
pnpm run rbac:init      # Initialize RBAC with default roles and permissions

# Docker operations
pnpm run docker:build  # Build Docker image
pnpm run docker:up     # Start with Docker Compose
pnpm run docker:down   # Stop Docker services

# Enterprise monitoring
pnpm run monitoring:up       # Start monitoring stack (Prometheus + Grafana + AlertManager)
pnpm run monitoring:down     # Stop monitoring stack
pnpm run monitoring:restart  # Restart monitoring services

# Code quality
pnpm run lint          # Run ESLint
pnpm run lint:fix      # Fix ESLint issues
pnpm run type-check    # TypeScript type checking
```

## Key Configuration Files

- **tsconfig.json**: TypeScript configuration with strict mode, ESNext target, and NodeNext module resolution
- **package.json**: Dependencies and scripts configuration
- **prisma/schema.prisma**: Database schema with User, Post, and Session models
- **docker-compose.yml**: Multi-service Docker configuration with PostgreSQL, Redis, Nginx
- **Dockerfile**: Multi-stage build for optimized production images
- **ecosystem.config.js**: PM2 configuration for cluster mode deployment
- **eslint.config.js**: Modern ESLint configuration for TypeScript
- **.env.example**: Environment variable template
- **docker-compose.monitoring.yml**: Enterprise monitoring stack configuration
- **monitoring/prometheus/prometheus.yml**: Prometheus metrics collection configuration
- **monitoring/grafana/dashboards/**: Pre-built Grafana dashboards for application monitoring
- **monitoring/alertmanager/alertmanager.yml**: Alert routing and notification configuration

## Environment Variables

The application uses Zod for environment variable validation with the following required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis connection details
- `JWT_SECRET`: Secret for JWT token signing
- `NODE_ENV`: Application environment (development/production)
- `PORT`: Server port (default: 3000)
- `API_PREFIX`: API route prefix (default: /api/v1)
- `LOG_LEVEL`: Logging level (default: info)
- `CORS_ORIGIN`: CORS origin configuration
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`: Rate limiting configuration
- `ENABLE_METRICS`: Enable Prometheus metrics collection (optional)
- `METRICS_PORT`: Port for metrics endpoint (default: 9464)
- `ENABLE_TRACING`: Enable OpenTelemetry distributed tracing (optional)
- `OTEL_SERVICE_NAME`: Service name for telemetry data
- `PROMETHEUS_URL`, `GRAFANA_URL`, `ALERTMANAGER_URL`: Monitoring services URLs

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

- `POST /register` - User registration with email/password
- `POST /login` - User login returning JWT token
- `GET /me` - Get current authenticated user (protected)
- `GET /me/with-roles` - Get current user with roles and permissions

### User Management (`/api/v1/users`)

- `GET /` - List users with pagination
- `GET /:id` - Get user by ID with post count
- `POST /` - Create new user
- `PUT /:id` - Update existing user
- `DELETE /:id` - Delete user

### RBAC Management (`/api/v1/rbac`)

- `GET /roles` - List all roles (with optional permissions)
- `POST /roles` - Create new role (admin only)
- `GET /roles/:id` - Get role details with permissions
- `PUT /roles/:id` - Update role (admin only)
- `DELETE /roles/:id` - Delete role (admin only)
- `GET /permissions` - List all permissions
- `POST /permissions` - Create new permission (admin only)
- `POST /users/:userId/roles` - Assign role to user
- `DELETE /users/:userId/roles` - Remove role from user
- `GET /me/roles` - Get current user's roles
- `GET /me/permissions` - Get current user's permissions

### Scheduler Management (`/api/v1/scheduler`) - Admin Only

- `GET /jobs` - List all cron jobs and their status
- `POST /jobs/start` - Start job(s) (query: ?name=jobName)
- `POST /jobs/stop` - Stop job(s) (query: ?name=jobName)
- `POST /jobs/:name/trigger` - Manually trigger a job
- `GET /health-metrics` - Get system health metrics (from health check job)
- `GET /daily-reports` - Get daily usage reports

### Server-Sent Events (`/api/v1/sse`)

- `GET /connect` - Public SSE connection (query: ?channels=channel1,channel2)
- `GET /auth/connect` - Authenticated SSE connection
- `POST /user/send` - Send message to user's own channel (authenticated)
- `POST /admin/send/channel/:channel` - Send to specific channel (admin)
- `POST /admin/send/user/:userId` - Send to specific user (admin)
- `POST /admin/broadcast` - Broadcast to all clients (admin)
- `GET /admin/stats` - Get SSE connection statistics (admin)

### Health Monitoring (`/api/v1/health`)

- `GET /` - Comprehensive health check (database, Redis, memory, uptime)
- `GET /readiness` - Kubernetes readiness probe
- `GET /liveness` - Kubernetes liveness probe

## Security Features

- JWT-based authentication with 7-day expiration
- **Role-Based Access Control (RBAC)** with granular permissions
- Password hashing using bcrypt with 12 salt rounds
- Rate limiting using Redis (100 requests per 15 minutes by default)
- Input validation using Zod schemas
- CORS configuration for cross-origin requests
- Security headers and best practices
- Non-root user execution in Docker containers
- Permission-based route protection for sensitive operations

## Database Models

### User Model

- `id`: UUID primary key
- `email`: Unique email address
- `name`: User display name
- `password`: Bcrypt hashed password
- `posts`: One-to-many relationship with Post model
- Timestamps: `createdAt`, `updatedAt`

### Post Model (example)

- `id`: UUID primary key
- `title`: Post title
- `content`: Optional post content
- `published`: Boolean publication status
- `authorId`: Foreign key to User
- Timestamps: `createdAt`, `updatedAt`

### Session Model

- `id`: UUID primary key
- `userId`: Foreign key to User
- `token`: Unique session token
- `expiresAt`: Token expiration timestamp

### RBAC Models

#### Role Model
- `id`: UUID primary key
- `name`: Unique role name
- `description`: Optional role description
- `userRoles`: Many-to-many relationship with Users
- `permissions`: Many-to-many relationship with Permissions

#### Permission Model
- `id`: UUID primary key
- `name`: Permission display name
- `resource`: Resource identifier (e.g., 'users', 'posts', 'rbac')
- `action`: Action identifier (e.g., 'read', 'write', 'manage')
- `description`: Optional permission description

#### UserRole & RolePermission Models
- Junction tables for many-to-many relationships
- Support for dynamic role and permission assignments

## Testing and Quality Assurance

- TypeScript strict mode with comprehensive type checking
- ESLint configuration for code quality and consistency
- Prisma type generation for database operations
- Structured error handling with proper HTTP status codes
- Request/response logging for debugging and monitoring

## Deployment Options

### Development

- Hot reload with tsx
- Environment variable validation
- Detailed error messages and stack traces

### Production

- PM2 cluster mode for multi-core utilization
- Docker multi-stage builds for optimized images
- Docker Compose with PostgreSQL, Redis, and Nginx
- Health checks for container orchestration
- Structured logging for observability

## Performance Considerations

- Redis caching for sessions and rate limiting
- Database connection pooling with Prisma
- Cluster mode deployment with PM2
- Optimized Docker layers for faster builds
- Efficient middleware ordering
- Structured logging with configurable levels

## Monitoring and Observability

- Health check endpoints for infrastructure monitoring
- **Automated health monitoring** via scheduled jobs (every 5 minutes)
- Memory usage monitoring with alerts
- Database and Redis connection health checks
- Request/response logging with request IDs
- Uptime tracking and reporting
- Process monitoring with PM2
- **Real-time system status** broadcasting via Server-Sent Events
- **Daily usage reports** with automated generation
- Comprehensive metric collection and storage in Redis

## Development Guidelines

When working with this codebase:

1. **Follow the layered architecture**: Controllers → Services → Database
2. **Use Zod schemas** for all input validation
3. **Implement proper error handling** with appropriate HTTP status codes
4. **Add logging** for important operations and errors
5. **Write type-safe code** leveraging TypeScript and Prisma types
6. **Test thoroughly** using the provided health checks and validation
7. **Follow security best practices** for authentication and data handling
8. **Use environment variables** for all configuration
9. **Document API changes** in the README and update schemas accordingly
10. **Maintain backward compatibility** when modifying existing endpoints
11. **Use RBAC middleware** for protected routes that require specific permissions
12. **Leverage scheduled jobs** for background tasks and maintenance
13. **Implement real-time features** using Server-Sent Events for live updates
14. **Follow the notification service patterns** for consistent real-time messaging

## Troubleshooting Commands

```bash
# Check application health
curl http://localhost:3000/api/v1/health

# View application logs
pnpm dev  # Development logs
pm2 logs  # Production logs with PM2
docker-compose logs -f app  # Docker logs

# Database troubleshooting
pnpm db:studio  # Visual database browser
pnpm db:generate  # Regenerate Prisma client

# Redis troubleshooting
redis-cli ping  # Test Redis connection

# Type checking and linting
pnpm type-check  # Check for TypeScript errors
pnpm lint  # Check for code quality issues

# RBAC troubleshooting
pnpm rbac:init  # Re-initialize RBAC system
curl -H "Authorization: Bearer <jwt>" http://localhost:3000/api/v1/rbac/me/roles

# Scheduler troubleshooting
curl -H "Authorization: Bearer <admin-jwt>" http://localhost:3000/api/v1/scheduler/jobs

# SSE testing
curl -N http://localhost:3000/api/v1/sse/connect?channels=test

# Enterprise monitoring
pnpm monitoring:up  # Start monitoring stack
curl http://localhost:9090  # Check Prometheus
curl http://localhost:3001  # Check Grafana (admin/admin)
curl http://localhost:3000/metrics  # Check app metrics endpoint
```

This template provides a solid foundation for building production-ready Hono.js applications with modern best practices, comprehensive security, real-time capabilities, automated maintenance, enterprise-grade monitoring, and deployment capabilities.

## Key Features Added

### 🔐 Role-Based Access Control (RBAC)
- Comprehensive permission system with roles, permissions, and user assignments
- Middleware for route protection based on roles and permissions
- Admin API for managing roles, permissions, and user assignments
- Integration with existing JWT authentication

### 📅 Scheduled Tasks (Cron Jobs)
- Built-in scheduler service with 4 production-ready jobs
- Session cleanup, daily reporting, health monitoring, cache warming
- Admin API for job management (start, stop, trigger, status)
- Graceful shutdown and error handling

### 📡 Server-Sent Events (SSE)
- Real-time communication service for live updates
- Channel-based messaging and user-specific notifications
- Notification service with structured message types
- Connection management with automatic cleanup

### 📊 Enterprise Monitoring & Observability
- **Prometheus Metrics**: Custom application and business metrics collection
- **Grafana Dashboards**: Pre-built dashboards for HTTP requests, user activity, scheduler jobs, SSE connections
- **AlertManager**: Intelligent alert routing with severity-based notifications
- **OpenTelemetry**: Distributed tracing for request flow analysis
- **System Monitoring**: Memory, database, Redis connection health tracking

### 🛠️ Enhanced Architecture
- Extended project structure with jobs, additional services and controllers
- Improved monitoring with automated health checks and reporting
- Type-safe implementation with comprehensive validation
- Production-ready with proper error handling and logging
