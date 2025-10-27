import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "./(auth)/AuthProvider";

export const metadata: Metadata = {
  title: "Learn AI",
  description: "MVP scaffold",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <div className="max-w-6xl mx-auto p-4">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
