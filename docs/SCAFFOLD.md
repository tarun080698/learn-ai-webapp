# Learn AI - MVP Scaffold (Phase 1 - Plan 0)

## Project Structure

This is a Next.js 16.0.0 TypeScript application with React 19, Tailwind CSS v4, and Firebase integration. The project uses the App Router exclusively.

### Directory Structure

```
app/
├── layout.tsx              # Root layout with Tailwind v4
├── page.tsx                # Welcome page with navigation
├── (public)/
│   └── page.tsx            # Public course catalog (TODO)
├── dashboard/
│   └── page.tsx            # Student dashboard (TODO)
├── admin/
│   └── page.tsx            # Admin panel (TODO)
└── api/
    ├── health/route.ts     # Health check endpoint
    ├── enroll/route.ts     # Course enrollment
    ├── progress/route.ts   # Progress tracking
    ├── auth/
    │   └── mark-login/route.ts  # Login event tracking
    ├── questionnaires/
    │   ├── context/route.ts     # Questionnaire context
    │   ├── start/route.ts       # Start questionnaire
    │   └── submit/route.ts      # Submit questionnaire
    └── admin/
        ├── course.upsert/route.ts
        ├── course.publish/route.ts
        ├── module.upsert/route.ts
        ├── questionnaire.upsert/route.ts
        └── assignment.upsert/route.ts

lib/
├── firebaseClient.ts       # Firebase client SDK
├── firebaseAdmin.ts        # Firebase Admin SDK
├── auth.ts                 # Authentication helpers
├── firestore.ts           # Firestore utilities
└── schemas.ts             # Zod validation schemas

types/
└── models.ts              # TypeScript interfaces

styles/
└── globals.css            # Tailwind v4 base styles

middleware.ts              # Route middleware (Basic Auth commented)
```

## Environment Variables

### Required (Client)

```
NEXT_PUBLIC_FB_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FB_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FB_PROJECT_ID=your_project_id
NEXT_PUBLIC_FB_STORAGE_BUCKET=your_project.appspot.com
```

### Required (Server)

```
FB_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account",...}
ADMIN_ALLOWLIST=admin1@example.com,admin2@example.com
ADMIN_USER=admin
ADMIN_PASS=secure_password
```

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env.local`** with the environment variables above

3. **Run development server:**

   ```bash
   npm run dev
   ```

4. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"ok":true,"version":"plan-0"}`

## API Endpoints

All API endpoints return JSON responses:

### Public Endpoints

- `GET /api/health` - Health check

### Authenticated Endpoints (require Bearer token)

- `POST /api/enroll` - Enroll in course
- `POST /api/progress` - Update learning progress
- `POST /api/auth/mark-login` - Track login events
- `GET /api/questionnaires/context` - Get questionnaire context
- `POST /api/questionnaires/start` - Start questionnaire
- `POST /api/questionnaires/submit` - Submit questionnaire responses

### Admin Endpoints (require admin privileges)

- `POST /api/admin/course.upsert` - Create/update course
- `POST /api/admin/course.publish` - Publish course
- `POST /api/admin/module.upsert` - Create/update module
- `POST /api/admin/questionnaire.upsert` - Create/update questionnaire
- `POST /api/admin/assignment.upsert` - Create/update assignment

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication and Firestore
3. Generate service account key
4. Set up collections as defined in `lib/firestore.ts`

## Development Notes

- All API routes currently return `{"ok": true, "todo": "implement"}`
- Authentication is stubbed but functional
- Database schemas are placeholder structures
- Admin middleware is commented out (Basic Auth)

## Build & Deploy

```bash
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## TODOs

See individual files for specific TODOs. Major items:

- Implement business logic in API routes
- Complete Zod schemas and TypeScript interfaces
- Add proper error handling
- Implement Firebase collections structure
- Add proper authentication UI
- Replace Basic Auth with Firebase custom claims

---

_This scaffold provides the foundation for Phase 1 development. All endpoints are functional stubs ready for implementation._
