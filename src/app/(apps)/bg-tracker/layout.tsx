import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Board Game Tracker",
    template: "%s | Board Game Tracker",
  },
  description: "Track your board game collection and gaming sessions. Log plays, track wins, and see who dominates game night.",
  keywords: ["board games", "game tracker", "collection management", "game night", "tabletop"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Board Game Tracker",
    title: "Board Game Tracker - Log Your Game Nights",
    description: "Track your board game collection and gaming sessions with friends.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Board Game Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Board Game Tracker",
    description: "Track your board game collection and gaming sessions.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/dashboard",
  },
};

export default function BgTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Board Game Tracker",
            applicationCategory: "Utility",
            operatingSystem: "Web",
            url: "https://board-game-tracker-78pn.vercel.app/dashboard",
            description: "Track your board game collection and gaming sessions. Log plays, track wins, and see who dominates game night.",
            browserRequirements: "Requires JavaScript. Requires modern web browser.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            author: {
              "@type": "Person",
              name: "Patricio",
            },
          }),
        }}
      />
      {children}
    </>
  );
}
