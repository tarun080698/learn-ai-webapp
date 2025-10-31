# Frontend Architecture & Implementation

Learn.ai 4all frontend is a comprehensive **Next.js 16** and **React 19** learning management system with advanced course creation tools, seamless admin interface, and modern user experience.

## Tech Stack

- **Framework**: Next.js 16.0.0 (Turbopack) with App Router
- **React**: 19.2.0 with Concurrent Features and RSC
- **TypeScript**: 5.x with strict type checking
- **Styling**: TailwindCSS v4.1.16 + CSS Custom Properties
- **Authentication**: Firebase Auth (Google OAuth + Email/Password)
- **HTTP Client**: Native `fetch()` with authenticated hooks
- **State Management**: React Context + TanStack Query v5.90.5
- **Form Handling**: React Hook Form v7.65.0 + Zod validation
- **File Uploads**: React Dropzone v14.3.8 with drag-and-drop
- **Drag & Drop**: @dnd-kit v6.3.1 for module/asset reordering
- **Icons**: Heroicons v2.2.0 + FontAwesome Free v6.6.0 (CSS import)
- **Markdown**: @uiw/react-md-editor v4.0.8

## App Router Structure

### Root Layout & Navigation

```
app/
├── layout.tsx                  # Root layout with AuthProvider & fonts
├── page.tsx                    # Landing page with RouteGuard
├── globals.css                 # TailwindCSS + CSS custom properties
└── components/
    ├── Navigation.tsx          # Header with auth state & role-based menu
    └── RouteGuard.tsx          # Route protection & auto-redirects
```

### Authentication Routes

```
app/
├── (auth)/
│   └── AuthProvider.tsx       # Firebase Auth context with session management
├── login/
│   └── page.tsx              # User login (Google OAuth)
└── admin/
    └── login/
        └── page.tsx          # Admin login (email/password)
```

### Public & User Routes

```
app/
├── catalog/
│   └── page.tsx              # Browse published courses (Server Component)
├── courses/
│   └── [courseId]/
│       └── page.tsx          # Course detail with enrollment flow
├── dashboard/
│   └── page.tsx              # User progress & enrollments
└── questionnaires/
    └── page.tsx              # Assessment completion interface
```

### Admin Management Interface

```
app/admin/
├── layout.tsx                # Admin layout with sidebar navigation
├── page.tsx                  # Dashboard with analytics & platform stats
├── login/
│   └── page.tsx              # Admin authentication
├── courses/
│   ├── page.tsx              # Course management dashboard
│   ├── new/
│   │   └── page.tsx          # 4-step course creation wizard
│   └── [courseId]/
│       ├── page.tsx          # Course details & management
│       └── modules/
│           └── page.tsx      # Module management with reordering
├── questionnaires/
│   ├── page.tsx              # Questionnaire template management
│   ├── [questionnaireId]/
│   │   ├── page.tsx          # Questionnaire detail view
│   │   └── edit/
│   │       └── page.tsx      # Questionnaire editor
└── test/
    └── page.tsx              # Admin testing & debugging tools
```

## Authentication System

### AuthProvider Context (`app/(auth)/AuthProvider.tsx`)

- **Firebase Auth Integration**: Real-time auth state with role management
- **Custom Claims**: Admin/user role differentiation
- **Session Persistence**: Automatic token refresh & logout handling
- **Provider Enforcement**: Google OAuth for users, email/password for admins

**Key Features**:

- Authentication state synchronization
- Role-based route protection
- Automatic token refresh
- Logout with cleanup

### Route Protection (`components/RouteGuard.tsx`)

- **Role-based Access**: Admin/user route segregation
- **Authentication Gates**: Redirect unauthenticated users
- **Loading States**: Smooth transitions during auth checks

## Component Architecture

### Core Admin Components

#### Enhanced Course Creation Wizard

**Location**: `components/admin/courses/CreateCourseWizard.tsx`
**Status**: ✅ Production Ready

**4-Step Workflow**:

1. **StepDetails**: Course metadata, description, hero image upload
2. **StepModules**: Module creation with rich content & asset management
3. **StepGating**: Pre/post questionnaire assignment system
4. **StepReview**: Validation, creation, and publishing

**Key Features**:

- Centralized `WizardState` management
- Auto-save with debounced persistence
- Real-time validation with Zod schemas
- Progress sidebar with statistics
- Toast notification system
- Drag-and-drop asset reordering

#### Module Management System

**Location**: `components/admin/courses/ModuleEditor.tsx`
**Content Types**: Video, Text, PDF, Image, Link

**Features**:

- Rich content editing with markdown support
- Multiple asset attachments per module
- Drag-and-drop reordering with @dnd-kit
- Duration estimation and validation
- Preview functionality

#### Questionnaire Management

**Location**: `components/admin/QuestionnaireBuilder.tsx`
**Question Types**: Single/Multi choice, Scale, Text

**Features**:

- Dynamic question builder interface
- Question validation and preview
- Assignment workflow integration
- Template reuse system

### User Interface Components

#### Course Catalog (`app/catalog/page.tsx`)

- **Server Component**: Optimized for SEO and performance
- **Course Cards**: Rich preview with enrollment status
- **Filtering**: Level-based course filtering
- **Responsive Design**: Mobile-optimized grid layout

#### Course Detail Pages (`app/courses/[courseId]/page.tsx`)

- **Progressive Enhancement**: Works without JavaScript
- **Enrollment Flow**: Integrated course enrollment
- **Progress Tracking**: Module-level completion status
- **Assessment Integration**: Pre/post questionnaire gating

#### User Dashboard (`app/dashboard/page.tsx`)

- **Enrollment Management**: Active and completed courses
- **Progress Visualization**: Completion percentages and streak tracking
- **Quick Actions**: Resume course, start assessments

## UI Design System

### CSS Architecture

**Base**: TailwindCSS v4.1.16 with CSS Custom Properties + FontAwesome CSS
**FontAwesome Integration**: Global CSS import via `@import "@fortawesome/fontawesome-free/css/all.css"`

**CSS Variables**:

```css
:root {
  --primary: #2a9d8f; /* Primary brand color */
  --secondary: #264653; /* Secondary/text color */
  --accent: #f4a261; /* Accent highlights */
  --destructive: #e76f51; /* Error/warning states */
  --card: #ffffff; /* Card backgrounds */
  --background: #f8fafc; /* Page backgrounds */
  --primary-10: rgba(42, 157, 143, 0.1); /* Alpha variants */
  /* ... extensive color and shadow variants */
}
```

### Design Patterns

- **Card Components**: Consistent shadow system and border radius
- **Interactive Elements**: Hover effects with smooth transitions
- **Form Controls**: Unified input styling with validation states
- **Loading States**: Skeleton screens and progress indicators
- **Toast Notifications**: Success/error feedback system

### Responsive Design

- **Mobile-First**: Progressive enhancement from mobile to desktop
- **Breakpoints**: Tailwind's responsive utility classes
- **Touch-Friendly**: Appropriate hit targets and gesture support

## State Management

### Client State

- **React Context**: Authentication state and user session
- **Component State**: Form data, UI state, local interactions
- **Custom Hooks**: Reusable stateful logic

### Server State

- **TanStack Query**: API data fetching and caching
- **Optimistic Updates**: Immediate UI feedback with rollback
- **Background Sync**: Automatic data refresh and synchronization

### Custom Hooks

#### `useAuthenticatedFetch`

```typescript
// Location: hooks/useAuthenticatedFetch.ts
// Purpose: Automatic token attachment and error handling
// Features: Retry logic, error boundaries, loading states
```

#### `useFileUpload`

```typescript
// Location: hooks/useFileUpload.ts
// Purpose: Firebase Storage integration with progress tracking
// Features: Drag-and-drop, validation, metadata extraction
```

#### `useQuestionnaires`

```typescript
// Location: hooks/useQuestionnaires.ts
// Purpose: Questionnaire data management and caching
// Features: CRUD operations, template management, assignment workflow
```

## Performance Optimizations

### Code Splitting

- **Route-based**: Automatic code splitting via App Router
- **Component-level**: Dynamic imports for heavy components
- **Vendor Splitting**: Separate chunks for third-party libraries

### Image Optimization

- **Next.js Image**: Automatic WebP conversion and lazy loading
- **Responsive Images**: Multiple breakpoint variants
- **Firebase Storage**: CDN delivery with compression

### Caching Strategy

- **Browser Caching**: Static assets with long expiration
- **API Caching**: TanStack Query with stale-while-revalidate
- **Build Optimization**: Tree shaking and minification

## Development Workflow

### Development Setup

```bash
npm install              # Install dependencies
npm run dev             # Start development server
npm run validate-env    # Validate environment variables
npm run indexes         # Create Firestore indexes
```

### Code Quality

- **ESLint**: Next.js configuration with React best practices
- **TypeScript**: Strict type checking with proper interfaces
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates

### Testing Strategy

- **Manual Testing**: Comprehensive admin workflow testing
- **API Testing**: Endpoint validation via admin interface
- **Browser Testing**: Cross-browser compatibility verification
- **Performance Testing**: Core Web Vitals monitoring

## Integration Points

### Firebase Integration

- **Authentication**: Real-time auth state synchronization
- **Firestore**: Type-safe document operations
- **Storage**: File upload with progress tracking and metadata
- **Admin SDK**: Server-side operations for admin features

### API Communication

- **REST Endpoints**: 65+ endpoints with consistent error handling
- **Request/Response**: Zod schema validation throughout
- **Error Handling**: Structured error responses with user feedback
- **Loading States**: Unified loading indication across components

## Security Implementation

### Client-Side Security

- **Input Validation**: Zod schemas for all form inputs
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Firebase Auth token validation
- **Role Enforcement**: Client-side route protection with server validation

### Authentication Flow

- **Token Management**: Automatic refresh and storage
- **Role Verification**: Server-side role validation
- **Session Security**: Secure token handling and cleanup

## Current Implementation Status

### ✅ Production Ready Features

- **Authentication System**: Complete dual-provider authentication
- **Course Creation Wizard**: 4-step guided course creation with validation
- **Module Management**: Rich content editing with asset management
- **Questionnaire System**: Template creation and assignment workflow
- **User Enrollment**: Complete enrollment and progress tracking
- **Admin Dashboard**: Comprehensive management interface
- **Course Catalog**: Public course browsing with enrollment
- **File Upload System**: Firebase Storage integration with progress tracking
- **Responsive Design**: Mobile-optimized across all interfaces

### 🚧 Enhancement Opportunities

- **Advanced Analytics**: Course completion statistics and user behavior
- **Content Search**: Full-text search across courses and modules
- **Social Features**: User comments and course ratings
- **Accessibility**: Enhanced ARIA support and keyboard navigation
- **Progressive Web App**: Service worker and offline functionality

## File Structure

### Components Organization

```
components/
├── admin/                      # Admin-specific components
│   ├── courses/               # Course management components
│   │   ├── CreateCourseWizard.tsx    # Main course creation wizard
│   │   ├── ModuleEditor.tsx          # Module content editing
│   │   ├── QuestionnaireSelector.tsx # Assessment assignment
│   │   └── steps/                    # Wizard step components
│   ├── AdminLayout.tsx        # Admin interface layout
│   ├── AdminLoginForm.tsx     # Admin authentication form
│   ├── FeaturesOverview.tsx   # Platform features showcase
│   ├── PlatformStats.tsx      # Dashboard statistics
│   └── QuestionnaireBuilder.tsx      # Questionnaire creation
├── ui/                        # Reusable UI components
│   └── Toast.tsx             # Notification system
└── FileUpload.tsx            # File upload with drag-and-drop
```

### Hooks Organization

```
hooks/
├── useAuthenticatedFetch.ts   # Authenticated API requests
├── useFileUpload.ts           # File upload with Firebase Storage
└── useQuestionnaires.ts       # Questionnaire data management
```

This frontend architecture provides a robust, scalable, and maintainable foundation for the Learn.ai 4all learning management system, with production-ready features and clear paths for future enhancements.
