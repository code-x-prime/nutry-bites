import CategoryClient from "./CategoryClient";
import { fetchApi } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { slug } = params;
  let title = "Category | Nutry Bites";
  let description = "Explore our premium healthy snacks in this category.";

  try {
    const response = await fetchApi(`/public/categories/${slug}`);
    if (response?.success && response?.data?.category) {
      const category = response.data.category;
      title = `${category.name} | Nutry Bites — Healthy Snacks`;
      description = category.description || `Browse our collection of ${category.name} snacks at Nutry Bites. Premium quality, roasted to perfection.`;
    }
  } catch (error) {
    console.error("Error fetching category metadata:", error);
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = params;
  let category = null;

  try {
    const response = await fetchApi(`/public/categories/${slug}`);
    if (response?.success && response?.data?.category) {
      category = response.data.category;
    }
  } catch (error) {
    console.error("Error fetching category for schema:", error);
  }

  const jsonLd = category ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://nutrybites.co.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": category.name,
        "item": `https://nutrybites.co.in/category/${slug}`
      }
    ]
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CategoryClient slug={slug} />
    </>
  );
}
