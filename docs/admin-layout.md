# Admin Layout Documentation

## Overview

The admin section now uses a centralized layout system that provides consistent navigation and styling across all admin pages.

## Architecture

### AdminLayout Component

Located at: `components/admin/AdminLayout.tsx`

Features:

- Responsive navigation header with admin branding
- User dropdown with profile info and sign-out functionality
- Mobile-responsive navigation menu
- Consistent styling using CSS variables
- Automatic active navigation highlighting

### Layout Structure

```
/admin (layout.tsx) - Applies AdminLayout to all admin pages except login
├── /admin/login - Standalone login page (no layout)
├── /admin (page.tsx) - Dashboard
├── /admin/courses/new - Course creation wizard
├── /admin/courses - Course management
└── /admin/questionnaires - Questionnaire management
```

### Navigation Items

The navigation includes:

1. **Dashboard** - Main admin overview (`/admin`)
2. **Create Course** - Course creation wizard (`/admin/courses/new`)
3. **Courses** - Course management (`/admin/courses`)
4. **Questionnaires** - Questionnaire management (`/admin/questionnaires`)

### User Menu

The user dropdown provides:

- User avatar (shows first letter of name/email)
- User name and email display
- Sign out functionality with proper redirect to main app

## Implementation Details

### CSS Variables Used

- `--card` - Background for header
- `--secondary-15` - Border colors
- `--secondary` - Text colors
- `--accent` - Active states and highlights
- `--primary` - User avatar background
- `--destructive` - Sign out button hover state

### Responsive Design

- Desktop: Full horizontal navigation
- Mobile: Hamburger menu with collapsible navigation

### Authentication Integration

- Uses `useAuth` hook for user management
- Automatic redirect on sign out
- Conditional rendering based on auth state

## Usage

### Adding New Admin Pages

1. Create page in `/app/admin/` directory
2. The layout will automatically apply AdminLayout
3. No need to wrap content in AdminLayout component

### Excluding Pages from Layout

Add path check in `/app/admin/layout.tsx`:

```tsx
if (pathname === "/admin/your-special-page") {
  return children;
}
```

### Navigation Updates

Modify `navItems` array in `AdminLayout.tsx`:

```tsx
const navItems = [
  {
    href: "/admin/new-section",
    label: "New Section",
    exact: false,
  },
  // ...
];
```

## Styling Notes

The layout uses the existing CSS variable system for consistency with the rest of the application. All interactive elements include proper hover states and transitions.

## Migration Notes

Previous admin pages that manually included `<AdminLayout>` components have been updated to remove the wrapper since it's now handled at the layout level.
