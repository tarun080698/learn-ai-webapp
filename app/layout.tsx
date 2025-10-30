import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./(auth)/AuthProvider";
import { Inter, Poppins } from "next/font/google";
import "@/lib/fontawesome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

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
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning={true}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
