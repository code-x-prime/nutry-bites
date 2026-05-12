import AboutClient from "./AboutClient";

export const metadata = {
  title: "About Us | Nutry Bites — Our Story & Mission",
  description: "Learn about Nutry Bites' journey to bring premium, oil-free roasted Makhana to India. Discover our mission to replace junk food with wholesome superfoods.",
  keywords: ["about nutry bites", "healthy snacking india", "makhana brand mission", "roasted snacks story"],
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Us | Nutry Bites",
    "description": "Learn about Nutry Bites' journey to bring premium, oil-free roasted Makhana to India.",
    "url": "https://nutrybites.co.in/about"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutClient />
    </>
  );
}
