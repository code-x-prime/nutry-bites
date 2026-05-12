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
    "/partner-with-us",
    "/privacy-policy",
    "/terms-conditions",
    "/refund-policy",
    "/shipping-policy",
    "/faqs",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic routes
  let productRoutes = [];
  let categoryRoutes = [];
  let brandRoutes = [];

  try {
    // Fetch products (limit to 1000 for sitemap)
    const productsRes = await fetchApi("/public/products?limit=1000");
    if (productsRes?.success && productsRes?.data?.products) {
      productRoutes = productsRes.data.products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(product.updatedAt || product.createdAt || new Date()),
        changeFrequency: "weekly",
        priority: 0.9,
      }));
    }

    // Fetch categories
    const categoriesRes = await fetchApi("/public/categories");
    if (categoriesRes?.success && categoriesRes?.data?.categories) {
      categoryRoutes = categoriesRes.data.categories.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: new Date(category.updatedAt || category.createdAt || new Date()),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    }

    // Fetch brands (if any)
    const brandsRes = await fetchApi("/public/brands-by-tag");
    if (brandsRes?.success && Array.isArray(brandsRes.data)) {
      brandRoutes = brandsRes.data.map((brand) => ({
        url: `${baseUrl}/brand/${brand.slug}`,
        lastModified: new Date(brand.updatedAt || brand.createdAt || new Date()),
        changeFrequency: "weekly",
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...brandRoutes];
}
