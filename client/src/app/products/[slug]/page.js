import { fetchApi } from "@/lib/utils";
import ProductContent from "./ProductContent";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
  if (!image) return null;
  if (image?.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

export async function generateMetadata({ params }) {
  const { slug } = params;
  let title = "Product Details | Nutry Bites";
  let description =
    "Premium quality roasted Makhana and healthy snacks from Nutry Bites. Crunchy, light, and wholesome goodness delivered to your door.";

  let image = null;

  try {
    // Fetch product details from API
    const response = await fetchApi(`/public/products/${slug}`);
    const product = response.data.product;

    if (product) {
      title = product.metaTitle || `${product.name} | Nutry Bites`;

      description =
        product.metaDescription || product.description || description;

      // Get the first image from product images
      if (product.images && product.images.length > 0) {
        image = getImageUrl(product.images[0].url);
      }
    }
  } catch (error) {
    console.error("Error fetching product metadata:", error);
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = params;
  let product = null;

  try {
    const response = await fetchApi(`/public/products/${slug}`);
    product = response.data.product;
  } catch (error) {
    console.error("Error fetching product for schema:", error);
  }

  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map(img => getImageUrl(img.url)) || [],
    "description": product.description || product.metaDescription,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "Nutry Bites"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://nutrybites.co.in/products/${slug}`,
      "priceCurrency": "INR",
      "price": product.salePrice || product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductContent slug={slug} />
    </>
  );
}
