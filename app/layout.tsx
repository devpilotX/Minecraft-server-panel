import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const APP_NAME = "DevPilotX";
const APP_DESCRIPTION =
  "The most powerful self-hosted Minecraft server panel ever built.";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#05080f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-base font-display text-text-primary antialiased">
        <QueryProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              unstyled: false,
              classNames: {
                toast:
                  "bg-elevated border border-border-subtle rounded-md shadow-card text-text-primary",
                title: "text-text-primary font-medium text-sm",
                description: "text-text-secondary text-xs",
                actionButton:
                  "bg-accent-blue text-white text-xs font-medium rounded-md px-3 py-1.5",
                cancelButton:
                  "text-text-secondary text-xs font-medium",
                closeButton: "text-text-tertiary hover:text-text-secondary",
                success: "border-l-2 border-l-accent-green",
                error: "border-l-2 border-l-accent-red",
                warning: "border-l-2 border-l-accent-amber",
                info: "border-l-2 border-l-accent-blue",
              },
            }}
            richColors={false}
            closeButton
            duration={4000}
          />
        </QueryProvider>
      </body>
    </html>
  );
}