"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import { RiLeafLine } from "react-icons/ri";

const CategoryCard = ({ category }) => {
  const isOffers =
    category.name?.toLowerCase().includes("offer") ||
    category.slug === "offers";

  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white border border-[#dde5e2] shadow-[0_1px_4px_rgba(0,0,0,0.06)] group-hover:shadow-[0_8px_20px_rgba(22,100,84,0.12)] group-hover:border-[#1F6F78] transition-all duration-300">
        {isOffers ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">%</span>
            </div>
          </div>
        ) : (
          <Image
            src={category.image || "/placeholder.jpg"}
            alt={category.name || "Category"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        )}
      </div>
      <h3 className="mt-2.5 text-xs font-semibold text-center text-[#144D53] group-hover:text-[#1F6F78] transition-colors duration-200 font-jost line-clamp-2 leading-tight">
        {category.name}
      </h3>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
    {[...Array(6)].map((_, index) => (
      <div key={index} className="flex flex-col items-center animate-pulse">
        <div className="w-full aspect-square rounded-2xl bg-[#e8f5f2]" />
        <div className="h-3 w-16 bg-[#e8f5f2] rounded mx-auto mt-2" />
      </div>
    ))}
  </div>
);

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchApi("/public/categories");
        if (response.success && response.data?.categories) {
          setCategories(response.data.categories);
        } else {
          setError(response.message || "Failed to fetch categories");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch categories"
        );
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <section className="py-10 md:py-14 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="flex items-center gap-1.5 justify-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#1F6F78] mb-2">
              <RiLeafLine className="h-3 w-3" />
              Categories
              <span className="inline-block w-5 h-[2px] bg-gradient-to-r from-[#1F6F78] to-[#E6A15A] rounded ml-1" />
            </span>
            <h2 className="font-jost text-2xl md:text-3xl font-bold text-[#144D53]">Shop By Category</h2>
            <div className="w-10 h-[3px] bg-gradient-to-r from-[#1F6F78] to-[#E6A15A] rounded mx-auto mt-3 mb-8" />
          </div>
          <SkeletonLoader />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-10 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto px-4 text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-5 py-2.5 bg-[#1F6F78] text-white rounded-xl text-sm font-semibold hover:bg-[#0f4d3f] transition"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className="py-10 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto px-4 text-center py-12">
          <p className="text-[#8fa89f]">No categories available at the moment</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-[#f8faf9]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="flex items-center gap-1.5 justify-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#1F6F78] mb-2">
            <RiLeafLine className="h-3 w-3" />
            Categories
            <span className="inline-block w-5 h-[2px] bg-gradient-to-r from-[#1F6F78] to-[#E6A15A] rounded ml-1" />
          </span>
          <h2 className="font-jost text-2xl md:text-3xl font-bold text-[#144D53]">Shop By Category</h2>
          <div className="w-10 h-[3px] bg-gradient-to-r from-[#1F6F78] to-[#E6A15A] rounded mx-auto mt-3" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.map((category) => (
            <Link
              href={`/category/${category.slug}`}
              key={category.id}
              className="block"
            >
              <CategoryCard category={category} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
