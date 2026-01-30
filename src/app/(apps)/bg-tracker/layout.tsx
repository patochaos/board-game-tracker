import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Salty Meeples",
    template: "%s | Salty Meeples",
  },
  description: "Track your board game sessions with friends. Log plays, compare stats, and crown the saltiest meeple in your group.",
  keywords: ["board games", "game tracker", "collection management", "game night", "tabletop", "meeples"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Salty Meeples",
    title: "Salty Meeples - Track Your Game Nights",
    description: "Track your board game sessions with friends. Log plays, compare stats, and see who dominates.",
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
    description: "Track your board game sessions with friends. Log plays and compare stats.",
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
            name: "Salty Meeples",
            applicationCategory: "Utility",
            operatingSystem: "Web",
            url: "https://board-game-tracker-78pn.vercel.app/dashboard",
            description: "Track your board game sessions with friends. Log plays, compare stats, and crown the saltiest meeple in your group.",
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
