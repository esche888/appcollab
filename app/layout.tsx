import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppCollab - Hackathon Project Collaboration",
  description: "Find collaborators and fill skill gaps in your hackathon projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
