"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FiAlertCircle as AlertCircle, FiChevronDown as ChevronDown, FiChevronUp as ChevronUp } from "react-icons/fi";
import ProducCard from "@/components/ProducCard";

const getImageUrl = (image) => {
  if (!image) return "/placeholder.png";
  const url = typeof image === "string" ? image : image?.url || image?.path;
  if (!url) return "/placeholder.png";
  if (typeof url === "string" && url.startsWith("http")) return url;
  const cleanPath = typeof url === "string" && url.startsWith("/") ? url.slice(1) : url;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${cleanPath}`;
};

export default function SubCategoryClient({ categorySlug, subSlug }) {
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("newest");
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let sort = "createdAt";
        let order = "desc";
        switch (sortOption) {
          case "newest": sort = "createdAt"; order = "desc"; break;
          case "oldest": sort = "createdAt"; order = "asc"; break;
          case "name-asc": sort = "name"; order = "asc"; break;
          case "name-desc": sort = "name"; order = "desc"; break;
        }

        const response = await fetchApi(
          `/public/categories/${categorySlug}/sub/${subSlug}/products?page=${pagination.page}&limit=${pagination.limit}&sort=${sort}&order=${order}`
        );

        setCategory(response.data.category);
        setSubCategory(response.data.subCategory);
        setProducts(response.data.products || []);
        setPagination(response.data.pagination || pagination);
      } catch (err) {
        console.error("Error fetching subcategory products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug && subSlug) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, subSlug, pagination.page, pagination.limit, sortOption]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-[#1F6F78] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md flex items-start">
          <AlertCircle className="text-red-500 mr-3 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-red-700">Error Loading Sub-category</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb + header */}
      {category && subCategory && (
        <div className="mb-10">
          <div className="flex items-center mb-2 flex-wrap gap-1 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#1F6F78]">Home</Link>
            <span className="mx-1">/</span>
            <Link href="/products" className="text-gray-500 hover:text-[#1F6F78]">Products</Link>
            <span className="mx-1">/</span>
            <Link href={`/category/${categorySlug}`} className="text-gray-500 hover:text-[#1F6F78]">{category.name}</Link>
            <span className="mx-1">/</span>
            <span className="text-[#1F6F78]">{subCategory.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{subCategory.name}</h1>
              {subCategory.description && (
                <p className="text-gray-600 max-w-2xl">{subCategory.description}</p>
              )}
            </div>
            {subCategory.image && (
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={getImageUrl(subCategory.image)}
                  alt={subCategory.name}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sort + count bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <p className="text-gray-600 text-sm">
          Showing {products.length} of {pagination.total} products
        </p>
        <div className="flex items-center mt-4 sm:mt-0">
          <label htmlFor="sort" className="text-sm mr-2">Sort by:</label>
          <select
            id="sort"
            name="sort"
            className="rounded-md border-gray-300 shadow-sm focus:border-[#1F6F78] focus:ring-[#1F6F78] text-sm"
            onChange={(e) => setSortOption(e.target.value)}
            value={sortOption}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center border">
          <div className="text-gray-400 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-3">No products found</h2>
          <p className="text-gray-600 mb-6">There are no products in this sub-category yet.</p>
          <Link href={`/category/${categorySlug}`}>
            <Button>Browse {category?.name || "Category"}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          {products.map((product) => (
            <ProducCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center mt-10">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
            </Button>

            {[...Array(pagination.pages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === pagination.pages ||
                (page >= pagination.page - 1 && page <= pagination.page + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={pagination.page === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              }
              if (
                (page === 2 && pagination.page > 3) ||
                (page === pagination.pages - 1 && pagination.page < pagination.pages - 2)
              ) {
                return <span key={page}>...</span>;
              }
              return null;
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
