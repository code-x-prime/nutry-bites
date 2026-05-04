import CategoriesClient from "./CategoriesClient";

export const metadata = {
  title: "Shop by Category | Nutry Bites — Healthy Snack Varieties",
  description: "Browse through our wide range of healthy snack categories. From classic salted to gourmet peri-peri makhana, find your favorite flavor at Nutry Bites.",
  keywords: ["makhana categories", "healthy snack varieties", "roasted fox nuts flavors", "nutry bites shop"],
  alternates: {
    canonical: "/categories",
  },
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}
