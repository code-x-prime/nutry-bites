"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FiTrash2 as Trash2,
  FiPlus as Plus,
  FiMinus as Minus,
  FiShoppingBag as ShoppingBag,
  FiAlertCircle as AlertCircle,
  FiLoader as Loader2,
  FiArrowRight,
  FiX,
} from "react-icons/fi";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// Helper function to format image URLs correctly
const getImageUrl = (image) => {
  if (!image) return "/placeholder.png";
  if (image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

// Cart item component to optimize re-renders
const CartItem = React.memo(
  ({ item, onUpdateQuantity, onRemove, isLoading }) => {
    // Get product image - priority: variant images > product image > item image > placeholder
    const getProductImage = () => {
      // Priority 1: Variant images (from server cart)
      if (
        item.variant?.images &&
        Array.isArray(item.variant.images) &&
        item.variant.images.length > 0
      ) {
        const primaryImage = item.variant.images.find((img) => img.isPrimary);
        const imageUrl = primaryImage?.url || item.variant.images[0]?.url;
        if (imageUrl) return getImageUrl(imageUrl);
      }

      // Priority 2: Product image (from server cart)
      if (item.product?.image) {
        return getImageUrl(item.product.image);
      }

      // Priority 3: Direct image property (from guest cart)
      if (item.image) {
        return getImageUrl(item.image);
      }

      // Fallback to placeholder
      return "/placeholder.png";
    };

    // Get variant display name - handle both guest cart and server cart structures
    const getVariantName = () => {
      // If variantName exists and is not empty, use it
      if (item.variantName && item.variantName.trim() !== "") {
        return item.variantName;
      }

      // Try to get attributes from variant object (server cart)
      if (item.variant?.attributes && item.variant.attributes.length > 0) {
        const attrStrings = item.variant.attributes.map(
          (attr) => `${attr.attribute}: ${attr.value}`
        );
        return attrStrings.join(", ");
      }

      // Fallback to legacy color/size for backward compatibility
      let color = item.variant?.color?.name;
      let size = item.variant?.size?.name;
      if (!color) color = item.color?.name;
      if (!size) size = item.size?.name;

      if (color && size) {
        return `${color} • ${size}`;
      } else if (color) {
        return color;
      } else if (size) {
        return size;
      }

      // Return null if no variant info - don't show "Standard"
      return null;
    };

    const variantName = getVariantName();
    const productImage = getProductImage();
    const productName = item.productName || item.product?.name || "Product";
    const productSlug = item.productSlug || item.product?.slug || "#";

    return (
      <div className="bg-white rounded-2xl border border-[#dde5e2] p-4 mb-3 flex items-start gap-4">
        {/* Product image */}
        <div className="relative w-20 h-20 flex-shrink-0 bg-[#f8faf9] rounded-xl border border-[#dde5e2] overflow-hidden">
          <Image
            src={productImage}
            alt={productName}
            fill
            className="object-contain p-1"
            sizes="80px"
          />
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${productSlug}`}
            className="font-jost font-medium text-[#144D53] text-sm line-clamp-2 hover:text-[#1F6F78] transition-colors"
          >
            {productName}
          </Link>
          {variantName && (
            <div className="flex items-center gap-2 mt-1">
              {(item.variant?.color?.hexCode || item.color?.hexCode) && (
                <div
                  className="w-3 h-3 rounded-full border border-[#dde5e2] flex-shrink-0"
                  style={{
                    backgroundColor:
                      item.variant?.color?.hexCode || item.color?.hexCode,
                  }}
                />
              )}
              <span className="text-xs text-[#8fa89f] truncate">{variantName}</span>
            </div>
          )}
          {item.moq && item.moq > 1 && (
            <p className="text-xs text-[#1F6F78] mt-1 font-medium">Min. Order: {item.moq} units</p>
          )}
          {item.pricingSlabs && item.pricingSlabs.length > 0 && (
            <p className="text-xs text-[#8fa89f] mt-1">Bulk pricing available</p>
          )}
        </div>

        {/* Price + Qty + Remove */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Price */}
          {!isLoading && !item.isAuthenticated && item.hidePricesForGuests ? (
            <span className="text-xs text-amber-600 font-medium">Login to view</span>
          ) : (
            <div className="text-right">
              {item.originalPrice && item.originalPrice !== item.price && (
                <span className="text-xs line-through text-[#8fa89f] block">
                  {formatCurrency(item.originalPrice)}
                </span>
              )}
              <span className="font-jost font-bold text-[#144D53] text-base">
                {formatCurrency(item.price)}
              </span>
              {item.priceSource && item.priceSource !== "DEFAULT" && (
                <span className="text-xs text-emerald-600 font-medium block">Bulk pricing</span>
              )}
            </div>
          )}

          {/* Quantity controls */}
          <div className="border border-[#dde5e2] rounded-lg flex items-center overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity, -1)}
              className="px-2.5 py-1 text-[#1F6F78] hover:bg-[#e8f5f2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-lg leading-none"
              disabled={isLoading || item.quantity <= (item.moq || 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-3 py-1 text-sm font-semibold text-[#144D53] min-w-[2.5rem] text-center border-x border-[#dde5e2]">
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity, 1)}
              className="px-2.5 py-1 text-[#1F6F78] hover:bg-[#e8f5f2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Subtotal + Remove */}
          <div className="flex items-center gap-2">
            <span className="font-jost font-bold text-[#144D53] text-sm">
              {!isLoading && !item.isAuthenticated && item.hidePricesForGuests ? "-" : formatCurrency(item.subtotal)}
            </span>
            <button
              onClick={() => onRemove(item.id)}
              className="text-[#8fa89f] hover:text-red-400 p-1 rounded-lg disabled:opacity-40 transition-colors"
              aria-label="Remove item"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FiX className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
CartItem.displayName = "CartItem";

export default function CartPage() {
  const {
    cart,
    loading,
    cartItemsLoading,
    error,
    removeFromCart,
    updateCartItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    coupon,
    couponLoading,
    getCartTotals,
    isAuthenticated,
    mergeProgress,
    hidePricesForGuests,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const router = useRouter();

  // Use useCallback to memoize handlers
  const handleQuantityChange = useCallback(
    async (cartItemId, currentQuantity, change) => {
      const newQuantity = currentQuantity + change;

      // Find the cart item to get MOQ
      const cartItem = cart.items.find(item => item.id === cartItemId);
      const effectiveMOQ = cartItem?.moq || 1;

      // Don't allow quantity below MOQ
      if (newQuantity < effectiveMOQ) {
        toast.error(`Minimum order quantity is ${effectiveMOQ} units`);
        return;
      }

      if (newQuantity < 1) return;

      try {
        await updateCartItem(cartItemId, newQuantity);
        // Toast notification for success
        // toast.success("Cart updated successfully");
      } catch (err) {
        console.error("Error updating quantity:", err);
        toast.error(err.message || "Failed to update quantity");
      }
    },
    [updateCartItem, cart.items]
  );

  const handleRemoveItem = useCallback(
    async (cartItemId) => {
      try {
        await removeFromCart(cartItemId);
        // toast.success("Item removed from cart");
      } catch (err) {
        console.error("Error removing item:", err);
        toast.error("Failed to remove item");
      }
    },
    [removeFromCart]
  );

  const handleClearCart = useCallback(async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      try {
        await clearCart();
        toast.success("Cart has been cleared");
      } catch (err) {
        console.error("Error clearing cart:", err);
        toast.error("Failed to clear cart");
      }
    }
  }, [clearCart]);

  const handleApplyCoupon = useCallback(
    async (e) => {
      e.preventDefault();

      if (!couponCode.trim()) {
        setCouponError("Please enter a coupon code");
        return;
      }

      setCouponError("");

      try {
        await applyCoupon(couponCode);
        setCouponCode("");
      } catch (err) {
        setCouponError(err.message || "Invalid coupon code");
        toast.error(err.message || "Invalid coupon code");
      }
    },
    [couponCode, applyCoupon]
  );

  const handleRemoveCoupon = useCallback(() => {
    removeCoupon();
    setCouponCode("");
    setCouponError("");
    toast.success("Coupon removed");
  }, [removeCoupon]);

  // Memoize cart totals to prevent re-renders
  // getCartTotals only uses cart and coupon, which are already in dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totals = useMemo(() => getCartTotals(), [cart, coupon]);

  const handleCheckout = useCallback(() => {
    // If guest and prices hidden, force login
    if (!isAuthenticated && hidePricesForGuests) {
      router.push("/auth?redirect=checkout");
      return;
    }

    // Ensure minimum amount is 1
    const calculatedAmount = totals.subtotal - totals.discount;
    if (calculatedAmount < 1) {
      toast.info("Minimum order amount is ₹1");
      return;
    }

    if (!isAuthenticated) {
      router.push("/auth?redirect=checkout");
    } else {
      router.push("/checkout");
    }
  }, [isAuthenticated, router, totals, hidePricesForGuests]);

  // Display loading state
  if (loading && (!cart.items || cart.items.length === 0)) {
    return (
      <div className="bg-[#f8faf9] min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-jost text-2xl font-bold text-[#144D53] mb-6">Your Cart</h1>
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-[3px] border-[#e8f5f2] border-t-[#1F6F78] rounded-full animate-spin" />
            <p className="text-sm text-[#8fa89f] font-medium font-jost">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  // Display empty cart - but not when there's an error
  if ((!cart.items || cart.items.length === 0) && !error) {
    return (
      <div className="bg-[#f8faf9] min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-jost text-2xl font-bold text-[#144D53] mb-6">Your Cart</h1>
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-[#e8f5f2] rounded-full mx-auto flex items-center justify-center mb-5">
              <HiOutlineShoppingBag className="text-[#1F6F78] h-10 w-10" />
            </div>
            <h3 className="font-jost text-xl font-bold text-[#144D53] mb-2">Your cart is empty</h3>
            <p className="text-sm text-[#8fa89f] mb-6">
              Looks like you haven&apos;t added any products to your cart yet.
            </p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-[#1F6F78] text-white font-jost font-semibold px-8 py-3 rounded-xl hover:bg-[#0f4d3f] transition-all duration-200 shadow-[0_4px_12px_rgba(22,100,84,0.25)]">
              Continue Shopping
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8faf9] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page heading */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-jost text-2xl font-bold text-[#144D53]">Your Cart</h1>
          <span className="bg-[#e8f5f2] text-[#1F6F78] text-xs font-bold rounded-full px-2.5 py-0.5">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Guest cart notice */}
        {!isAuthenticated && cart.items.length > 0 && (
          <div className="bg-white border border-[#dde5e2] rounded-2xl p-5 flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-[#e8f5f2] rounded-full flex items-center justify-center flex-shrink-0">
              <HiOutlineShoppingBag className="h-5 w-5 text-[#1F6F78]" />
            </div>
            <div className="flex-1">
              <p className="font-jost font-bold text-[#144D53] text-sm mb-1">
                Guest Cart — <span className="text-[#8fa89f] font-normal">Login to save your items</span>
              </p>
              <p className="text-xs text-[#8fa89f] mb-3">
                Log in to complete your purchase and save your cart for future visits.
              </p>
              <div className="flex gap-3">
                <Link href="/auth?redirect=cart" className="bg-[#1F6F78] text-white font-jost font-semibold text-xs px-4 py-2 rounded-xl hover:bg-[#0f4d3f] transition">
                  Log In
                </Link>
                <Link href="/auth?redirect=cart" className="border-2 border-[#1F6F78] text-[#1F6F78] font-jost font-semibold text-xs px-4 py-2 rounded-xl hover:bg-[#e8f5f2] transition">
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Merge progress */}
        {mergeProgress && (
          <div className="bg-[#e8f5f2] border border-[#1F6F78]/20 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <Loader2 className="text-[#1F6F78] h-4 w-4 animate-spin flex-shrink-0" />
            <p className="text-sm text-[#1F6F78] font-medium">{mergeProgress}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div>
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={{ ...item, isAuthenticated, hidePricesForGuests }}
                  onUpdateQuantity={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  isLoading={cartItemsLoading[item.id]}
                />
              ))}
            </div>
            {/* Cart actions */}
            <div className="flex justify-between items-center mt-4 pt-4">
              <Link href="/products" className="text-sm font-semibold text-[#1F6F78] hover:text-[#0f4d3f] transition flex items-center gap-1.5">
                ← Continue Shopping
              </Link>
              <button
                onClick={handleClearCart}
                className="text-sm text-[#8fa89f] hover:text-red-400 flex items-center gap-1.5 transition disabled:opacity-40"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary — dark card */}
          <div className="lg:col-span-1">
            <div className="bg-[#144D53] rounded-2xl p-6 sticky top-24">
              <h2 className="font-jost font-bold text-white text-lg mb-5">Order Summary</h2>

              {/* Savings highlight */}
              {coupon && totals.discount > 0 && (
                <div className="bg-[#E6A15A]/10 border border-[#E6A15A]/20 rounded-xl p-3 mb-4 text-center">
                  <p className="text-[#E6A15A] text-sm font-semibold">
                    You save {formatCurrency(totals.discount)} on this order
                  </p>
                </div>
              )}

              {/* Coupon input */}
              {cart.items?.length > 0 && (
                <div className="mb-5">
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Coupon Code</p>
                  {coupon ? (
                    <div className="bg-white/8 border border-white/15 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#E6A15A] text-sm">{coupon.code}</span>
                          <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Applied</span>
                          <p className="text-xs text-white/50 mt-0.5">
                            {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                          </p>
                          {((parseFloat(coupon.discountValue) > 90 && coupon.discountType === "PERCENTAGE") || coupon.isDiscountCapped) && (
                            <p className="text-xs text-amber-400 mt-1">*Max discount capped at 90%</p>
                          )}
                        </div>
                        <button onClick={handleRemoveCoupon} className="text-xs text-red-400 hover:text-red-300 transition" disabled={couponLoading}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 bg-white/8 border border-white/15 rounded-xl text-white text-sm px-4 py-2.5 placeholder:text-white/30 outline-none focus:border-[#E6A15A]/50 transition"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading}
                          className="bg-[#E6A15A]/20 text-[#E6A15A] text-sm font-bold px-4 rounded-xl hover:bg-[#E6A15A]/30 transition disabled:opacity-40"
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </button>
                      </form>
                      <p className="text-xs text-white/30 mt-1.5">*Maximum discount limited to 90%</p>
                      {couponError && (
                        <div className="mt-2 flex items-start gap-1.5 text-red-400">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <p className="text-xs">{couponError}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Line items */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm py-2 border-b border-white/8">
                  <span className="text-white/60">Subtotal</span>
                  <span className="text-white font-medium">
                    {!isAuthenticated && hidePricesForGuests ? (
                      <Link href="/auth?redirect=cart" className="text-amber-400 hover:underline text-xs">Login to view</Link>
                    ) : formatCurrency(totals.subtotal)}
                  </span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-sm py-2 border-b border-white/8">
                    <span className="text-white/60">Discount</span>
                    <span className="text-emerald-400 font-medium">−{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-2 border-b border-white/8">
                  <span className="text-white/60">Shipping</span>
                  {totals.shipping > 0 ? (
                    <span className="text-white font-medium">{formatCurrency(totals.shipping)}</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">FREE</span>
                  )}
                </div>
                {totals.shipping > 0 && cart.freeShippingThreshold > 0 && (
                  <p className="text-xs text-amber-400 text-center bg-amber-400/10 rounded-lg py-2 px-3">
                    Add {formatCurrency(cart.freeShippingThreshold - totals.subtotal)} more for FREE shipping!
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between pt-4 border-t border-white/8">
                <span className="font-jost font-bold text-white text-base">Grand Total</span>
                <span className="font-jost font-bold text-[#E6A15A] text-lg">
                  {!isAuthenticated && hidePricesForGuests ? (
                    <Link href="/auth?redirect=cart" className="text-amber-400 hover:underline text-sm">Login to view</Link>
                  ) : formatCurrency(totals.total)}
                </span>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                className="mt-6 w-full bg-[#E6A15A] hover:bg-[#9a7a2a] text-[#144D53] font-jost font-bold py-4 rounded-2xl text-base transition-all duration-200 shadow-[0_4px_16px_rgba(201,168,76,0.4)] hover:shadow-[0_6px_20px_rgba(201,168,76,0.5)] flex items-center justify-center gap-2"
              >
                {!isAuthenticated && hidePricesForGuests ? (
                  "Login to Checkout"
                ) : (
                  <>
                    Proceed to Checkout
                    <FiArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <p className="text-center text-white/30 text-xs mt-4">
                Taxes and shipping calculated at checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
