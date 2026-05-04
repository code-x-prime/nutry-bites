import ProductsClient from "./ProductsClient";

export const metadata = {
  title: "All Products | Nutry Bites — Premium Healthy Snacks Collection",
  description: "Shop all Nutry Bites products. Premium roasted makhana, healthy fox nuts, and oil-free snacks designed for your wellness journey. Fast delivery across India.",
  keywords: ["all healthy snacks", "buy makhana online", "roasted fox nuts india", "nutry bites products", "weight loss snacks"],
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
