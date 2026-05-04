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
  return <HomeClient />;
}
