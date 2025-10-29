# Learn AI - Interactive Learning Platform

A comprehensive learning management system built with Next.js 16 and Firebase, featuring course enrollment, progress tracking, questionnaire-based assessments, and complete course detail functionality.

## Overview

Learn AI is a modern web application that provides:

- **Course Management**: Create and publish interactive courses with modules
- **Course Catalog**: Public browsing of available courses with enrollment capability
- **Course Details**: Comprehensive course pages with module listings and enrollment flow
- **User Enrollment**: Track progress through courses with completion metrics
- **Assessment System**: Pre/post questionnaires with quiz scoring and gating
- **Admin Dashboard**: Complete course and user management interface
- **Role-based Access**: Separate user and admin experiences
- **Progress Tracking**: Module-level completion tracking with streak calculation

## Current Features Status

### ✅ Fully Implemented

- **Authentication System**: Google OAuth for users, email/password for admins
- **Course Management**: Full CRUD operations for courses and modules
- **Course Catalog**: Public course browsing with enrollment status
- **Course Detail Pages**: Comprehensive course information with enrollment flow
- **Module Management**: Content creation with multiple content types (video, text, PDF, link)
- **Questionnaire System**: Template creation, assignment, and response collection
- **Enrollment System**: Idempotent enrollment with gating requirements
- **Progress Tracking**: Module completion with automatic progress calculation
- **Admin Dashboard**: Course, module, and questionnaire management interfaces
- **API System**: Complete REST API with 25+ endpoints

### 🚧 Partially Implemented

- **Public Landing Page**: Placeholder implementation (catalog page serves this purpose)
- **User Dashboard**: Basic functionality implemented
- **Assignment Management**: Backend complete, some UI components pending

### ❌ Not Yet Implemented

- **Course Deletion**: API endpoint missing (UI placeholder exists)
- **User Role Management**: Promotion of users to admin role
- **Advanced Analytics**: Course completion statistics and reporting

## Tech Stack

### Frontend

- **Next.js 16.0.0**: React framework with App Router and Server Components
- **React 19.2.0**: Modern React with concurrent features
- **TypeScript 5.x**: Full type safety throughout the application
- **TailwindCSS v4.1**: Utility-first styling with modern CSS features

### Backend

- **Firebase Auth**: Authentication with Google OAuth and email/password
- **Firebase Firestore**: NoSQL document database with composite indexes
- **Firebase Admin SDK 13.5**: Server-side operations and security rules
- **Zod 4.1**: Runtime schema validation for API requests/responses

### Development & Deployment

- **Vercel**: Deployment and hosting platform with automatic deployments
- **Firebase Console**: Database and authentication management
- **Node.js 20+**: Runtime environment with modern JavaScript features
- **ESLint 9**: Code linting with Next.js configuration

## Directory Structure

```
learn-ai/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Authentication providers and context
│   ├── (public)/               # Public routes (placeholder)
│   ├── admin/                  # Admin dashboard and management
│   │   ├── courses/            # Course management with module editing
│   │   ├── new/                # Course creation interface
│   │   ├── questionnaires/     # Questionnaire template management
│   │   └── layout.tsx         # Admin-specific layout
│   ├── api/                    # Backend API routes (25+ endpoints)
│   │   ├── admin/              # Admin-only operations (14 endpoints)
│   │   ├── auth/               # Authentication management
│   │   ├── courses/            # Course detail API (new)
│   │   ├── questionnaires/     # Assessment workflow (7 endpoints)
│   │   └── [various]/          # Enrollment, progress, catalog APIs
│   ├── catalog/                # Public course catalog
│   ├── components/             # Shared React components
│   ├── courses/                # Course detail pages (new)
│   │   └── [courseId]/         # Dynamic course pages with enrollment
│   ├── dashboard/              # User dashboard and progress
│   ├── login/                  # User authentication pages
│   ├── questionnaires/         # Assessment interface
│   ├── layout.tsx              # Root layout with AuthProvider
│   └── page.tsx               # Landing page
├── docs/                       # Comprehensive documentation
│   ├── backend.md              # Complete API reference
│   ├── database.md             # Firestore schema documentation
│   └── frontend.md             # UI implementation status
├── lib/                        # Shared utilities and configurations
│   ├── auth.ts                 # Authentication helpers and middleware
│   ├── firebaseAdmin.ts        # Firebase server configuration
│   ├── firebaseClient.ts       # Firebase client configuration
│   ├── firestore.ts            # Database utilities and constants
│   └── schemas.ts              # Zod validation schemas
├── types/                      # TypeScript definitions
│   └── models.ts               # Database model interfaces
├── public/                     # Static assets
├── styles/                     # Global CSS with TailwindCSS
├── scripts/                    # Build and utility scripts
└── hooks/                      # Custom React hooks
```

## Authentication System

### User Authentication

- **Method**: Google OAuth
- **Role**: `user`
- **Access**: Course catalog, enrollments, progress tracking

### Admin Authentication

- **Method**: Email and password
- **Role**: `admin`
- **Access**: Course management, user administration, analytics

### Session Management

- **Tokens**: Firebase ID tokens with custom claims
- **Role Enforcement**: Server-side validation on all API requests
- **Route Protection**: Client-side guards with automatic redirects

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- Firebase service account key

### Environment Variables

Create `.env.local`:

```bash
# Firebase Client Configuration (public)
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}

# Firebase Admin SDK (private)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Admin bootstrap key for creating first admin
ADMIN_BOOTSTRAP_KEY=your-secure-bootstrap-key

# Storage Configuration
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Database Setup

1. **Create Firestore Indexes**:

   ```bash
   npm run indexes
   ```

2. **Deploy Firestore Rules**:

   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Bootstrap Admin Account** (optional):
   ```bash
   curl -X POST http://localhost:3000/api/admin/admins.create \
     -H "x-bootstrap-key: your-secure-bootstrap-key" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"secure-password"}'
   ```

### Migration Scripts

When upgrading from older versions, you may need to run migration scripts:

1. **Questionnaire Options Migration** (v1.0 → v2.0):

   This migrates questionnaires from old string array options to new `{id, label}` format:

   ```bash
   # Compile TypeScript
   npx tsc --build

   # Run migration
   node scripts/migrate-questionnaire-options.js
   ```

   The migration script will:

   - Convert option arrays like `["Excellent", "Good", "Fair"]` to structured objects
   - Generate stable option IDs for existing responses compatibility
   - Preserve correct answer mappings for quiz questions
   - Update questionnaire versions automatically

## Key Features

### Course Management

- **Course Creation**: Full CRUD operations with rich metadata (title, description, duration, difficulty)
- **Module Management**: Support for multiple content types (video, text, PDF, links) with ordering
- **Publishing System**: Cascade publication status from courses to modules
- **Content Upload**: Firebase Storage integration for course images and content
- **Owner Management**: Admin-based ownership model for courses and modules

### Course Discovery & Enrollment

- **Public Catalog**: Browse published courses without authentication
- **Course Detail Pages**: Comprehensive course information with module listings
- **Enrollment Flow**: Streamlined enrollment with authentication requirements
- **Enrollment Status**: Real-time enrollment status tracking across the platform
- **Gating System**: Pre-course questionnaire requirements for enrollment

### Assessment System

- **Template Management**: Create reusable questionnaire templates with versioning
- **Question Types**: Support for single-choice, multiple-choice, scale, and text questions
- **Assignment System**: Assign questionnaires to courses or specific modules with timing control
- **Automatic Scoring**: Quiz scoring with points and percentage calculations
- **Gating Logic**: Pre/post course and module requirements for progression

### Progress Tracking

- **Module Completion**: Individual module completion with timestamps
- **Course Progress**: Automatic calculation of course completion percentages
- **Learning Streaks**: Daily login tracking with current and best streak records
- **Enrollment History**: Complete history of user course enrollments
- **Resume Functionality**: Track last accessed module for easy resumption

### Admin Features

- **Dashboard Interface**: Comprehensive admin interface for all management tasks
- **User Management**: View and manage user accounts with role assignments
- **Content Management**: Course, module, and questionnaire administration
- **Assignment Workflow**: Create and manage questionnaire assignments with gating
- **Development Tools**: Database seeding, content upload, and testing utilities
- **Analytics**: Basic analytics for course and user engagement

## API Documentation

The platform provides 25+ REST API endpoints organized by functionality:

### Public APIs

- **Course Catalog**: `/api/catalog` - Browse published courses
- **Course Details**: `/api/courses/[courseId]` - Comprehensive course information
- **Health Check**: `/api/health` - Service status monitoring

### User APIs (Authentication Required)

- **Authentication**: `/api/auth/*` - Login, session management, user profiles
- **Enrollment**: `/api/enroll` - Course enrollment with idempotency
- **Progress**: `/api/progress` - Module completion tracking
- **User Data**: `/api/enrollments` - Personal enrollment history
- **Questionnaires**: `/api/questionnaires/*` - Assessment workflow (7 endpoints)
- **Module Access**: `/api/modules/access` - Gating and access control

### Admin APIs (Admin Role Required)

- **Course Management**: `/api/admin/course.*` - CRUD operations for courses
- **Module Management**: `/api/admin/module.*` - CRUD operations for modules
- **Questionnaire Management**: `/api/admin/questionnaire.*` - Template management
- **Assignment Management**: `/api/admin/assignment.*` - Questionnaire assignments
- **User Management**: `/api/admin/users/*` - Role management
- **Data Management**: `/api/admin/seed.dev`, `/api/admin/upload` - Development tools

For complete API documentation with request/response examples, see [`docs/backend.md`](docs/backend.md).

## Database Schema

The platform uses Firebase Firestore with the following collections:

### Core Learning Collections

- **courses**: Course templates and metadata with module counts
- **courseModules**: Individual learning modules with content and ordering
- **users**: User profiles with authentication data and streak tracking
- **enrollments**: User course registrations with progress summaries
- **progress**: Module-level completion tracking with timestamps

### Assessment System Collections

- **questionnaires**: Assessment templates with versioning support
- **questionnaireAssignments**: Course/module assignments with gating logic
- **questionnaireResponses**: User assessment responses with scoring

### System Collections

- **loginEvents**: Authentication audit trail for streak calculation
- **idempotentWrites**: Request deduplication for critical operations

### Key Features

- **Composite Indexes**: Optimized queries for course modules, user progress, and assignments
- **Denormalized Data**: Strategic duplication for performance (module counts, progress percentages)
- **Referential Integrity**: Foreign key relationships maintained at application level
- **Gating System**: Pre/post questionnaire requirements for course and module access

For detailed schema documentation with TypeScript interfaces and relationships, see [`docs/database.md`](docs/database.md).

## Deployment

### Vercel Deployment

1. **Connect Repository**: Link GitHub repository to Vercel
2. **Configure Environment Variables**: Add production environment variables
3. **Deploy**: Automatic deployment on git push

### Firebase Configuration

1. **Production Project**: Create separate Firebase project for production
2. **Update Environment Variables**: Use production Firebase configuration
3. **Deploy Rules and Indexes**: Deploy Firestore rules and indexes to production

### Domain Setup

Configure custom domain in Vercel dashboard and update Firebase Auth authorized domains.

## Recent Updates (Latest)

### Course Detail System ✅

- **New API Endpoint**: `/api/courses/[courseId]` for comprehensive course information
- **Course Detail Pages**: Dynamic course pages at `/courses/[courseId]` with enrollment functionality
- **Preview Mode**: Preview pages at `/courses/[courseId]/preview` for course browsing
- **Module Display**: Proper module fetching from `courseModules` collection (corrected from `modules`)
- **Enrollment Integration**: Seamless enrollment flow with authentication handling

### Database Schema Corrections ✅

- **Collection Naming**: Fixed module queries to use correct `courseModules` collection
- **API Alignment**: Aligned public APIs with existing admin API patterns
- **Data Consistency**: Ensured proper data fetching across all course-related endpoints

### Infrastructure Improvements ✅

- **Next.js 16 Compatibility**: Updated for async params handling in dynamic routes
- **Error Handling**: Enhanced error handling for authentication and data fetching
- **Performance**: Optimized queries with proper collection references

## Contributing

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Environment Setup**: Ensure all environment variables are configured
3. **Database Setup**: Run `npm run indexes` to create required Firestore indexes
4. **Run Development**: `npm run dev` for local development server
5. **API Testing**: Test endpoints with cURL or use admin interface
6. **Validation**: `npm run validate` before submitting changes
7. **Submit PR**: Create pull request with detailed description

### Code Standards

- **TypeScript**: Strict type checking with proper interfaces for all data models
- **ESLint**: Follow Next.js and React best practices with current configuration
- **API Design**: RESTful endpoints with consistent error handling and status codes
- **Database**: Follow established patterns for Firestore operations and security

### Testing Strategy

- **API Testing**: Comprehensive cURL examples provided in API documentation
- **Admin Interface**: Test all CRUD operations through admin dashboard
- **User Workflows**: Test enrollment, progress tracking, and questionnaire flows
- **Database Validation**: Verify Firestore rules and composite index requirements
- **Authentication**: Test both user (Google OAuth) and admin (email/password) flows

## Documentation

- **[Backend API Reference](docs/backend.md)**: Complete API documentation
- **[Database Schema](docs/database.md)**: Firestore collections and relationships
- **[Frontend Implementation](docs/frontend.md)**: UI components and status

## Support

For questions or issues:

1. **Check Documentation**: Review relevant documentation files
2. **Check Console**: Look for browser console errors
3. **Firebase Console**: Check Firestore data and authentication
4. **API Testing**: Test endpoints directly with cURL

## License

This project is licensed under the MIT License - see the LICENSE file for details.
