# Learn AI - Interactive Learning Platform

A comprehensive learning management system built with Next.js 16 and Firebase, featuring course enrollment, progress tracking, and questionnaire-based assessments.

## Overview

Learn AI is a modern web application that provides:

- **Course Management**: Create and publish interactive courses with modules
- **User Enrollment**: Track progress through courses with completion metrics
- **Assessment System**: Pre/post questionnaires with quiz scoring and gating
- **Admin Dashboard**: Complete course and user management interface
- **Role-based Access**: Separate user and admin experiences

## Tech Stack

### Frontend

- **Next.js 16.0.0**: React framework with App Router
- **React 19.2.0**: Modern React with latest features
- **TypeScript**: Full type safety throughout
- **TailwindCSS v4**: Utility-first styling framework

### Backend

- **Firebase Auth**: Authentication with Google OAuth and email/password
- **Firebase Firestore**: NoSQL document database
- **Firebase Admin SDK**: Server-side operations and security
- **Zod**: Schema validation for API requests/responses

### Infrastructure

- **Vercel**: Deployment and hosting platform
- **Firebase Console**: Database and authentication management
- **Node.js**: Runtime environment

## Directory Structure

```
learn-ai/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Authentication providers
│   ├── admin/                  # Admin dashboard and login
│   ├── api/                    # Backend API routes
│   ├── catalog/                # Course catalog (public)
│   ├── components/             # Shared React components
│   ├── dashboard/              # User dashboard
│   ├── login/                  # User authentication
│   ├── questionnaires/         # Assessment interface
│   ├── layout.tsx              # Root layout with auth
│   └── page.tsx               # Landing page
├── docs/                       # Documentation
│   ├── backend.md              # API reference
│   ├── database.md             # Firestore schema
│   └── frontend.md             # UI implementation status
├── lib/                        # Shared utilities
│   ├── auth.ts                 # Authentication helpers
│   ├── firebaseAdmin.ts        # Firebase server config
│   ├── firebaseClient.ts       # Firebase client config
│   ├── firestore.ts            # Database utilities
│   └── schemas.ts              # Zod validation schemas
├── types/                      # TypeScript definitions
│   └── models.ts               # Database model interfaces
├── public/                     # Static assets
├── styles/                     # Global CSS
└── scripts/                    # Build and utility scripts
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
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}

# Firebase Admin SDK (private)
FB_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"..."}

# Optional: Admin bootstrap key
ADMIN_BOOTSTRAP_KEY=your-secure-bootstrap-key
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

## Key Features

### Course Management

- Create and edit course templates
- Add modules with various content types (video, text, PDF, links)
- Publish/unpublish courses
- Track module completion and progress

### Assessment System

- Create questionnaire templates (surveys, quizzes, mixed)
- Assign questionnaires to courses or specific modules
- Pre/post course and module gating requirements
- Automatic scoring for quiz-type questionnaires

### Progress Tracking

- Individual module completion tracking
- Course-level progress percentages
- Learning streak calculation
- Enrollment history and statistics

### Admin Features

- User role management
- Course and module administration
- Questionnaire template creation
- Assignment workflow management
- Database seeding and testing tools

## API Documentation

The platform provides comprehensive REST APIs:

- **Authentication**: `/api/auth/*` - Login, session management
- **Course Catalog**: `/api/catalog` - Public course listings
- **Enrollment**: `/api/enroll` - Course enrollment workflow
- **Progress**: `/api/progress` - Module completion tracking
- **Questionnaires**: `/api/questionnaires/*` - Assessment workflow
- **Admin**: `/api/admin/*` - Management operations

For complete API documentation, see [`docs/backend.md`](docs/backend.md).

## Database Schema

The platform uses Firebase Firestore with the following collections:

- **courses**: Course templates and metadata
- **courseModules**: Individual learning modules
- **users**: User profiles and authentication data
- **enrollments**: User course registrations
- **progress**: Module completion tracking
- **questionnaires**: Assessment templates
- **questionnaireAssignments**: Course/module assignments
- **questionnaireResponses**: User assessment responses

For detailed schema documentation, see [`docs/database.md`](docs/database.md).

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

## Contributing

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Implement feature with tests
3. **Run Validation**: `npm run validate`
4. **Submit PR**: Create pull request with description

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow Next.js and React best practices
- **Formatting**: Consistent code formatting with Prettier
- **API Design**: RESTful endpoints with proper HTTP status codes

### Testing Strategy

- **API Testing**: Use cURL or Postman for endpoint testing
- **Frontend Testing**: Manual testing with different user roles
- **Database Testing**: Validate Firestore rules and indexes
- **Integration Testing**: End-to-end user workflow testing

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
