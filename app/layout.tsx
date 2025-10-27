import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "./(auth)/AuthProvider";

export const metadata: Metadata = {
  title: "Learn AI",
  description:
    "AI Learning Platform - Interactive courses and personalized learning paths",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
