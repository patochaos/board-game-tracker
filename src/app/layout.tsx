import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://board-game-tracker-78pn.vercel.app"
  ),
  title: {
    default: "Salty Meeples",
    template: "%s | Salty Meeples",
  },
  description: "Track your board game sessions with friends. Log plays, compare stats, and crown the saltiest meeple in your group.",
  keywords: ["board games", "game night", "tracking", "sessions", "leaderboard", "BGG", "BoardGameGeek", "meeples"],
  authors: [{ name: "Patricio" }],
  creator: "Patricio",
  publisher: "Patricio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Salty Meeples",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Salty Meeples",
    title: "Salty Meeples",
    description: "Track your board game sessions with friends. Log plays, compare stats, and crown the saltiest meeple in your group.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Salty Meeples",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salty Meeples",
    description: "Track your board game sessions with friends. Log plays, compare stats, and crown the saltiest meeple in your group.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Salty Meeples",
              url: "https://board-game-tracker-78pn.vercel.app",
              description: "Track your board game sessions with friends. Log plays, compare stats, and crown the saltiest meeple in your group.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://board-game-tracker-78pn.vercel.app/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="noise-overlay">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
