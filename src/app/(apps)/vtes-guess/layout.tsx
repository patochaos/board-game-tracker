import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "CRUSADE",
    template: "%s | CRUSADE",
  },
  description: "Master Jyhad with CRUSADE - the ultimate VTES card recognition game. 5000+ cards from Vampire: The Eternal Struggle, 5 difficulty tiers, ranked mode with global leaderboards.",
  keywords: ["VTES", "Vampire: The Eternal Struggle", "card game", "guessing game", "trivia", "CRUSADE", "Jyhad", "CCG"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CRUSADE - VTES Card Game",
    title: "CRUSADE - How Well Do You Know VTES?",
    description: "Test your Vampire: The Eternal Struggle mastery. 5000+ cards, timed challenges, global rankings. Can you survive Gehenna?",
    images: [
      {
        url: "/og-crusade.png",
        width: 1200,
        height: 630,
        alt: "CRUSADE - VTES Card Guessing Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CRUSADE - How Well Do You Know VTES?",
    description: "Test your Vampire: The Eternal Struggle mastery. 5000+ cards, timed challenges, global rankings.",
    images: ["/twitter-crusade.png"],
  },
  alternates: {
    canonical: "/vtes-guess",
  },
};

export default function CrusadeLayout({
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
            name: "CRUSADE",
            applicationCategory: "Game",
            operatingSystem: "Web",
            url: "https://praxis-seizure.vercel.app/vtes-guess",
            description: "Master Jyhad with CRUSADE - the ultimate VTES card recognition game. 5000+ cards, 5 difficulty tiers, timed ranked challenges, and global leaderboards.",
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
