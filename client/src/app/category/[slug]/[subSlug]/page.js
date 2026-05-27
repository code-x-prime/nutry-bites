import SubCategoryClient from "./SubCategoryClient";
import { fetchApi } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { slug, subSlug } = params;
  let title = "Category | Nutry Bites";
  let description = "Explore our premium healthy snacks.";

  try {
    const response = await fetchApi(`/public/categories/${slug}`);
    if (response?.success && response?.data?.category) {
      const category = response.data.category;
      const sub = category.subCategories?.find((s) => s.slug === subSlug);
      const subName = sub?.name || subSlug;
      title = `${subName} — ${category.name} | Nutry Bites`;
      description = sub?.description || `Browse our ${subName} collection at Nutry Bites.`;
    }
  } catch (error) {
    console.error("Error fetching subcategory metadata:", error);
  }

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}/${subSlug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function SubCategoryPage({ params }) {
  const { slug, subSlug } = params;
  let category = null;
  let subCategory = null;

  try {
    const response = await fetchApi(`/public/categories/${slug}`);
    if (response?.success && response?.data?.category) {
      category = response.data.category;
      subCategory = category.subCategories?.find((s) => s.slug === subSlug) || null;
    }
  } catch (error) {
    console.error("Error fetching subcategory for schema:", error);
  }

  const jsonLd = category && subCategory
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://nutrybites.co.in" },
          { "@type": "ListItem", position: 2, name: category.name, item: `https://nutrybites.co.in/category/${slug}` },
          { "@type": "ListItem", position: 3, name: subCategory.name, item: `https://nutrybites.co.in/category/${slug}/${subSlug}` },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SubCategoryClient categorySlug={slug} subSlug={subSlug} />
    </>
  );
}
