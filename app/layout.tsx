import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";
import { ThemeProvider } from './providers/ThemeProvider';

export const metadata: Metadata = {
  title: "Jotrack",
  description: "Local-first job tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

