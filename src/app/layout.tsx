import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming like Native App
  themeColor: "#0f172a", // Match slate-900
};

export const metadata: Metadata = {
  title: "AI Finance Tracker",
  description: "Track your finances with AI",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "bg-black min-h-screen text-slate-100")}>
        <AuthProvider>
          {/* Max-w-md restricts view on desktop to look like mobile */}
          <main className="max-w-md mx-auto bg-slate-900 min-h-screen relative shadow-2xl shadow-slate-900/50 overflow-hidden flex flex-col border-x border-slate-800">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
