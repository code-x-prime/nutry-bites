"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FiSearch as Search } from "react-icons/fi";
import { Input } from "@/components/ui/input";

export default function FAQsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState(["all"]);

  useEffect(() => {
    async function fetchFAQs() {
      setLoading(true);
      try {
        const response = await fetchApi("/faqs");

        // Handle various possible response formats
        let faqsData = [];
        if (response?.data?.faqs && Array.isArray(response.data.faqs)) {
          // Format: { data: { faqs: [...] } }
          faqsData = response.data.faqs;
        } else if (Array.isArray(response?.data)) {
          // Format: { data: [...] }
          faqsData = response.data;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          // Format: { statusCode, data: [...], message, success }
          faqsData = response.data.data;
        }

        setFaqs(faqsData);
        setFilteredFaqs(faqsData);

        // Fetch categories
        const categoriesResponse = await fetchApi("/faqs/categories");

        // Handle categories response format
        let categoriesData = [];
        if (categoriesResponse?.data?.categories) {
          categoriesData = categoriesResponse.data.categories;
        } else if (Array.isArray(categoriesResponse?.data)) {
          categoriesData = categoriesResponse.data;
        } else if (
          categoriesResponse?.data?.data &&
          Array.isArray(categoriesResponse.data.data)
        ) {
          categoriesData = categoriesResponse.data.data;
        }

        if (categoriesData.length) {
          setCategories(["all", ...categoriesData.map((cat) => cat.name)]);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFAQs();
  }, []);

  // Filter FAQs based on search query and category
  useEffect(() => {
    if (!faqs.length) return;

    let filtered = faqs;

    // Filter by category if not "all"
    if (activeCategory !== "all") {
      filtered = filtered.filter((faq) => faq.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    // Sort by order (ascending)
    filtered = [...filtered].sort((a, b) => a.order - b.order);

    setFilteredFaqs(filtered);
  }, [searchQuery, activeCategory, faqs]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Switch category
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F5F2]">
        <section className="bg-gradient-to-br from-[#1F6F78] to-[#144D53] py-14 text-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <div className="h-8 w-48 bg-white/20 rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-12 w-3/4 bg-white/20 rounded-xl mx-auto mb-3 animate-pulse" />
            <div className="h-5 w-1/2 bg-white/10 rounded-lg mx-auto animate-pulse" />
          </div>
        </section>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-4 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5F2]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1F6F78] to-[#144D53] py-14 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-white/20">
            Help Centre
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-jost mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 font-lato text-lg">
            Find quick answers about our makhana snacks, orders, and delivery.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Search bar */}
        <div className="relative max-w-lg mx-auto mb-8">
          <Input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-3 h-12 rounded-2xl border-gray-200 bg-white shadow-sm focus:border-[#1F6F78] focus:ring-[#1F6F78]"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {/* Category filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeCategory === category
                    ? "bg-[#1F6F78] text-white shadow-md shadow-[#1F6F78]/20"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[#1F6F78] hover:text-[#1F6F78]"
                  }`}
              >
                {category === "all" ? "All Questions" : category}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Accordion */}
        {filteredFaqs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {filteredFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id.toString()}
                className="bg-white border border-gray-200 rounded-2xl px-4 shadow-sm hover:border-[#1F6F78]/40 transition-colors"
              >
                <AccordionTrigger className="text-base font-semibold py-5 px-2 hover:no-underline text-gray-900 font-jost">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-5 pt-1 text-gray-600 font-lato leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-14 bg-white rounded-3xl border border-gray-100">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-semibold text-gray-800 mb-2 font-jost">
              No results for &quot;{searchQuery}&quot;
            </p>
            <span className="text-gray-500 font-lato">
              Try a different term or{" "}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="text-[#1F6F78] font-semibold hover:text-[#E6A15A] transition-colors"
              >
                view all FAQs
              </button>
            </span>
          </div>
        )}

        {/* Contact section */}
        <div className="mt-16 bg-[#f0faf7] p-8 rounded-3xl text-center border border-[#1F6F78]/10">
          <h2 className="text-xl font-bold mb-3 font-jost text-[#1F6F78]">Still have questions?</h2>
          <p className="text-gray-600 mb-6 font-lato">
            Can&apos;t find the answer you&apos;re looking for? Please contact
            our snack support team.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#1F6F78] text-white rounded-full font-bold hover:bg-[#144D53] transition-all shadow-lg shadow-[#1F6F78]/20"
            >
              Contact Us
            </a>
            <a
              href="mailto:nutrybitesstore@gmail.com"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-[#1F6F78]/20 text-[#1F6F78] rounded-full font-bold hover:bg-white transition-all"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
