"use client";

import { formatCurrency, fetchApi } from "@/lib/utils";
import { FiHeart } from "react-icons/fi";
import { BsStarFill } from "react-icons/bs";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProductQuickView from "./ProductQuickView";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
  if (!image) return "/placeholder.png";
  
  // Extract URL if it's an object
  const url = typeof image === "string" ? image : image.url;
  if (!url) return "/placeholder.png";
  
  if (typeof url === "string" && url.startsWith("http")) return url;
  
  // Clean the path if it starts with a slash
  const cleanPath = typeof url === "string" && url.startsWith("/") ? url.slice(1) : url;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${cleanPath}`;
};

// Helper function to calculate discount percentage
const calculateDiscountPercentage = (regularPrice, salePrice) => {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

const ProductCard = ({ product }) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [wishlistItems, setWishlistItems] = useState({});
  const [isAddingToWishlist, setIsAddingToWishlist] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [priceVisibilitySettings, setPriceVisibilitySettings] = useState(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Fetch wishlist status for this product
  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!isAuthenticated || typeof window === "undefined") return;

      try {
        const response = await fetchApi("/users/wishlist", {
          credentials: "include",
        });
        const items =
          response.data?.wishlistItems?.reduce((acc, item) => {
            acc[item.productId] = true;
            return acc;
          }, {}) || {};
        setWishlistItems(items);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
    };

    fetchWishlistStatus();
  }, [isAuthenticated]);

  // Fetch price visibility settings
  useEffect(() => {
    const fetchPriceVisibilitySettings = async () => {
      try {
        const response = await fetchApi("/public/price-visibility-settings");
        if (response.success) {
          setPriceVisibilitySettings(response.data);
        }
      } catch (error) {
        console.error("Error fetching price visibility settings:", error);
        // Default to showing prices if API fails
        setPriceVisibilitySettings({ hidePricesForGuests: false });
      }
    };

    fetchPriceVisibilitySettings();
  }, []);

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };

  const handleAddToWishlist = async (product, e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/products/${product.slug}`);
      return;
    }

    setIsAddingToWishlist((prev) => ({ ...prev, [product.id]: true }));

    try {
      if (wishlistItems[product.id]) {
        // Get wishlist to find the item ID
        const wishlistResponse = await fetchApi("/users/wishlist", {
          credentials: "include",
        });

        const wishlistItem = wishlistResponse.data?.wishlistItems?.find(
          (item) => item.productId === product.id
        );

        if (wishlistItem) {
          await fetchApi(`/users/wishlist/${wishlistItem.id}`, {
            method: "DELETE",
            credentials: "include",
          });

          setWishlistItems((prev) => ({ ...prev, [product.id]: false }));
          toast.success("Removed from wishlist");
        }
      } else {
        // Add to wishlist
        await fetchApi("/users/wishlist", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ productId: product.id }),
        });

        setWishlistItems((prev) => ({ ...prev, [product.id]: true }));
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setIsAddingToWishlist((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const getAllProductImages = useMemo(() => {
    const images = [];
    const imageUrls = new Set();

    if (
      product.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {
      product.variants.forEach((variant) => {
        // Handle variant.images array
        if (
          variant.images &&
          Array.isArray(variant.images) &&
          variant.images.length > 0
        ) {
          variant.images.forEach((img) => {
            const url = img?.url || img;
            if (url) {
              const imageUrl = getImageUrl(url);
              if (imageUrl && !imageUrls.has(imageUrl)) {
                imageUrls.add(imageUrl);
                images.push(imageUrl);
              }
            }
          });
        }
      });
    }

    // Priority 2: Get product images array
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      product.images.forEach((img) => {
        const url = img?.url || img;
        if (url) {
          const imageUrl = getImageUrl(url);
          if (imageUrl && !imageUrls.has(imageUrl)) {
            imageUrls.add(imageUrl);
            images.push(imageUrl);
          }
        }
      });
    }

    // Priority 3: Fallback to product.image (string)
    if (images.length === 0 && product.image) {
      const imageUrl = getImageUrl(product.image);
      if (imageUrl && !imageUrls.has(imageUrl)) {
        imageUrls.add(imageUrl);
        images.push(imageUrl);
      }
    }

    // Final fallback
    if (images.length === 0) {
      images.push("/placeholder.png");
    }

    return images;
  }, [product]);

  // Auto-rotate images on hover
  useEffect(() => {
    if (!isHovered || getAllProductImages.length <= 1) {
      setCurrentImageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        return (prev + 1) % getAllProductImages.length;
      });
    }, 2500); // Change image every 2.5 seconds for smooth transition

    return () => clearInterval(interval);
  }, [isHovered, getAllProductImages.length]);

  // Reset to first image when hover ends
  useEffect(() => {
    if (!isHovered) {
      setCurrentImageIndex(0);
    }
  }, [isHovered]);

  // Get variant info - extract from attributes dynamically
  const getVariantInfo = () => {
    let selectedVariant = null;
    if (product.variants && product.variants.length > 0) {
      selectedVariant = product.variants[0];
    }
    if (!selectedVariant) return null;

    // Extract color and size from attributes
    let color = null;
    let size = null;
    let hexCode = null;

    if (
      selectedVariant.attributes &&
      Array.isArray(selectedVariant.attributes)
    ) {
      selectedVariant.attributes.forEach((attr) => {
        if (attr.attribute === "Color") {
          color = attr.value;
          // Try to get hexCode from attributeOptions if available
          if (product.attributeOptions) {
            const colorAttr = product.attributeOptions.find(
              (a) => a.name === "Color"
            );
            if (colorAttr && colorAttr.values) {
              const colorValue = colorAttr.values.find(
                (v) => v.id === attr.attributeValueId
              );
              if (colorValue) {
                hexCode = colorValue.hexCode || null;
              }
            }
          }
        } else if (attr.attribute === "Size") {
          size = attr.value;
        }
      });
    }

    // Fallback to legacy color/size for backward compatibility
    if (!color) color = selectedVariant.color?.name;
    if (!size) size = selectedVariant.size?.name;
    if (!hexCode) hexCode = selectedVariant.color?.hexCode;

    return { color, size, hexCode };
  };

  const variantInfo = getVariantInfo();

  // Get price - Universal handler for all API formats
  const parsePrice = (value) => {
    if (value === null || value === undefined) return null;
    if (value === 0) return 0;
    const parsed = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(parsed) ? null : parsed;
  };

  const basePriceField = parsePrice(product.basePrice);
  const regularPriceField = parsePrice(product.regularPrice);
  const priceField = parsePrice(product.price);
  const salePriceField = parsePrice(product.salePrice);

  // Determine if product is on sale
  let hasSale = false;

  if (product.hasSale !== undefined && product.hasSale !== null) {
    hasSale = Boolean(product.hasSale);
  } else {
    if (salePriceField !== null && salePriceField > 0) {
      if (regularPriceField && salePriceField < regularPriceField) {
        hasSale = true;
      } else if (priceField && salePriceField < priceField) {
        hasSale = true;
      } else if (
        basePriceField &&
        regularPriceField &&
        salePriceField < regularPriceField
      ) {
        hasSale = true;
      }
    }
  }

  // Determine original price (for strikethrough) and current display price
  let originalPrice = null;
  let currentPrice = 0;

  if (basePriceField !== null && regularPriceField !== null) {
    if (hasSale && basePriceField < regularPriceField) {
      currentPrice = basePriceField;
      originalPrice = regularPriceField;
    } else {
      currentPrice = basePriceField;
    }
  } else if (
    salePriceField !== null &&
    (priceField !== null || basePriceField !== null)
  ) {
    if (hasSale && salePriceField) {
      currentPrice = salePriceField;
      if (priceField && priceField > salePriceField) {
        originalPrice = priceField;
      } else if (basePriceField && basePriceField > salePriceField) {
        originalPrice = basePriceField;
      } else if (regularPriceField && regularPriceField > salePriceField) {
        originalPrice = regularPriceField;
      }
    } else {
      currentPrice = priceField || basePriceField || regularPriceField || 0;
    }
  } else {
    if (hasSale && salePriceField) {
      currentPrice = salePriceField;
      originalPrice = regularPriceField || priceField || basePriceField || null;
    } else {
      currentPrice =
        basePriceField ||
        regularPriceField ||
        priceField ||
        salePriceField ||
        0;
    }
  }

  if (
    currentPrice === null ||
    currentPrice === undefined ||
    isNaN(currentPrice)
  ) {
    currentPrice = 0;
  }

  const discountPercent =
    hasSale && originalPrice && currentPrice
      ? calculateDiscountPercentage(originalPrice, currentPrice)
      : 0;

  return (
    <div
      key={product.id}
      className="relative bg-white rounded-xl overflow-hidden border border-[#dde5e2] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(22,100,84,0.12)] hover:border-nyxis-500 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer w-full"
    >
      {/* Sale ribbon — top left */}
      {hasSale && originalPrice && currentPrice < originalPrice && (
        <div
          className="absolute top-2 left-0 z-10 text-white text-[0.58rem] font-bold uppercase tracking-wider py-1 px-3 leading-none"
          style={{
            background: "#dc2626",
            clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)",
          }}
        >
          SALE
        </div>
      )}

      {/* Discount % badge — top right */}
      {discountPercent > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-white border border-[#dde5e2] text-[0.6rem] font-bold text-[#144D53] px-1.5 py-0.5 rounded">
          {discountPercent}% OFF
        </div>
      )}

      {/* Product image — click navigates to product */}
      <Link href={`/products/${product.slug}`}>
        <div
          className="relative aspect-square w-full overflow-hidden bg-[#f8faf9]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative w-full h-full">
            {getAllProductImages.map((img, idx) => (
              <Image
                key={idx}
                src={img}
                alt={`${product.name} - Image ${idx + 1}`}
                fill
                className={`object-contain p-3 transition-all duration-700 ${idx === currentImageIndex
                  ? "opacity-100 scale-100 group-hover:scale-105"
                  : "opacity-0 scale-100 absolute"
                  }`}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ))}
          </div>

          {/* Image dots */}
          {getAllProductImages.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {getAllProductImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`rounded-full transition-all duration-200 ${idx === currentImageIndex
                    ? "bg-nyxis-500 w-4 h-1.5"
                    : "bg-white/60 w-1.5 h-1.5 hover:bg-white/90"
                    }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Wishlist button — absolute, overlaps image/badge */}
      <button
        className={`absolute z-10 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#dde5e2] hover:border-nyxis-500 transition-all duration-200 ${discountPercent > 0 ? "top-10 right-2" : "top-2 right-2"
          }`}
        onClick={(e) => {
          e.stopPropagation();
          handleAddToWishlist(product, e);
        }}
        disabled={isAddingToWishlist[product.id]}
        aria-label={wishlistItems[product.id] ? "Remove from wishlist" : "Add to wishlist"}
      >
        <FiHeart
          className={`h-3.5 w-3.5 transition-colors ${wishlistItems[product.id]
            ? "text-red-500 fill-current"
            : "text-[#8fa89f]"
            }`}
        />
      </button>

      {/* Card body */}
      <div className="p-3">

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-1.5">
            <BsStarFill className="h-2.5 w-2.5 text-amber-400" />
            <span className="text-base font-semibold text-[#4a6059]">{product.rating}</span>
            {variantInfo?.size && (
              <span className="text-[0.6rem] text-[#8fa89f] border-l border-[#dde5e2] pl-1.5">
                {variantInfo.size}
              </span>
            )}
          </div>
        )}

        {/* Brand */}
        {product.brand && (
          <p className="text-base font-bold text-[#1F6F78] uppercase tracking-wide truncate mb-0.5">
            {product.brand.name || product.brand}
          </p>
        )}

        {/* Product name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-base font-medium text-[#144D53] leading-snug line-clamp-2 mb-2 font-jost hover:text-[#1F6F78] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {priceVisibilitySettings?.hidePricesForGuests && !isAuthenticated ? (
            <span className="text-xs text-amber-600 font-medium">Login to view price</span>
          ) : priceVisibilitySettings === null ? (
            <span className="text-xs text-amber-600 font-medium">Login to view price</span>
          ) : (
            <>
              <span className="text-base font-bold text-[#144D53] font-jost">
                {formatCurrency(currentPrice)}
              </span>
              {hasSale && originalPrice && currentPrice < originalPrice && (
                <span className="text-[0.7rem] line-through text-[#8fa89f]">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-[0.58rem] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {discountPercent}% off
                </span>
              )}
            </>
          )}
        </div>

        {/* Add to Cart — opens Quick View modal where cart action happens */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuickView(product);
          }}
          className="w-full flex items-center justify-center gap-1 bg-[#1F6F78] hover:bg-[#0f4d3f] text-white text-[0.7rem] font-bold py-2 rounded-lg transition-all duration-200 font-jost shadow-[0_2px_8px_rgba(22,100,84,0.2)] hover:shadow-[0_4px_12px_rgba(22,100,84,0.3)]"
        >
          Add to Cart <span className="text-base font-normal">+</span>
        </button>

      </div>

      {/* Quick View Dialog */}
      <ProductQuickView
        product={quickViewProduct}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  );
};

export default ProductCard;
