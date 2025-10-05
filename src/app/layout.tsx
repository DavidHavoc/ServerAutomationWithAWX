import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Server Automation Platform",
  description: "Manage and automate your server infrastructure with ease",
  keywords: ["Server Automation", "SSH", "DevOps", "Infrastructure", "Management"],
  authors: [{ name: "Server Automation Team" }],
  openGraph: {
    title: "Server Automation Platform",
    description: "Manage and automate your server infrastructure",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Server Automation Platform",
    description: "Manage and automate your server infrastructure",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
