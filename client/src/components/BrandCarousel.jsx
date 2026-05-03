import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { fetchApi } from "@/lib/utils";
import Image from "next/image";

export default function BrandCarousel({ tag, title }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const res = await fetchApi(`/public/brands-by-tag?tag=${tag}`);
        setBrands(res.data.brands || []);
        setError(null);
      } catch (err) {
        setError("Failed to load brands");
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, [tag]);

  if (loading) {
    return (
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-36 flex-shrink-0 animate-pulse">
                <div className="aspect-square bg-[#e8f5f2] rounded-2xl" />
                <div className="h-7 bg-[#e8f5f2] rounded mt-0" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-red-500 text-sm">{error}</div>;
  }

  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {title && (
          <div className="mb-6">
            <h2 className="font-jost text-xl md:text-2xl font-bold text-[#144D53]">{title}</h2>
            <div className="w-8 h-[3px] bg-gradient-to-r from-[#1F6F78] to-[#E6A15A] rounded mt-2" />
          </div>
        )}
        <div className="relative">
          <Carousel opts={{ align: "start", loop: true }}>
            <CarouselContent className="-ml-3">
              {brands.map((brand) => (
                <CarouselItem
                  key={brand.id}
                  className="pl-3 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-[14.28%]"
                >
                  <Link
                    href={`/brand/${brand.slug}`}
                    className="block group"
                  >
                    <div className="w-full flex-shrink-0 bg-white rounded-2xl border border-[#dde5e2] overflow-hidden hover:border-[#1F6F78] hover:shadow-[0_6px_20px_rgba(22,100,84,0.1)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                      <div className="aspect-square bg-[#f8faf9] relative p-3">
                        <Image
                          fill
                          src={
                            brand.image?.startsWith("http")
                              ? brand.image
                              : `https://desirediv-storage.blr1.digitaloceanspaces.com/${brand.image}`
                          }
                          alt={brand.name}
                          className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
                        />
                      </div>
                      <div className="bg-[#144D53] py-2 px-3 text-center">
                        <span className="text-white text-[0.6rem] font-bold uppercase tracking-wider truncate block">
                          {brand.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="w-9 h-9 rounded-full bg-white border border-[#dde5e2] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-[#e8f5f2] hover:border-[#1F6F78] text-[#1F6F78] transition-all duration-200" />
            <CarouselNext className="w-9 h-9 rounded-full bg-white border border-[#dde5e2] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-[#e8f5f2] hover:border-[#1F6F78] text-[#1F6F78] transition-all duration-200" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
