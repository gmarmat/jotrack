import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "./components/ToastProvider";

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
    <html lang="en">
      <body className="min-h-screen">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

