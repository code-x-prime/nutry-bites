import { fetchApi } from "@/lib/utils";

export default async function sitemap() {
  const baseUrl = "https://nutrybites.co.in";

  // Static routes
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/products",
    "/categories",
    "/privacy-policy",
    "/terms-conditions",
    "/refund-policy",
    "/shipping-policy",
    "/faqs",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic routes
  let productRoutes = [];
  let categoryRoutes = [];

  try {
    // Fetch products (limit to 1000 for sitemap)
    const productsRes = await fetchApi("/public/products?limit=1000");
    if (productsRes?.success && productsRes?.data?.products) {
      productRoutes = productsRes.data.products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(product.updatedAt || new Date()),
        changeFrequency: "weekly",
        priority: 0.9,
      }));
    }

    // Fetch categories
    const categoriesRes = await fetchApi("/public/categories");
    if (categoriesRes?.success && categoriesRes?.data?.categories) {
      categoryRoutes = categoriesRes.data.categories.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: new Date(category.updatedAt || new Date()),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
