# Learn.ai 4all - Interactive Learning Platform

A comprehensive **Next.js 16** and **React 19** learning management system with advanced course creation tools, seamless admin interface, and modern user experience. Built with Firebase backend and production-ready architecture.

## Overview

Learn.ai 4all is a modern learning management system that provides:

- **Advanced Course Creation**: 4-step wizard with rich content editing and asset management
- **Course Catalog**: Public browsing with enrollment capabilities and progress tracking
- **Assessment System**: Pre/post questionnaires with automated scoring and gating logic
- **Admin Dashboard**: Comprehensive platform management with audit trails
- **User Progress Tracking**: Module-level completion with streak calculation
- **Role-based Access Control**: Secure separation between users and administrators
- **File Management**: Firebase Storage integration with drag-and-drop uploads
- **Real-time Updates**: Live progress tracking and enrollment status

## Production Status

### ✅ Production Ready Features

- **Authentication System**: Dual-provider auth (Google OAuth + Email/Password)
- **Course Creation Wizard**: 4-step guided workflow with auto-save and validation
- **Module Management**: Rich content editing with multiple asset types
- **Assessment Workflow**: Complete questionnaire lifecycle with assignment logic
- **User Enrollment**: Idempotent enrollment with progress tracking
- **Admin Interface**: Comprehensive management dashboard with audit logging
- **API System**: 65+ REST endpoints with comprehensive validation
- **File Upload System**: Firebase Storage with progress tracking and validation
- **Security Hardening**: Input validation, access control, and audit trails
- **Performance Optimization**: Composite indexes and denormalized counters

## Tech Stack

- **Framework**: Next.js 16.0.0 (Turbopack) with App Router and Server Components
- **Frontend**: React 19.2.0 with TypeScript 5.x and TailwindCSS v4.1.16
- **Backend**: Firebase Firestore + Admin SDK v13.5.0 with 65+ API endpoints
- **Authentication**: Firebase Auth (Google OAuth + Email/Password)
- **File Storage**: Firebase Storage with organized paths and CDN delivery
- **Validation**: Zod v4.1.12 schemas for all API requests and responses
- **State Management**: React Context + TanStack Query v5.90.5
- **UI Components**: Custom components with CSS custom properties + FontAwesome Free v6.6.0
- **Development**: TypeScript strict mode, ESLint 9, automated testing

## Quick Start

### Prerequisites

- Node.js 20+
- Firebase project with Firestore enabled
- Environment variables configured (see `.env.example`)

### Development Setup

```bash
# Install dependencies
npm install

# Validate environment configuration
npm run validate-env

# Create required Firestore indexes
npm run indexes

# Start development server
npm run dev
```

### Project Structure

```
learn-ai/
├── app/                        # Next.js App Router
│   ├── admin/                  # Admin dashboard (courses, questionnaires, users)
│   ├── api/                    # Backend API routes (65+ endpoints)
│   ├── catalog/                # Public course browsing
│   ├── courses/[courseId]/     # Course detail pages with enrollment
│   └── dashboard/              # User progress and enrollments
├── components/                 # React components and UI elements
├── lib/                        # Utilities (auth, database, validation)
├── types/                      # TypeScript definitions and interfaces
└── hooks/                      # Custom React hooks for data fetching
```

## Key Features

### Course Creation & Management

- **4-Step Creation Wizard**: Guided course creation with validation and auto-save
- **Rich Module Editor**: Support for video, text, PDF, image, and link content
- **Asset Management**: Drag-and-drop file uploads with Firebase Storage
- **Publishing Workflow**: Draft → Review → Publish with visibility controls

### Assessment System

- **Questionnaire Builder**: Create surveys, quizzes, and assessments
- **Flexible Assignment**: Pre/post course and module-level questionnaires
- **Automated Scoring**: Quiz scoring with percentage-based results
- **Gating Logic**: Progress blocking until assessments are completed

### User Experience

- **Course Catalog**: Public browsing with enrollment capabilities
- **Progress Tracking**: Module-level completion with visual indicators
- **Streak Tracking**: Daily login streaks for user engagement
- **Responsive Design**: Mobile-optimized interface throughout

### Admin Dashboard

- **Platform Analytics**: Course completion rates and user engagement
- **Audit Logging**: Comprehensive tracking of all administrative actions
- **User Management**: Role assignments and account oversight
- **Content Moderation**: Archive/unarchive courses and questionnaires

## Authentication System

### Dual-Provider Authentication

- **Users**: Google OAuth with automatic registration
- **Admins**: Email/password with secure bootstrap system
- **Role-Based Access**: Server-side validation with custom claims
- **Session Management**: Firebase Auth with token refresh and validation

## Environment Setup

### Required Environment Variables

Create `.env.local` with the following configuration:

```bash
# Firebase Client Configuration (public)
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}

# Firebase Admin SDK (private)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin Bootstrap (optional but recommended)
ADMIN_BOOTSTRAP_KEY=your-secure-bootstrap-key

# Storage Configuration
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### Database Initialization

The system requires specific Firestore indexes for optimal performance:

```bash
# Create required composite indexes
npm run indexes

# Validate environment configuration
npm run validate-env

# Check API health status
npm run status
```

### Creating First Admin User

Bootstrap your first admin account using the secure endpoint:

```bash
curl -X POST http://localhost:3000/api/dev/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-key: your-secure-bootstrap-key" \
  -d '{"email":"admin@example.com","password":"securepassword","name":"Admin User"}'
```

### Quick Start Commands

```bash
# Install dependencies and start development
npm install && npm run dev

# Initialize database indexes
npm run indexes

# Validate configuration
npm run validate-env

# Check system health
npm run status
```

## Migration & Deployment

### Data Migration Scripts

When upgrading, you may need to run migration scripts:

```bash
# Questionnaire Options Migration (v1.0 → v2.0)
npx tsc --build && node scripts/migrate-questionnaire-options.js

# Complete system migration test
./scripts/complete-phase2-test.ps1
```

### Production Deployment

1. Configure production Firebase project
2. Deploy Firestore security rules: `firebase deploy --only firestore:rules`
3. Set production environment variables
4. Deploy to your hosting platform (Vercel, Netlify, etc.)

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

### Enhanced Admin Capabilities

- **Complete Course Overview**: Admin dashboard now shows all courses in the system (not just owned courses)
- **Advanced Filtering**: Support for viewing courses regardless of publication or archive status
- **Enhanced API**: `/api/admin/courses.mine` supports `?all=true` parameter for system-wide visibility
- **Comprehensive Statistics**: Real course counts and engagement metrics across the entire platform
- **FontAwesome Integration**: Professional icon system with CSS loading for consistent UI
- **Cursor Interactions**: Enhanced user experience with proper hover states across all interactive elements

## API Documentation

The platform provides 65+ REST API endpoints organized by functionality:

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

### UI/UX Enhancements ✅

- **FontAwesome Integration**: Added FontAwesome Free v6.6.0 with CSS import for professional icons
- **Unified Styling**: Consistent design system across public and admin interfaces using CSS custom properties
- **Enhanced Public Pages**: Updated landing page, catalog, course details with modern styling
- **Cursor Interactions**: Added cursor pointer states across all interactive elements
- **Floating Animations**: AI-themed floating cards in hero section with staggered animations
- **Enhanced Course Display**: Landing page shows 3 latest courses with proper enrollment actions

### Admin Dashboard Improvements ✅

- **Complete System Visibility**: Admin dashboard now displays all courses in the system (9 instead of 3)
- **Enhanced API Support**: `/api/admin/courses.mine?all=true` parameter for comprehensive course management
- **Improved Statistics**: Accurate course counts and platform-wide metrics
- **Better Course Management**: View and manage all courses regardless of owner or archive status

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
