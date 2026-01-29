import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Praxis Seizure",
    template: "%s | Praxis Seizure",
  },
  description: "Manage your VTES decks, track game sessions, and view statistics with Praxis Seizure - the ultimate Vampire: The Eternal Struggle companion app.",
  keywords: ["VTES", "Vampire: The Eternal Struggle", "deck tracker", "card game", "Praxis Seizure", "statistics"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Praxis Seizure - VTES Tracker",
    title: "Praxis Seizure - VTES Deck Tracker",
    description: "Manage your VTES decks, track game sessions, and dominate the Jyhad with Praxis Seizure.",
    images: [
      {
        url: "/og-praxis.png",
        width: 1200,
        height: 630,
        alt: "Praxis Seizure - VTES Deck Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Praxis Seizure - VTES Deck Tracker",
    description: "Manage your VTES decks, track game sessions, and dominate the Jyhad.",
    images: ["/twitter-praxis.png"],
  },
  alternates: {
    canonical: "/vtes",
  },
};

export default function PraxisLayout({
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
            name: "Praxis Seizure",
            applicationCategory: "Utility",
            operatingSystem: "Web",
            url: "https://praxis-seizure.vercel.app/vtes",
            description: "Manage your VTES decks, track game sessions, and view statistics. The ultimate Vampire: The Eternal Struggle companion app.",
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
