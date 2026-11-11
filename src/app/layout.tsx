import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { SocketProvider } from "@/lib/socket";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pitret SaaS | Social Media Management",
  description: "Manage all your social media accounts from one dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <WorkspaceProvider>
                <SocketProvider>
                  {children}
                  <Toaster position="top-right" />
                </SocketProvider>
              </WorkspaceProvider>
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
