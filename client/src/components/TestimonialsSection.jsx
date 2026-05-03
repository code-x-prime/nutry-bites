"use client";

import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Shweta Patel",
      location: "Ahmedabad, India",
      quote:
        "The Peri Peri Makhana is addictive! Perfect for my late-night cravings without the guilt of oil.",
      rating: 5,
      verified: true,
      daysAgo: 12,
      avatar: "SP",
    },
    {
      name: "Aarohi Singh",
      location: "Noida, Delhi NCR",
      quote:
        "Nutry Bites has become my one-stop shop for healthy snacks. My kids love the Cheesy Garlic flavor!",
      rating: 5,
      verified: true,
      daysAgo: 8,
      avatar: "AS",
    },
    {
      name: "Neha Sharma",
      location: "Delhi, India",
      quote:
        "Finally found a brand that doesn't use palm oil. The quality of fox nuts is exceptional and very crunchy.",
      rating: 5,
      verified: true,
      daysAgo: 5,
      avatar: "NS",
    },
    {
      name: "Priyanka Desai",
      location: "Jaipur, Rajasthan",
      quote:
        "Ordered the combo pack and every flavor is a hit. The packaging is premium and keeps the snacks fresh.",
      rating: 5,
      verified: true,
      daysAgo: 3,
      avatar: "PD",
    },
    {
      name: "Kavita Menon",
      location: "Mumbai, Maharashtra",
      quote:
        "Super fast delivery and the snacks were perfectly packed. Highly recommend for anyone looking for oil-free munchies.",
      rating: 5,
      verified: true,
      daysAgo: 1,
      avatar: "KM",
    },
    {
      name: "Anjali Gupta",
      location: "Surat, Gujarat",
      quote:
        "The Mint & Lime Makhana is so refreshing. Best companion for my evening tea. Will definitely order again!",
      rating: 5,
      verified: true,
      daysAgo: 2,
      avatar: "AG",
    },
  ];

  const [api, setApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#202124] mb-2">
            Customer Reviews
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-[#fbbc04]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="text-[#5f6368] text-sm ml-2">4.9 out of 5 stars</span>
          </div>
        </div>

        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true, slidesToScroll: 1 }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={`testimonial-${index}`}
                  className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="bg-white rounded-lg border border-[#dadce0] p-6 h-full flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-shadow">
                    {/* Header with reviewer info */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F6F78] to-[#0d8f6e] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {testimonial.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[#202124] text-sm truncate">
                              {testimonial.name}
                            </p>
                            {testimonial.verified && (
                              <svg className="w-4 h-4 text-[#4285f4] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 10-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-[#5f6368] text-xs mt-0.5">{testimonial.location}</p>
                        </div>
                      </div>
                      <span className="text-[#5f6368] text-xs whitespace-nowrap ml-2">{testimonial.daysAgo}d ago</span>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-[#fbbc04]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>

                    {/* Review text */}
                    <p className="text-[#202124] text-sm leading-relaxed mb-4 flex-1">
                      {testimonial.quote}
                    </p>

                    {/* Verified badge */}
                    <div className="flex items-center gap-1 text-[#5f6368] text-xs">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                      Verified Purchase
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="w-10 h-10 rounded-full bg-white border border-[#dadce0] shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:bg-[#f8f9fa] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)] text-[#5f6368] transition-all duration-200" />
            <CarouselNext className="w-10 h-10 rounded-full bg-white border border-[#dadce0] shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:bg-[#f8f9fa] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)] text-[#5f6368] transition-all duration-200" />
          </Carousel>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                    ? "bg-[#4285f4] w-6"
                    : "bg-[#dadce0] hover:bg-[#9aa0a6] w-2"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
