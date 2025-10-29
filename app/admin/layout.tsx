/**
 * Admin Layout
 * Root layout for all admin pages
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children; // Let each page decide if it wants AdminLayout or custom layout
}
