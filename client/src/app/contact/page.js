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
  return <ContactClient />;
}
