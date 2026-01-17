import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Night Tracker",
  description: "Track your board game sessions with friends",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="noise-overlay">
        {children}
      </body>
    </html>
  );
}
