# Hono.js TypeScript Template

A production-ready template for building fast, scalable backend services with modern technologies and best practices.

## ⚡ Tech Stack

- **[Hono.js](https://hono.dev/)** - Fast, lightweight web framework for edge environments
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development experience
- **[Prisma](https://www.prisma.io/)** - Modern database ORM with type safety
- **[Zod](https://zod.dev/)** - Runtime type validation and parsing
- **[Pino](https://getpino.io/)** - High-performance structured logging
- **[Docker](https://www.docker.com/)** - Containerized deployment
- **[PM2](https://pm2.keymetrics.io/)** - Advanced process manager
- **[Nginx](https://nginx.org/)** - Reverse proxy and load balancer
- **[Redis](https://redis.io/)** - In-memory caching and session storage
- **[PostgreSQL](https://www.postgresql.org/)** - Robust relational database
- **[RBAC](https://en.wikipedia.org/wiki/Role-based_access_control)** - Role-Based Access Control system
- **[Cron Jobs](https://en.wikipedia.org/wiki/Cron)** - Scheduled task management with node-cron
- **[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)** - Real-time server-to-client communication
- **[Prometheus](https://prometheus.io/)** - Enterprise metrics collection and monitoring
- **[Grafana](https://grafana.com/)** - Data visualization and observability platform
- **[OpenTelemetry](https://opentelemetry.io/)** - Distributed tracing and observability

## 🏗️ System Architecture

### 📊 Overall Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          🌐 Client Layer                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Web Apps  │  │ Mobile Apps │  │  API Clients │  │   Real-time Clients    │ │
│  │             │  │             │  │             │  │    (SSE/EventStream)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────────────────────┘
                          │ HTTP/HTTPS + WebSocket/SSE
┌─────────────────────────▼───────────────────────────────────────────────────────┐
│                        🚪 Gateway Layer                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         Nginx (Reverse Proxy)                              │ │
│  │  • SSL Termination  • Load Balancing  • Rate Limiting  • Static Files     │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────────────────┐
│                      🎯 Application Layer                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    Hono.js Application (PM2 Cluster)                       │ │
│  │                                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │ │
│  │  │   Routes    │ │ Controllers │ │   Services  │ │      Middleware         │ │ │
│  │  │             │ │             │ │             │ │                         │ │ │
│  │  │ • Auth      │ │ • Auth      │ │ • Auth      │ │ • JWT Authentication    │ │ │
│  │  │ • Users     │ │ • Users     │ │ • Users     │ │ • RBAC Authorization    │ │ │
│  │  │ • RBAC      │ │ • RBAC      │ │ • RBAC      │ │ • Rate Limiting         │ │ │
│  │  │ • Health    │ │ • Health    │ │ • Health    │ │ • CORS                  │ │ │
│  │  │ • SSE       │ │ • SSE       │ │ • SSE       │ │ • Logging               │ │ │
│  │  │ • Scheduler │ │ • Scheduler │ │ • Scheduler │ │ • Metrics Collection    │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘ │ │
│  │                                                                             │ │
│  │  ┌─────────────────────┐              ┌─────────────────────────────────────┐ │ │
│  │  │   Validation        │              │        Background Jobs              │ │ │
│  │  │                     │              │                                     │ │ │
│  │  │ • Zod Schemas       │              │ • Session Cleanup (Cron)           │ │ │
│  │  │ • Type Safety       │              │ • Daily Reports (Cron)             │ │ │
│  │  │ • Input Validation  │              │ • Health Monitoring (Cron)         │ │ │
│  │  │                     │              │ • Cache Warmup (Cron)              │ │ │
│  │  └─────────────────────┘              └─────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────┬─────────────────────────────────────────────┬─────────────────────┘
              │                                             │
┌─────────────▼───────────────┐                   ┌─────────▼───────────────────────┐
│      💾 Data Layer          │                   │   📊 Observability Layer       │
│                             │                   │                                 │
│  ┌─────────────────────────┐│                   │  ┌─────────────────────────────┐│
│  │     PostgreSQL          ││                   │  │        Prometheus           ││
│  │                         ││                   │  │                             ││
│  │ • User Management       ││                   │  │ • Metrics Collection        ││
│  │ • RBAC Data             ││                   │  │ • Time-Series Storage       ││
│  │ • Application Data      ││                   │  │ • Alert Rules               ││
│  │ • Prisma ORM            ││                   │  │ • Target Discovery          ││
│  └─────────────────────────┘│                   │  └─────────────────────────────┘│
│                             │                   │                                 │
│  ┌─────────────────────────┐│                   │  ┌─────────────────────────────┐│
│  │        Redis            ││                   │  │         Grafana             ││
│  │                         ││                   │  │                             ││
│  │ • Session Storage       ││                   │  │ • Dashboards                ││
│  │ • Rate Limiting         ││                   │  │ • Data Visualization        ││
│  │ • Caching               ││                   │  │ • User Interface            ││
│  │ • SSE Connections       ││                   │  │ • Query Builder             ││
│  └─────────────────────────┘│                   │  └─────────────────────────────┘│
└─────────────────────────────┘                   │                                 │
                                                  │  ┌─────────────────────────────┐│
                                                  │  │      AlertManager           ││
                                                  │  │                             ││
                                                  │  │ • Alert Routing             ││
                                                  │  │ • Notification Management   ││
                                                  │  │ • Silencing & Inhibition    ││
                                                  │  │ • Integration (Email/Slack) ││
                                                  │  └─────────────────────────────┘│
                                                  │                                 │
                                                  │  ┌─────────────────────────────┐│
                                                  │  │     OpenTelemetry           ││
                                                  │  │                             ││
                                                  │  │ • Distributed Tracing       ││
                                                  │  │ • Span Collection           ││
                                                  │  │ • Context Propagation       ││
                                                  │  │ • Performance Analysis      ││
                                                  │  └─────────────────────────────┘│
                                                  └─────────────────────────────────┘
```

### 🗂️ Project Structure

```
src/
├── config/          # Configuration modules
│   ├── database.ts  # Prisma client setup
│   ├── env.ts       # Environment validation
│   ├── logger.ts    # Pino logger config
│   └── redis.ts     # Redis connection
├── controllers/     # Request handlers
│   ├── auth.ts      # Authentication logic
│   ├── users.ts     # User management
│   ├── rbac.ts      # RBAC management
│   ├── health.ts    # Health checks
│   ├── sse.ts       # Server-Sent Events
│   └── scheduler.ts # Cron job management
├── middleware/      # Custom middleware
│   ├── auth.ts      # JWT verification
│   ├── rbac.ts      # Permission checks
│   ├── metrics.ts   # Prometheus metrics
│   ├── logger.ts    # Request logging
│   └── rate-limit.ts# Rate limiting
├── services/        # Business logic
│   ├── auth.service.ts        # Auth operations
│   ├── user.service.ts        # User operations
│   ├── rbac.service.ts        # RBAC operations
│   ├── sse.service.ts         # Real-time messaging
│   ├── scheduler.service.ts   # Job scheduling
│   ├── metrics.service.ts     # Metrics collection
│   └── notification.service.ts# Notifications
├── jobs/            # Scheduled tasks
│   ├── cleanup-sessions.ts    # Session cleanup
│   ├── daily-report.ts        # Daily reports
│   ├── health-check.ts        # Health monitoring
│   └── cache-warmup.ts        # Cache preparation
├── schemas/         # Validation schemas
│   ├── auth.ts      # Auth validation
│   ├── user.ts      # User validation
│   ├── rbac.ts      # RBAC validation
│   └── common.ts    # Shared schemas
└── types/           # TypeScript types
    └── hono.ts      # Extended Hono types

monitoring/          # Enterprise monitoring
├── grafana/
│   ├── dashboards/  # Pre-built dashboards
│   └── provisioning/# Auto-configuration
├── prometheus/
│   ├── prometheus.yml # Main configuration
│   └── rules/       # Alerting rules
└── alertmanager/
    └── alertmanager.yml # Alert routing
```

### 🔄 Data Flow & Integration

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   👤 Client     │    │   🔐 Auth Flow   │    │  📊 Monitoring  │
│                 │    │                 │    │                 │
│ 1. HTTP Request │────▶ 2. JWT Verify   │────▶ 3. Metrics     │
│                 │    │                 │    │   Collection    │
│ 8. Response     │◀────┤ 7. Response     │    │                 │
│                 │    │   + Headers     │    │ 4. Logs         │
│ 9. Real-time    │    │                 │    │   Generated     │
│   Updates (SSE) │◀─┐  │                 │    │                 │
└─────────────────┘  │  └─────────────────┘    └─────────────────┘
                     │           │                      │
                     │           │                      │
  ┌─────────────────┐│  ┌────────▼────────┐    ┌────────▼────────┐
  │  📡 SSE Service ││  │  🎯 Controller  │    │ 📈 Prometheus   │
  │                 ││  │                 │    │                 │
  │ • Channel Mgmt  ││  │ 5. Business     │    │ • Scrapes /metrics│
  │ • User Broadcast││  │   Logic Call    │    │ • Stores TSDB   │
  │ • Notifications ││  │                 │    │ • Triggers      │
  └─────────────────┘│  │                 │    │   Alerts        │
                     │  └────────┬────────┘    └─────────────────┘
                     │           │                      │
                     │  ┌────────▼────────┐            │
                     │  │  ⚙️  Service    │            │
                     │  │                 │            │
                     │  │ 6. Data Access  │            │
                     │  │   & Processing  │            │
                     │  │                 │            │
                     │  └────────┬────────┘            │
                     │           │                     │
                     │  ┌────────▼────────┐   ┌────────▼────────┐
                     └──┤  💾 Data Store  │   │  🚨 AlertMgr    │
                        │                 │   │                 │
                        │ • PostgreSQL    │   │ • Email/Slack   │
                        │ • Redis Cache   │   │ • PagerDuty     │
                        │ • Session Store │   │ • Escalation    │
                        └─────────────────┘   └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    🕒 Background Processes                       │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Session        │  │  Health         │  │  Daily          │  │
│  │  Cleanup        │  │  Monitoring     │  │  Reports        │  │
│  │                 │  │                 │  │                 │  │
│  │ • Every 1h      │  │ • Every 5m      │  │ • Every 24h     │  │
│  │ • Expire old    │  │ • Check systems │  │ • Generate      │  │
│  │ • Clear cache   │  │ • Update status │  │ • Send email    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL
- Redis

### Development Setup

1. **Clone and install dependencies**

   ```bash
   git clone git@github.com:cerebralatlas/honojs-template.git
   cd honojs-template
   pnpm install
   ```

2. **Setup environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis configurations
   ```

3. **Setup database**

   ```bash
   # Generate Prisma client
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # Initialize RBAC system (roles and permissions)
   pnpm rbac:init
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Visit your application**

   ```
   http://localhost:3000
   ```

## 📜 Available Scripts

### Development

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Process Management

- `pnpm start:pm2` - Start with PM2 cluster mode
- `pnpm stop:pm2` - Stop all PM2 processes
- `pnpm restart:pm2` - Restart PM2 processes

### Database

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Prisma Studio
- `pnpm rbac:init` - Initialize RBAC system with default roles and permissions

### Docker

- `pnpm docker:build` - Build Docker image
- `pnpm docker:up` - Start with Docker Compose
- `pnpm docker:down` - Stop Docker services

### Enterprise Monitoring

- `pnpm monitoring:up` - Start monitoring stack (Prometheus + Grafana + AlertManager)
- `pnpm monitoring:down` - Stop monitoring stack
- `pnpm monitoring:restart` - Restart monitoring services

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm type-check` - Run TypeScript type checking

## 🔐 Features

### Authentication & Security

- JWT-based authentication with secure session management
- **Role-Based Access Control (RBAC)** with granular permissions
- Password hashing with bcrypt
- Rate limiting with Redis
- Input validation with Zod schemas
- CORS configuration
- Security headers and best practices

### Real-time Features

- **Server-Sent Events (SSE)** for real-time notifications and data streaming
- Channel-based message broadcasting
- User-specific messaging
- WebSocket alternative for one-way communication

### Scheduled Tasks

- **Cron job scheduler** with node-cron integration
- Built-in health monitoring and system maintenance jobs
- Job management API for start/stop/trigger operations
- Automatic session cleanup and report generation

### Enterprise Monitoring & Observability

- **Prometheus metrics collection** - HTTP requests, business metrics, system health
- **Grafana dashboards** - Pre-built visualizations for application monitoring
- **AlertManager integration** - Intelligent alert routing with severity-based notifications
- **OpenTelemetry tracing** - Distributed request flow analysis
- **Custom metrics** - Business logic and performance monitoring
- **System monitoring** - Memory usage, database connections, Redis health

### API Endpoints

#### Core Endpoints

- `GET /` - Application information
- `GET /api/v1/health` - Health check
- `GET /api/v1/health/readiness` - Readiness probe
- `GET /api/v1/health/liveness` - Liveness probe

#### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/auth/me/with-roles` - Get current user with roles and permissions

#### User Management

- `GET /api/v1/users` - List users (with pagination)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

#### RBAC Management

- `GET /api/v1/rbac/roles` - List all roles
- `POST /api/v1/rbac/roles` - Create new role
- `GET /api/v1/rbac/roles/:id` - Get role details
- `PUT /api/v1/rbac/roles/:id` - Update role
- `DELETE /api/v1/rbac/roles/:id` - Delete role
- `GET /api/v1/rbac/permissions` - List all permissions
- `POST /api/v1/rbac/permissions` - Create new permission
- `GET /api/v1/rbac/permissions/:id` - Get permission details
- `PUT /api/v1/rbac/permissions/:id` - Update permission
- `DELETE /api/v1/rbac/permissions/:id` - Delete permission
- `POST /api/v1/rbac/users/:userId/roles` - Assign role to user
- `DELETE /api/v1/rbac/users/:userId/roles` - Remove role from user
- `GET /api/v1/rbac/users/:userId/roles` - Get user roles
- `POST /api/v1/rbac/roles/:roleId/permissions` - Assign permission to role
- `DELETE /api/v1/rbac/roles/:roleId/permissions` - Remove permission from role
- `POST /api/v1/rbac/users/:userId/check-permission` - Check user permission
- `GET /api/v1/rbac/users/:userId/permissions` - Get user permissions
- `GET /api/v1/rbac/me/roles` - Get current user roles
- `GET /api/v1/rbac/me/permissions` - Get current user permissions

#### Scheduler Management (Admin only)

- `GET /api/v1/scheduler/jobs` - List all cron jobs and their status
- `GET /api/v1/scheduler/jobs/names` - Get list of job names
- `POST /api/v1/scheduler/jobs/start` - Start job(s) (query: ?name=jobName)
- `POST /api/v1/scheduler/jobs/stop` - Stop job(s) (query: ?name=jobName)
- `POST /api/v1/scheduler/jobs/:name/trigger` - Manually trigger a job
- `GET /api/v1/scheduler/health-metrics` - Get system health metrics
- `GET /api/v1/scheduler/daily-reports` - Get daily usage reports

#### Server-Sent Events

- `GET /api/v1/sse/connect` - Public SSE connection (query: ?channels=channel1,channel2)
- `GET /api/v1/sse/auth/connect` - Authenticated SSE connection
- `POST /api/v1/sse/user/send` - Send message to user's own channel (authenticated)
- `POST /api/v1/sse/admin/send/channel/:channel` - Send to channel (admin)
- `POST /api/v1/sse/admin/send/user/:userId` - Send to specific user (admin)
- `POST /api/v1/sse/admin/broadcast` - Broadcast to all clients (admin)
- `GET /api/v1/sse/admin/stats` - Get SSE statistics (admin)
- `GET /api/v1/sse/admin/clients` - Get connected clients (admin)

### Monitoring & Logging

- Structured logging with Pino
- Request/response logging middleware
- Health checks for database and Redis
- Memory usage monitoring
- Uptime tracking

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services (app, database, Redis, Nginx)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t honojs-template .

# Run container
docker run -p 3000:3000 --env-file .env honojs-template
```

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/honojs_template"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT=6379

# Application
NODE_ENV="development"
PORT=3000
API_PREFIX="/api/v1"

# Security
JWT_SECRET="your-super-secret-jwt-key-here"
CORS_ORIGIN="http://localhost:3000"

# Logging
LOG_LEVEL="info"
LOG_TO_FILE=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Enterprise Monitoring (Optional)
ENABLE_METRICS=false
METRICS_PORT=9464
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3001"

# OpenTelemetry (Optional)
ENABLE_TRACING=false
OTEL_SERVICE_NAME="honojs-template"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
```

## 🏭 Production Deployment

### With PM2

```bash
# Build the application
pnpm build

# Start with PM2
pnpm start:pm2

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

### With Docker Compose (Recommended)

```bash
# Production deployment with Nginx, SSL, and all services
docker-compose up -d

# Scale the application
docker-compose up -d --scale app=3
```

### Enterprise Monitoring Deployment

```bash
# Start the monitoring stack
pnpm monitoring:up

# Access monitoring interfaces
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
# AlertManager: http://localhost:9093

# Application metrics endpoint
# http://localhost:3000/metrics
```

## 🧪 Testing

The project includes comprehensive type checking and linting:

```bash
# Run all checks
pnpm type-check
pnpm lint
```

## 📝 API Documentation

All endpoints follow RESTful conventions and return JSON responses with the following structure:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

### Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🔐 Role-Based Access Control (RBAC)

This template includes a comprehensive RBAC system for fine-grained permission management.

### Quick Start

1. **Initialize RBAC system**

   ```bash
   pnpm rbac:init
   ```

2. **Default Roles Created**
   - **admin**: Full system access (all permissions)
   - **user**: Basic user permissions (read own profile, create/edit own posts)
   - **moderator**: User management and content moderation permissions

### RBAC Concepts

#### Resources and Actions

The RBAC system is built around **resources** (entities) and **actions** (operations):

- **Resources**: `rbac`, `users`, `posts`
- **Actions**: `read`, `manage`, `create`, `update`, `delete`, `read_own`, `update_own`, `delete_own`

#### Permission Examples

- `users:read` - View user information
- `users:manage` - Full user management (create, update, delete)
- `posts:read_own` - View own posts only
- `rbac:manage` - Manage roles and permissions

### Using RBAC in Your Code

#### Protecting Routes with Permissions

```typescript
import { requirePermission, requireRole } from './middleware/rbac.js'

// Require specific permission
app.get('/admin/users', 
  authMiddleware,
  requirePermission('users', 'manage'),
  getUsersHandler
)

// Require specific role
app.delete('/posts/:id',
  authMiddleware, 
  requireRole('admin'),
  deletePostHandler
)

// Require any of multiple roles
app.get('/moderator-panel',
  authMiddleware,
  requireAnyRole('admin', 'moderator'),
  moderatorPanelHandler
)
```

#### Checking Permissions Programmatically

```typescript
import { RBACService } from './services/rbac.service.js'

const rbacService = new RBACService()

// Check if user has permission
const result = await rbacService.checkUserPermission(userId, {
  resource: 'posts',
  action: 'delete'
})

if (result.hasPermission) {
  // User can delete posts
}
```

### RBAC Management API

#### Create Role

```bash
POST /api/v1/rbac/roles
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "editor",
  "description": "Content editor role"
}
```

#### Create Permission

```bash
POST /api/v1/rbac/permissions
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Edit Articles",
  "resource": "articles",
  "action": "edit",
  "description": "Edit article content"
}
```

#### Assign Role to User

```bash
POST /api/v1/rbac/users/{userId}/roles
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "roleId": "role-uuid-here"
}
```

#### Assign Permission to Role

```bash
POST /api/v1/rbac/roles/{roleId}/permissions
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "permissionId": "permission-uuid-here"
}
```

### Permission Hierarchy

```
admin (All Permissions)
├── rbac:manage - Manage roles and permissions
├── users:manage - Full user management
├── posts:manage - Full post management
└── ... (all other permissions)

moderator
├── rbac:read - View roles and permissions
├── users:read - View user information
├── posts:read - View all posts
├── posts:update - Edit any posts
└── posts:delete - Delete any posts

user (Basic Permissions)
├── users:read_own - View own profile
├── users:update_own - Edit own profile
├── posts:read - View posts
├── posts:create - Create new posts
├── posts:update_own - Edit own posts
└── posts:delete_own - Delete own posts
```

### Database Schema

The RBAC system uses four main tables:

```sql
-- Core tables
roles (id, name, description, created_at, updated_at)
permissions (id, name, resource, action, description, created_at, updated_at)

-- Junction tables
user_roles (id, user_id, role_id, created_at)
role_permissions (id, role_id, permission_id, created_at)
```

### Extending RBAC

To add new resources and permissions:

1. **Add new permissions**

   ```bash
   POST /api/v1/rbac/permissions
   {
     "name": "Manage Reports",
     "resource": "reports", 
     "action": "manage",
     "description": "Full report management"
   }
   ```

2. **Update middleware usage**

   ```typescript
   app.get('/reports', requirePermission('reports', 'read'), handler)
   app.post('/reports', requirePermission('reports', 'manage'), handler)
   ```

3. **Assign to roles**

   ```bash
   POST /api/v1/rbac/roles/{adminRoleId}/permissions
   {
     "permissionId": "new-permission-id"
   }
   ```

## 📅 Scheduled Tasks (Cron Jobs)

The template includes a comprehensive cron job scheduling system for automated tasks.

### Built-in Jobs

- **Session Cleanup** (hourly) - Removes expired sessions and tokens
- **Daily Reports** (6 AM daily) - Generates system usage statistics
- **Health Monitoring** (every 5 minutes) - Monitors system health and dependencies
- **Cache Warmup** (every 30 minutes) - Pre-loads frequently accessed data

### Managing Jobs

```bash
# Get job status
GET /api/v1/scheduler/jobs

# Start/stop specific job
POST /api/v1/scheduler/jobs/start?name=health-check
POST /api/v1/scheduler/jobs/stop?name=daily-report

# Manually trigger a job
POST /api/v1/scheduler/jobs/health-check/trigger
```

### Creating Custom Jobs

```typescript
import { scheduler } from '../services/scheduler.service.js'

// Register a new job
scheduler.registerJob({
  name: 'custom-task',
  schedule: '0 */6 * * *', // Every 6 hours
  task: async () => {
    // Your custom logic here
    console.log('Custom task executed!')
  },
  description: 'My custom scheduled task'
})
```

## 📡 Server-Sent Events (SSE)

Real-time communication for live updates, notifications, and streaming data.

### Client Connection

```javascript
// Public connection
const eventSource = new EventSource('/api/v1/sse/connect?channels=news,alerts')

// Authenticated connection  
const eventSource = new EventSource('/api/v1/sse/auth/connect', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
})

// Listen for events
eventSource.addEventListener('notification', (event) => {
  const data = JSON.parse(event.data)
  console.log('Notification:', data)
})

eventSource.addEventListener('data_update', (event) => {
  const data = JSON.parse(event.data)
  updateDashboard(data.payload)
})
```

### Sending Messages

```bash
# Send to specific channel (admin)
POST /api/v1/sse/admin/send/channel/news
{
  "event": "breaking_news",
  "data": {
    "title": "Important Update",
    "message": "System maintenance scheduled for tonight"
  }
}

# Send to specific user (admin)
POST /api/v1/sse/admin/send/user/user-id-123
{
  "event": "notification",
  "data": {
    "type": "info", 
    "message": "Your report is ready"
  }
}

# Broadcast to all clients (admin)
POST /api/v1/sse/admin/broadcast
{
  "event": "system_announcement",
  "data": {
    "message": "New features available!",
    "priority": "high"
  }
}
```

### Using the Notification Service

```typescript
import { notificationService } from '../services/notification.service.js'

// Send notification to user
await notificationService.notifyUser(userId, {
  type: 'success',
  title: 'Task Complete', 
  message: 'Your data export has finished',
  data: { downloadUrl: '/downloads/export.csv' }
})

// Broadcast system status
await notificationService.broadcastSystemStatus(
  'maintenance', 
  'Scheduled maintenance in progress',
  { estimatedDuration: '30 minutes' }
)

// Send progress updates
await notificationService.sendProgressUpdate(
  userId, 
  taskId, 
  75, 
  'Processing data...'
)
```

### Real-time Use Cases

- **Live Notifications** - User alerts, system messages
- **Progress Tracking** - File uploads, data processing
- **Dashboard Updates** - Real-time metrics, analytics  
- **Chat Systems** - Live messaging, activity feeds
- **System Monitoring** - Health status, performance metrics

## 🔒 Security Best Practices

- JWT tokens with configurable expiration
- **Role-Based Access Control (RBAC)** with granular permissions
- **Principle of least privilege** - users get minimal required permissions
- Password hashing with salt rounds
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Input validation on all endpoints
- Security headers middleware
- Non-root user in Docker containers
- Environment-based configuration
- Secrets management
- Permission-based route protection

## 🚀 Performance

- Cluster mode with PM2 for multi-core utilization
- Redis caching for sessions and rate limiting
- Database connection pooling with Prisma
- Optimized Docker multi-stage builds
- Structured logging for better observability
- Health checks for container orchestration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Review the documentation and examples

---

**Happy coding! 🎉**
