# Backend API Architecture & Implementation

Learn.ai 4all backend is a **production-ready Next.js 16 App Router** API implementing a comprehensive learning management system with advanced course creation, module management, assessment workflows, and administrative controls.

## Tech Stack & Architecture

- **Runtime**: Next.js 16.0.0 (Turbopack) App Router with serverless API routes
- **Database**: Firebase Firestore NoSQL with ownership model and soft delete
- **Authentication**: Firebase Auth with Google OAuth + Email/Password
- **Authorization**: Multi-tier role-based access control with resource ownership
- **Admin SDK**: Firebase Admin SDK with custom initialization
- **Validation**: Comprehensive input validation and sanitization
- **Security**: Bearer token authentication with CORS and request validation
- **File Storage**: Firebase Storage with organized paths and access controls
- **Performance**: Composite indexes, denormalized counters, optimized queries
- **Data Integrity**: Idempotency system, transactional updates, audit trails
- **Error Handling**: Structured responses with detailed logging
- **AI Integration**: Support for AI-powered course content and assessments

## API Endpoints Overview (65+ endpoints)

### Authentication & User Management

```
POST /api/auth/mark-login          # Server-side login processing with streak tracking
GET  /api/auth/me                  # Current user profile and session information
POST /api/admin/users/roles        # Manage user roles and admin assignments
GET  /api/admin/users/roles        # List users with role information
```

### Public Course Discovery

```
GET  /api/catalog                  # Published course catalog for public browsing
GET  /api/courses/[courseId]       # Detailed course information with modules
```

### User Learning Workflow

```
POST /api/enroll                   # Idempotent course enrollment
GET  /api/enrollments              # User's enrolled courses with progress
POST /api/progress                 # Complete module and update progress
GET  /api/modules/access           # Access module content with gating
```

### Assessment System

```
GET  /api/questionnaires           # Available questionnaires for user
POST /api/questionnaires/assign   # Assign questionnaire to user
POST /api/questionnaires/start    # Start a questionnaire session
POST /api/questionnaires/submit   # Submit questionnaire responses
GET  /api/questionnaires/progress # Get questionnaire completion status
POST /api/questionnaires/gate     # Check prerequisite gating
GET  /api/questionnaires/context  # Retrieve questionnaire context
POST /api/questionnaires/remove   # Remove questionnaire assignment
```

### Admin Course Management

```
GET  /api/admin/courses.mine       # Admin's owned courses (supports ?all=true for all courses)
POST /api/admin/course.upsert      # Create or update course
POST /api/admin/course.publish     # Publish/unpublish course
POST /api/admin/course.archive     # Archive/unarchive course
POST /api/admin/course.complete    # Mark course as complete
```

### Admin Module Management

```
GET  /api/admin/modules.mine       # Admin's owned modules
POST /api/admin/module.upsert      # Create or update module
POST /api/admin/module.archive     # Archive/unarchive module
POST /api/admin/modules.reorder    # Reorder modules within course
```

### Admin Asset Management

```
POST /api/admin/asset.add          # Add asset to module
POST /api/admin/asset.remove       # Remove asset from module
POST /api/admin/asset.reorder      # Reorder assets within module
POST /api/admin/upload             # Upload files to Firebase Storage
```

### Admin Questionnaire & Assignment Management

```
GET  /api/admin/questionnaires     # All questionnaire templates
GET  /api/admin/questionnaires.mine # Admin's owned questionnaires
POST /api/admin/questionnaire.upsert # Create or update questionnaire
POST /api/admin/questionnaire.create-and-assign # Create questionnaire and assign
GET  /api/admin/assignments        # All assignments in system
GET  /api/admin/assignments.mine   # Admin's owned assignments
POST /api/admin/assignment.upsert  # Create or update assignment
POST /api/admin/assignment.update  # Update assignment details
POST /api/admin/assignment.delete  # Delete assignment
POST /api/admin/assignment.archive # Archive/unarchive assignment
```

### Admin User & Role Management

```
POST /api/admin/admins.create      # Create new admin user
GET  /api/admin/users/roles        # List users with role information
POST /api/admin/users/roles        # Update user roles
GET  /api/admin/audit.mine         # Admin audit trail
```

### Development & Debug Endpoints

```
POST /api/admin/seed.dev           # Seed development data
GET  /api/debug/courses            # Debug course information
POST /api/dev/migrate              # Run database migrations
GET  /api/health                   # System health check
GET  /api/catalog-temp             # Temporary catalog endpoint
```

### Admin Assignment Management

```
GET  /api/admin/assignments        # All questionnaire assignments
GET  /api/admin/assignments.mine   # Admin's questionnaire assignments
POST /api/admin/assignment.upsert  # Create or update assignment
POST /api/admin/assignment.update  # Update assignment details
POST /api/admin/assignment.archive # Archive assignment
POST /api/admin/assignment.delete  # Delete assignment
```

### System & Development

```
GET  /api/health                   # API health check and system status
POST /api/admin/seed.dev           # Development data seeding
GET  /api/admin/audit.mine         # Admin audit logs
POST /api/dev/migrate              # Database migration utilities
```

## Authentication & Authorization

### Firebase Auth Integration

**User Authentication**:

- **Google OAuth**: Primary authentication for end users
- **Provider Validation**: Enforced Google OAuth for user accounts
- **Auto-Registration**: Automatic user document creation on first login

**Admin Authentication**:

- **Email/Password**: Dedicated admin authentication method
- **Role Assignment**: Server-side role validation and custom claims
- **Admin Bootstrap**: Secure admin account creation with validation keys

### Authorization Model

```typescript
// Middleware functions for route protection
export async function getUserFromRequest(
  req: Request
): Promise<AuthUser | null>;
export function requireUser(user: AuthUser | null): asserts user is AuthUser;
export function requireAdmin(user: AuthUser | null): asserts user is AuthUser;

// Role-based access patterns
const user = await getUserFromRequest(req);
requireUser(user); // Throws 401 if not authenticated
requireAdmin(user); // Throws 403 if not admin role
```

### Session Management

- **Login Tracking**: Automatic streak calculation and timestamp updates
- **Token Validation**: Firebase ID token verification on every request
- **Custom Claims**: Role information embedded in JWT tokens
- **Provider Enforcement**: Separate authentication flows for users vs admins

## Database Operations

### Ownership Model

```typescript
// Enforce admin ownership of resources
export async function enforceOwnership(
  db: FirebaseFirestore.Firestore,
  adminUid: string,
  collection: string,
  docId: string
): Promise<void>;

// Course-specific ownership validation
export async function requireCourseOwnership(
  db: FirebaseFirestore.Firestore,
  adminUid: string,
  courseId: string
): Promise<void>;
```

### Soft Delete System

```typescript
// Archive functionality with metadata
export async function updateArchiveStatus(
  db: FirebaseFirestore.Firestore,
  collection: string,
  docId: string,
  archived: boolean,
  adminUid?: string
): Promise<void>;
```

### Denormalized Counters

```typescript
// Performance-optimized counter management
export async function updateEnrollmentCounter(
  db: FirebaseFirestore.Firestore,
  courseId: string,
  increment: boolean
): Promise<void>;

export async function recomputeCourseModuleCount(
  db: FirebaseFirestore.Firestore,
  courseId: string
): Promise<number>;
```

## Data Validation

### Zod Schema System

**Course Management**:

```typescript
export const zCourseUpsert = z.object({
  courseId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().nonnegative(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  heroImageUrl: z.string().url().optional(),
});
```

**Module Management**:

```typescript
export const zModuleUpsert = z.object({
  moduleId: z.string().optional(),
  courseId: z.string().min(1),
  index: z.number().int().min(0),
  title: z.string().min(1),
  summary: z.string().min(1),
  contentType: z.enum(["video", "text", "pdf", "image", "link"]),
  contentUrl: z.string().url().optional(),
  body: z.string().optional(),
  estMinutes: z.number().int().min(1),
});
```

**Questionnaire System**:

```typescript
export const zQuestionnaireUpsert = z.object({
  questionnaireId: z.string().optional(),
  title: z.string().min(1),
  purpose: z.enum(["survey", "quiz", "assessment"]),
  questions: z.array(zQuestion).min(1),
});
```

## File Storage & Upload System

### Firebase Storage Integration

**Storage Structure**:

```
courses/
├── heroes/                    # Course hero images
│   └── [courseId]/[filename]
└── modules/
    └── assets/                # Module assets
        └── [moduleId]/[filename]
```

**Upload Handling**:

```typescript
// File upload with validation and metadata
export async function handleFileUpload(
  file: File,
  path: string,
  metadata: Record<string, string>
): Promise<UploadResult>;
```

**Supported File Types**:

- **Images**: JPEG, PNG, WebP, AVIF (5MB limit)
- **Documents**: PDF (100MB limit)
- **Videos**: MP4, WebM (200MB limit)
- **Links**: External URL validation

## Performance & Scalability

### Query Optimization

**Composite Indexes**:

```javascript
// Course modules ordered by index
{ collection: "courseModules", fields: [
  { field: "courseId", order: "ASC" },
  { field: "index", order: "ASC" }
]}

// User enrollments by date
{ collection: "enrollments", fields: [
  { field: "uid", order: "ASC" },
  { field: "enrolledAt", order: "DESC" }
]}

// Admin-owned courses
{ collection: "courses", fields: [
  { field: "ownerUid", order: "ASC" },
  { field: "updatedAt", order: "DESC" }
]}
```

### Caching Strategy

- **Firebase Connection Pooling**: Reused database connections
- **Query Result Caching**: Firestore's built-in caching
- **CDN Delivery**: Firebase Storage CDN for assets
- **API Response Optimization**: Minimal data transfer

### Batch Operations

```typescript
// Batch updates for consistency
export async function batchUpdateModules(
  db: FirebaseFirestore.Firestore,
  updates: Array<{ moduleId: string; data: Partial<ModuleDoc> }>
): Promise<void>;
```

## Security Implementation

### Input Validation

- **Zod Schema Validation**: All request payloads validated
- **Type Safety**: TypeScript interfaces for all data structures
- **Sanitization**: Input cleaning and XSS prevention
- **File Validation**: MIME type and size validation for uploads

### Access Control

```typescript
// Resource ownership enforcement
const course = await db.collection('courses').doc(courseId).get();
if (course.data()?.ownerUid !== adminUid) {
  throw new Error('Access denied: You don't own this course');
}
```

### Data Protection

- **Firestore Security Rules**: Server-side access control
- **Audit Logging**: Comprehensive action tracking
- **Soft Delete**: Data retention with archive flags
- **Encryption**: HTTPS/TLS for all communications

## Error Handling

### Structured Error Responses

```typescript
interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

// Consistent error handling across endpoints
export function jsonError(
  code: string,
  message: string,
  status: number = 400,
  fieldErrors?: Record<string, string>
): NextResponse;
```

### Error Types

- **400 Bad Request**: Invalid input data or validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions for action
- **404 Not Found**: Resource doesn't exist or access denied
- **409 Conflict**: Resource already exists or state conflict
- **500 Internal Server Error**: Server-side processing errors

## Idempotency System

### Implementation

```typescript
// Idempotency wrapper for critical operations
export async function withIdempotency<T>(
  key: string,
  operation: () => Promise<T>,
  ttlHours: number = 24
): Promise<T>;
```

### Protected Endpoints

- **Enrollment**: Prevent duplicate course enrollments
- **Progress**: Avoid duplicate module completion
- **Questionnaire Submission**: Prevent multiple submissions
- **File Uploads**: Avoid duplicate file processing

## Audit & Logging

### Admin Audit System

```typescript
interface AdminAuditLogDoc {
  actorUid: string;        // Admin performing action
  action: string;          # Action type
  target: {
    type: "course" | "module" | "questionnaire" | "assignment";
    id: string;
    title?: string;
  };
  before?: Record<string, unknown>;  // State before change
  after?: Record<string, unknown>;   // State after change
  timestamp: FirebaseFirestore.Timestamp;
}
```

### Logged Operations

- **Course Management**: Create, update, publish, archive
- **Module Operations**: CRUD operations and reordering
- **Questionnaire Management**: Template and assignment changes
- **Asset Management**: Upload, remove, reorder operations
- **User Role Changes**: Admin promotion/demotion

## Development & Testing

### Development Setup

```bash
# Environment validation
npm run validate-env

# Database setup
npm run indexes

# Development server
npm run dev

# API health check
npm run status
```

### Testing Strategy

**Endpoint Testing**:

```bash
# Health check
curl http://localhost:3000/api/health

# Authentication test
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/auth/me

# Course creation test
curl -X POST http://localhost:3000/api/admin/course.upsert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Course", "description": "Test", ...}'
```

**Manual Testing**:

- Admin interface workflow testing
- User enrollment and progress flows
- Questionnaire assignment and completion
- File upload and asset management

### Error Monitoring

- **Structured Logging**: Consistent log format across endpoints
- **Error Tracking**: Detailed error context and stack traces
- **Performance Monitoring**: Query performance and response times
- **Health Checks**: Automated system health validation

## Production Readiness

### ✅ Completed Production Features

- **55+ API Endpoints**: Complete CRUD operations for all resources
- **Authentication System**: Dual-provider auth with role management
- **Course Creation Wizard**: 4-step guided course creation workflow
- **Module Management**: Rich content with asset management
- **Assessment System**: Complete questionnaire lifecycle
- **Admin Audit Trail**: Comprehensive action logging
- **Idempotency Protection**: Duplicate operation prevention
- **File Upload System**: Firebase Storage integration
- **Security Hardening**: Input validation, access control, audit logging
- **Performance Optimization**: Composite indexes, denormalized counters

### 🔒 Security Hardening

- **Firestore Security Rules**: Locked down with content protection
- **Admin Bootstrap**: Secure admin account creation
- **Counter Semantics**: Atomic operations with proper validation
- **Query Alignment**: All queries optimized for composite indexes
- **Input Sanitization**: Comprehensive validation across all endpoints

### 📊 Monitoring & Health

- **Health Check Endpoint**: `/api/health` with database connectivity
- **Admin Audit Logs**: Complete administrative action tracking
- **Error Response Standards**: Consistent error handling and reporting
- **Performance Metrics**: Query optimization and response time monitoring

This backend architecture provides a robust, secure, and scalable foundation for the Learn.ai 4all learning management system, with production-ready features and comprehensive administrative controls.
