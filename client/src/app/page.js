import HomeClient from "./HomeClient";

export const metadata = {
  title: "Nutry Bites — Healthy Roasted Makhana & Fox Nuts Snacks",
  description: "Discover Nutry Bites: India's favorite destination for premium oil-free roasted Makhana. Crunchy, delicious, and guilt-free healthy snacks for every occasion.",
  keywords: ["roasted makhana", "healthy snacks india", "fox nuts", "oil-free snacks", "diet friendly snacks", "nutry bites"],
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Nutry Bites",
    "url": "https://nutrybites.co.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://nutrybites.co.in/products?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
