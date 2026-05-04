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

export default function ProductDetailPage({ params }) {
  return <ProductContent slug={params.slug} />;
}
