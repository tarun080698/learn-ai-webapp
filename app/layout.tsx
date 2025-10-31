import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./(auth)/AuthProvider";
import { Inter, Poppins } from "next/font/google";
import "@/lib/fontawesome";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: "Learn.ai 4all",
  description:
    "AI Learning Platform - Interactive courses and personalized learning paths",
  manifest: "/site.webmanifest",
  themeColor: "#000000", // update to your brand color
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
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
      <Analytics />
      <SpeedInsights />
    </html>
  );
}
