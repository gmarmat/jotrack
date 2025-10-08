import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}

