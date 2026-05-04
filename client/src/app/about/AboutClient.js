"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { FiStar, FiShield, FiHeart } from "react-icons/fi";

export default function AboutPage() {
  const stats = [
    { label: "Happy Snackers", value: "10,000+", icon: "😋" },
    { label: "Packs Delivered", value: "50K+", icon: "📦" },
    { label: "Unique Flavors", value: "12+", icon: "✨" },
    { label: "Avg. Rating", value: "4.9/5", icon: "⭐" },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section with Modern Background */}
      <section className="relative bg-gradient-to-br from-[#f0faf7] via-white to-[#e8f5f2] py-14 md:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-5"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge variant="secondary" className="mb-6 text-sm font-medium bg-[#E6A15A] text-white">
            🏆 India&apos;s Leading Roasted Snack Brand
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-jost text-[#1F6F78]">
            About Nutry Bites
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-lato">
            Nourishing India with premium, oil-free roasted Makhana and
            healthy snacks, crafted for those who value both taste and wellness.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold text-[#1F6F78]">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 uppercase tracking-widest text-[10px] font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-14 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <Badge variant="outline" className="mb-4 border-[#1F6F78] text-[#1F6F78]">
                  Our Journey
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 font-jost">
                  Crunchy Goodness with a Purpose
                </h2>
                <div className="space-y-6 text-lg text-gray-700 leading-relaxed font-lato">
                  <p>
                    <strong className="text-[#1F6F78]">
                      Founded in 2024
                    </strong>
                    , Nutry Bites was born from a simple desire: to make healthy snacking
                    exciting. Our founder, after noticing a gap in truly oil-free,
                    nutritious snacks in the Indian market, decided to elevate the humble
                    Makhana into a gourmet superfood.
                  </p>
                  <p>
                    What started as a kitchen experiment with unique seasonings has now grown
                    into
                    <strong className="text-[#E6A15A]">
                      {" "}
                      Nutry Bites
                    </strong>
                    , serving health-conscious snackers nationwide who refuse to compromise
                    on quality or flavor.
                  </p>
                  <p>
                    Today, we source the finest fox nuts, roast them to perfection without a
                    drop of oil, and season them with handpicked spices to bring you
                    guilt-free munchies.
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-[#f0faf7] p-4 rounded-lg border-l-4 border-[#1F6F78]">
                    <div className="text-[#1F6F78] font-bold text-xl">
                      2024
                    </div>
                    <div className="text-sm text-gray-600">Brand Inception</div>
                  </div>
                  <div className="bg-[#fff9e6] p-4 rounded-lg border-l-4 border-[#E6A15A]">
                    <div className="text-[#E6A15A] font-bold text-xl">10+</div>
                    <div className="text-sm text-gray-600">
                      Unique Flavors
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 relative">
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/banner1.png"
                    alt="Nutry Bites roasted makhana process"
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-[#1F6F78] py-14 md:py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 font-jost uppercase tracking-wider">
              Our Mission & Vision
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
                <div className="text-4xl mb-4">🍃</div>
                <h3 className="text-2xl font-bold mb-4 font-jost">Our Mission</h3>
                <p className="text-lg opacity-90 leading-relaxed font-lato">
                  To replace junk food culture with wholesome, roasted superfoods that
                  nourish the body and delight the senses, one bite at a time.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
                <div className="text-4xl mb-4">🌟</div>
                <h3 className="text-2xl font-bold mb-4 font-jost">Our Vision</h3>
                <p className="text-lg opacity-90 leading-relaxed font-lato">
                  To be the global benchmark for healthy snacking, making Nutry Bites
                  synonymous with quality, transparency, and &quot;Power Beneath the Surface.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-14 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-[#E6A15A] text-[#E6A15A]">
                What Drives Us
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 font-jost">
                Our Core Values
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <div className="w-16 h-16 bg-[#f0faf7] rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:bg-[#e0f4ef] transition-colors">
                  <FiStar className="h-8 w-8 text-[#1F6F78]" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center text-gray-900 font-jost">
                  Purity & Quality
                </h3>
                <p className="text-gray-600 text-center leading-relaxed font-lato text-sm">
                  We source only the highest grade fox nuts and spices. Every batch is
                  roasted with precision to ensure maximum crunch and nutrition.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <div className="w-16 h-16 bg-[#fff9e6] rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:bg-[#fff0c7] transition-colors">
                  <FiShield className="h-8 w-8 text-[#E6A15A]" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center text-gray-900 font-jost">
                  100% Transparency
                </h3>
                <p className="text-gray-600 text-center leading-relaxed font-lato text-sm">
                  What you see is what you get. No hidden preservatives, no palm oil,
                  and no artificial colors. Just honest, wholesome ingredients.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:bg-emerald-200 transition-colors">
                  <FiHeart className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center text-gray-900 font-jost">
                  Customer Love
                </h3>
                <p className="text-gray-600 text-center leading-relaxed font-lato text-sm">
                  We listen to our snackers. Your feedback fuels our innovation, helping
                  us create the flavors you crave and the health benefits you need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-[#1F6F78] to-[#144D53] py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-jost">
            Experience the Nutry Bites Crunch
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-lato">
            Join the thousands of happy snackers who have discovered the power
            beneath the surface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="bg-[#E6A15A] text-white font-bold py-3 px-10 rounded-full hover:bg-[#b09340] transition-colors shadow-lg"
              onClick={() => window.location.href = "/products"}
            >
              Shop Now
            </button>
            <button
              className="border-2 border-white/50 text-white font-bold py-3 px-10 rounded-full hover:bg-white hover:text-[#1F6F78] transition-all"
              onClick={() => window.location.href = "/contact"}
            >
              Get In Touch
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
