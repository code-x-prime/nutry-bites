"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, fetchProductsByType } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FiArrowRight, FiZap } from "react-icons/fi";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import BenefitsSec from "@/components/benifit-sec";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useRouter } from "next/navigation";
import SupplementStoreUI from "@/components/SupplementStoreUI";
import CategoryGrid from "@/components/CategoryGrid";
import BrandCarousel from "@/components/BrandCarousel";
import ProducCard from "@/components/ProducCard";
import { DynamicIcon } from "@/components/dynamic-icon";
import ShoppableVideoCarousel from "@/components/ShoppableVideoCarousel";

/* ─────────────────────────────────────────────
   Nutry BitesSection Heading — reusable across all sections
───────────────────────────────────────────── */
const SectionHeading = ({
  title,
  subtitle,
  icon: Icon,
  dark = false,
  align = "center",
}) => (
  <div className={`mb-6 ${align === "center" ? "text-center" : "text-left"}`}>
    {Icon && (
      <span
        className={`inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] mb-2
        ${dark ? "text-nyxis-gold" : "text-nyxis-500"}`}
      >
        <Icon className="h-3 w-3" />
        {title}
        <span
          className={`inline-block w-7 h-[2px] rounded-full ml-1
          ${dark ? "bg-nyxis-gold" : "bg-gradient-to-r from-nyxis-500 to-nyxis-gold"}`}
        />
      </span>
    )}
    <h2
      className={`font-jost font-bold tracking-tight leading-tight
        text-2xl md:text-3xl
        ${dark ? "text-white" : "text-nyxis-dark"}`}
    >
      {title}
    </h2>
    {subtitle && (
      <p
        className={`mt-1.5 text-sm max-w-xl ${align === "center" ? "mx-auto" : ""}
        ${dark ? "text-white/60" : "text-nyxis-gray-400"}`}
      >
        {subtitle}
      </p>
    )}
    <div
      className={`mt-3 h-[3px] w-10 rounded-full ${align === "center" ? "mx-auto" : ""}
      bg-gradient-to-r from-nyxis-500 to-nyxis-gold`}
    />
  </div>
);

/* ─────────────────────────────────────────────
   Hero Carousel
───────────────────────────────────────────── */
// Normalise banner image paths — handles Next.js static imports, full URLs, and CDN-relative paths
const normaliseBannerSrc = (src) => {
  if (!src) return null;
  if (typeof src === "object") return src; // Next.js static import (StaticImageData)
  if (src?.startsWith("http")) return src;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${src}`;
};

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState(null);
  const [autoplay, setAutoplay] = useState(true);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        const response = await fetchApi("/public/banners");
        if (response?.success && response?.data?.banners?.length > 0) {
          setBanners(response.data.banners);
        } else {
          setBanners([]);
        }
      } catch {
        setBanners([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const fallbackSlides = [
    {
      ctaLink: "/products",
      img: "/desk-1.png",
      smimg: "/mob-1.png",
      title: "PREMIUM HEALTHY SNACKS",
      subtitle: "Nourish your body with Nutry Bites wholesome collection.",
      highlight: "NEW ARRIVALS"
    },
    {
      ctaLink: "/products",
      img: "/desk-2.png",
      smimg: "/mob-2.png",
      title: "CRUNCHY & WHOLESOME",
      subtitle: "The perfect guilt-free companion for your active lifestyle.",
      highlight: "BEST SELLERS"
    },

  ];

  const slides =
    banners.length > 0
      ? banners.map((b, idx) => ({
        ctaLink: b.link || "/products",
        img: normaliseBannerSrc(b.desktopImage) || fallbackSlides[idx % fallbackSlides.length].img,
        smimg: normaliseBannerSrc(b.mobileImage) || normaliseBannerSrc(b.desktopImage) || fallbackSlides[idx % fallbackSlides.length].smimg,
        title: b.title || fallbackSlides[idx % fallbackSlides.length].title,
        subtitle: b.subtitle || fallbackSlides[idx % fallbackSlides.length].subtitle,
        highlight: b.highlight || "FEATURED"
      }))
      : fallbackSlides;

  useEffect(() => {
    if (!api || !autoplay) return;
    const id = setInterval(() => api.scrollNext(), 6000);
    return () => clearInterval(id);
  }, [api, autoplay]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  if (isLoading) {
    return (
      <div className="w-full relative aspect-[1000/450] md:aspect-[1900/400] bg-neutral-100 flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[#1F6F78]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#1F6F78] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[#1F6F78] font-medium animate-pulse tracking-widest text-xs uppercase">Initialising Experience...</p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden group">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{ loop: true, align: "start" }}
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="pl-0 basis-full">
              <div
                className="relative w-full aspect-[1000/450] md:aspect-[1900/400] cursor-pointer overflow-hidden transition-all duration-700"
                onClick={() => router.push(slide.ctaLink || "/products")}
              >
                {/* Background Image with Parallax-like effect */}
                <div className="absolute inset-0  transition-transform duration-[10s] ease-out">
                  {/* Desktop Image */}
                  <div className="hidden md:block absolute inset-0">
                    <Image
                      src={slide.img}
                      alt={slide.title}
                      fill
                      priority={index === 0}
                      className="object-cover object-center"
                      sizes="100vw"
                    />
                  </div>
                  {/* Mobile Image */}
                  <div className="block md:hidden absolute inset-0">
                    <Image
                      src={slide.smimg}
                      alt={slide.title}
                      fill
                      priority={index === 0}
                      className="object-cover object-center"
                      sizes="100vw"
                    />
                  </div>
                  {/* Premium Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/30 to-transparent md:from-black/10 md:via-black/10 md:to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />


                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Premium Navigation Controls */}
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-6 z-20">
          {/* Custom Dots / Progress Indicators */}
          <div className="flex items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className="relative h-1.5 transition-all duration-500 overflow-hidden rounded-full bg-white/20 hover:bg-white/40"
                style={{ width: i === currentSlide ? "48px" : "12px" }}
                aria-label={`Go to slide ${i + 1}`}
              >
                {i === currentSlide && (
                  <div
                    className="absolute inset-0 bg-[#E6A15A] origin-left animate-progress"
                    style={{ animationDuration: '6000ms' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Arrows */}
        <div className="absolute inset-y-0 left-4 md:left-8 flex items-center z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <CarouselPrevious className="relative left-0 translate-x-0 pointer-events-auto h-8 w-8 md:h-12 md:w-12 border-none bg-black/20 hover:bg-black/40 backdrop-blur-xl text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95" />
        </div>
        <div className="absolute inset-y-0 right-4 md:right-8 flex items-center z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <CarouselNext className="relative right-0 translate-x-0 pointer-events-auto h-8 w-8 md:h-12 md:w-12 border-none bg-black/20 hover:bg-black/40 backdrop-blur-xl text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95" />
        </div>

        {/* Corner Controls */}
        <div className="absolute  top-2 md:top-6 right-2 md:right-6 z-20 flex gap-2">
          <button
            className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-black/20 hover:bg-black/40 border border-white/10 text-white backdrop-blur-xl rounded-full transition-all duration-300 hover:rotate-12"
            onClick={() => setAutoplay(!autoplay)}
            aria-label={autoplay ? "Pause Slideshow" : "Play Slideshow"}
          >
            {autoplay ? (
              <div className="flex gap-1">
                <div className="w-[3px] h-3.5 bg-white rounded-full" />
                <div className="w-[3px] h-3.5 bg-white rounded-full" />
              </div>
            ) : (
              <div className="ml-1 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-transparent border-l-white" />
            )}
          </button>
        </div>
      </Carousel>


    </div>
  );
};



/* ─────────────────────────────────────────────
   Announcement Banner
───────────────────────────────────────────── */
const AnnouncementBanner = () => (
  <div className="bg-nyxis-dark py-2.5 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-center gap-3 text-center">
        <span className="text-nyxis-gold text-sm">✦</span>
        <p className="text-white text-xs md:text-sm font-medium tracking-wide font-jost">
          Spend ₹999 or more and unlock a scratch card — win exciting goodies!
        </p>
        <span className="text-nyxis-gold text-sm">✦</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Flash Sale Countdown
───────────────────────────────────────────── */
const FlashSaleCountdown = ({ endTime }) => {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const end = new Date(endTime).getTime();
    const id = setInterval(() => {
      const dist = end - Date.now();
      if (dist < 0) { setTime({ hours: 0, minutes: 0, seconds: 0 }); clearInterval(id); return; }
      setTime({
        hours: Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((dist % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const Unit = ({ val, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-nyxis-dark border border-nyxis-gold/30 rounded-lg px-4 py-2.5 min-w-[64px] text-center shadow-gold">
        <div className="text-2xl font-bold text-white font-jost tabular-nums">
          {String(val).padStart(2, "0")}
        </div>
        <div className="text-[0.6rem] text-nyxis-gold uppercase tracking-widest mt-0.5">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center gap-2 md:gap-3 mb-6">
      <Unit val={time.hours} label="Hrs" />
      <span className="text-nyxis-gold font-bold text-xl pb-4">:</span>
      <Unit val={time.minutes} label="Min" />
      <span className="text-nyxis-gold font-bold text-xl pb-4">:</span>
      <Unit val={time.seconds} label="Sec" />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Featured Products Carousel
───────────────────────────────────────────── */
const ProductSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-nyxis-gray-200 animate-pulse">
    <div className="aspect-square bg-nyxis-gray-100" />
    <div className="p-3 space-y-2">
      <div className="h-3.5 bg-nyxis-gray-100 rounded w-3/4" />
      <div className="h-3.5 bg-nyxis-gray-100 rounded w-1/2" />
      <div className="h-8 bg-nyxis-gray-100 rounded mt-3" />
    </div>
  </div>
);

const FeaturedProducts = ({ products = [], isLoading = false, error = null }) => {
  const [api, setApi] = useState(null);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => { };
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    );
  }

  if (error) return <p className="text-center py-8 text-red-500 text-sm">Failed to load products.</p>;
  if (products.length === 0) return <p className="text-center py-8 text-nyxis-gray-400 text-sm">No products found.</p>;

  return (
    <>
      <div className="relative">
        <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {products.map((product, index) => (
              <CarouselItem
                key={product.id || product.slug || index}
                className="pl-3 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6 py-4"
              >
                <ProducCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-white hover:bg-nyxis-50 border-nyxis-gray-200 text-nyxis-500 shadow-card rounded-full" />
          <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-white hover:bg-nyxis-50 border-nyxis-gray-200 text-nyxis-500 shadow-card rounded-full" />
        </Carousel>
      </div>

      <div className="text-center mt-4">
        <Link href="/products">
          <Button
            variant="outline"
            className="font-jost font-semibold text-sm border-nyxis-500 text-nyxis-500 hover:bg-nyxis-500 hover:text-white rounded-full px-7 py-2.5 transition-all duration-200 group"
          >
            View All Products
            <FiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </Link>
      </div>
    </>
  );
};

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white border-t border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        {subscribed ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank you for subscribing</h3>
            <p className="text-gray-600">Check your inbox for exclusive updates and offers</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stay in the loop
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Get exclusive deals, beauty tips, and product recommendations delivered to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>

            <p className="text-sm text-gray-500">
              No spam, just great content. Unsubscribe anytime.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   Reusable Product Section wrapper
───────────────────────────────────────────── */
const ProductSection = ({
  title,
  subtitle,
  products,
  isLoading,
  error,
  icon,
  variant = "light", // "light" | "tint" | "dark"
}) => {
  const bg = {
    light: "bg-white",
    tint: "bg-nyxis-50",
    dark: "bg-nyxis-dark",
  }[variant];

  return (
    <section className={`py-8 md:py-12 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading
          title={title}
          subtitle={subtitle}
          icon={icon}
          dark={variant === "dark"}
        />
        <FeaturedProducts products={products} isLoading={isLoading} error={error} />
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────── */
export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [productSections, setProductSections] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const r = await fetchApi("/public/flash-sales", { credentials: "include" });
        if (r.success) setFlashSales(r.data.flashSales || []);
      } catch { }
    };
    fetchFlashSales();

    const fetchProductSections = async () => {
      try {
        const r = await fetchApi("/public/product-sections", { credentials: "include" });
        if (r?.success && r?.data?.sections) setProductSections(r.data.sections);
      } catch { }
    };
    fetchProductSections();

    const fetchData = async () => {
      try {
        setProductsLoading(true);
        const [featuredRes, bestsellerRes, trendingRes, newRes] = await Promise.allSettled([
          fetchProductsByType("featured", 8),
          fetchProductsByType("bestseller", 8),
          fetchProductsByType("trending", 8),
          fetchProductsByType("new", 8),
        ]);

        if (featuredRes.status === "fulfilled") {
          setFeaturedProducts(featuredRes.value?.data?.products || []);
        } else {
          const fb = await fetchApi("/public/products?featured=true&limit=8");
          setFeaturedProducts(fb?.data?.products || []);
        }
        if (bestsellerRes.status === "fulfilled") setBestsellerProducts(bestsellerRes.value?.data?.products || []);
        if (trendingRes.status === "fulfilled") setTrendingProducts(trendingRes.value?.data?.products || []);
        if (newRes.status === "fulfilled") setNewProducts(newRes.value?.data?.products || []);
      } catch (err) {
        setError(err?.message || "Failed to fetch data");
      } finally {
        setProductsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full">

      {/* HERO */}
      <div className="w-full overflow-hidden">
        <HeroCarousel />
      </div>

      {/* ANNOUNCEMENT */}
      <AnnouncementBanner />

      {/* SHOPPABLE VIDEOS */}
      <ShoppableVideoCarousel />

      {/* ── FLASH SALES ── */}
      {flashSales.length > 0 && (
        <section className="py-10 md:py-14 bg-nyxis-dark relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-nyxis-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-nyxis-500/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4">
            {flashSales.map((sale) => (
              <div key={sale.id} className="mb-12 last:mb-0">
                <div className="text-center mb-8">
                  {/* Badge */}
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-nyxis-gold-dark to-nyxis-gold text-nyxis-dark px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-gold mb-5">
                    <FiZap className="h-3.5 w-3.5" /> Flash Sale
                  </span>

                  <h2 className="font-jost text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    {sale.name}
                  </h2>
                  <p className="text-nyxis-gold font-semibold text-lg mb-1">
                    {sale.discountPercentage}% OFF on All Products
                  </p>
                  <p className="text-white/40 text-sm mb-7">
                    Limited time — grab the best deals before they&apos;re gone
                  </p>

                  <FlashSaleCountdown endTime={sale.endTime} />
                </div>

                {sale.products?.length > 0 && (
                  <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-3 md:-ml-4">
                      {sale.products.map((product, i) => (
                        <CarouselItem
                          key={product.id || i}
                          className="pl-3 md:pl-4 basis-[260px] md:basis-[280px] lg:basis-[300px]"
                        >
                          <ProducCard
                            product={{
                              ...product,
                              hasSale: true,
                              price: product.basePrice,
                              salePrice: product.salePrice,
                              basePrice: product.salePrice,
                              regularPrice: product.basePrice,
                            }}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute -left-1 md:left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-nyxis-800 border-nyxis-gold/20 hover:bg-nyxis-700 text-white shadow-lg z-10" />
                    <CarouselNext className="absolute -right-1 md:right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-nyxis-800 border-nyxis-gold/20 hover:bg-nyxis-700 text-white shadow-lg z-10" />
                  </Carousel>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TOP BRANDS */}
      <BrandCarousel tag="TOP" title="TOP BRANDS" />

      {/* FEATURED */}
      {featuredProducts.length > 0 && (
        <ProductSection
          title="Featured Products"
          subtitle="Curated picks across beauty & wellness"
          products={featuredProducts}
          isLoading={productsLoading}
          error={error}
          variant="light"
        />
      )}

      {/* BEST SELLERS */}
      {bestsellerProducts.length > 0 && (
        <ProductSection
          title="Best Sellers"
          subtitle="Most loved products by our community"
          products={bestsellerProducts}
          isLoading={productsLoading}
          error={error}
          variant="tint"
        />
      )}

      {/* TRENDING */}
      {trendingProducts.length > 0 && (
        <ProductSection
          title="Trending Now"
          subtitle="What everyone is talking about this season"
          products={trendingProducts}
          isLoading={productsLoading}
          error={error}
          variant="light"
        />
      )}

      <SupplementStoreUI />

      {/* NEW BRANDS */}
      <BrandCarousel tag="NEW" title="NEW BRANDS" />

      <CategoryGrid />

      {/* NEW ARRIVALS */}
      {newProducts.length > 0 && (
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh products just added to our collection"
          products={newProducts}
          isLoading={productsLoading}
          error={error}
          variant="tint"
        />
      )}

      {/* Sale section — dark variant */}
      {saleProducts.length > 0 && (
        <ProductSection
          title="Sale & Offers"
          subtitle="Great deals on selected items — today only"
          products={saleProducts}
          isLoading={productsLoading}
          error={error}
          variant="dark"
        />
      )}

      {/* ── DYNAMIC ADMIN SECTIONS ── */}
      {productSections.map((section, index) => {
        if (!section.products?.length) return null;
        const isDark = section.color?.includes("black") || section.color?.includes("dark");
        return (
          <ProductSection
            key={section.id}
            title={section.name}
            subtitle={section.description}
            products={section.products}
            isLoading={productsLoading}
            error={error}
            icon={section.icon ? () => <DynamicIcon name={section.icon} className="h-3.5 w-3.5" /> : undefined}
            variant={isDark ? "dark" : index % 2 === 0 ? "light" : "tint"}
          />
        );
      })}

      {/* HOT BRANDS */}
      <BrandCarousel tag="HOT" title="HOT BRANDS" />

      <NewsletterSection />

      <BenefitsSec />
      <TestimonialsSection />
    </div>
  );
}