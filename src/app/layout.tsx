import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#8a0303",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://board-game-tracker-78pn.vercel.app"
  ),
  title: {
    default: "Game Night Tracker",
    template: "%s | Game Night",
  },
  description: "Track your board game sessions with friends. Features CRUSADE - the VTES card guessing game, and Praxis Seizure deck tracker.",
  keywords: ["board games", "VTES", "Vampire: The Eternal Struggle", "card game", "deck tracker", "game night", "tracking"],
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
    title: "CRUSADE",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Game Night Tracker",
    title: "Game Night Tracker",
    description: "Track your board game sessions with friends. Features CRUSADE - the VTES card guessing game.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Game Night Tracker - CRUSADE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Game Night Tracker",
    description: "Track your board game sessions with friends. Features CRUSADE - the VTES card guessing game.",
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
              name: "Game Night Tracker",
              url: "https://praxis-seizure.vercel.app",
              description: "Track your board game sessions with friends. Features CRUSADE - the VTES card guessing game, and Praxis Seizure deck tracker.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://praxis-seizure.vercel.app/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="noise-overlay">
        {children}
      </body>
    </html>
  );
}
