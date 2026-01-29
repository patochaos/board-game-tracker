import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "CRUSADE",
    template: "%s | CRUSADE",
  },
  description: "Test your Vampire: The Eternal Struggle card knowledge with CRUSADE. Featuring 5000+ cards, 5 difficulty levels, ranked mode, and global leaderboards.",
  keywords: ["VTES", "Vampire: The Eternal Struggle", "card game", "guessing game", "trivia", "CRUSADE"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CRUSADE - VTES Card Game",
    title: "CRUSADE - Test Your VTES Knowledge",
    description: "How well do you know VTES cards? Play CRUSADE - the ultimate card guessing game for Vampire: The Eternal Struggle players.",
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
    title: "CRUSADE - Test Your VTES Knowledge",
    description: "How well do you know VTES cards? Play CRUSADE - the ultimate card guessing game.",
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
            description: "Test your Vampire: The Eternal Struggle card knowledge. Featuring 5000+ cards, 5 difficulty levels, ranked mode, and global leaderboards.",
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
