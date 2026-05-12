import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact Us | Nutry Bites — Support & Inquiries",
  description: "Have questions about our healthy snacks? Get in touch with Nutry Bites. Reach out for support, bulk orders, or feedback. We're here to help you snack better.",
  keywords: ["contact nutry bites", "customer support", "bulk makhana orders", "snack inquiries"],
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Us | Nutry Bites",
    "description": "Have questions about our healthy snacks? Get in touch with Nutry Bites.",
    "url": "https://nutrybites.co.in/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "Nutry Bites",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "-6/7 A, ACHARYYA JADADISH CHANDRA BOSE ROAD",
        "addressLocality": "KOLKATA",
        "addressRegion": "West Bengal",
        "postalCode": "700017",
        "addressCountry": "IN"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+91 8910072220",
          "contactType": "customer service"
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactClient />
    </>
  );
}
