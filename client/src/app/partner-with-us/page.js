"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const perks = [
  { icon: "🌿", title: "Premium Quality", desc: "Oil-free roasted makhana, no artificial additives" },
  { icon: "🚚", title: "Pan-India Shipping", desc: "Reliable delivery across all major cities" },
  { icon: "🤝", title: "Dedicated Support", desc: "Dedicated partner success manager" },
  { icon: "📈", title: "Attractive Margins", desc: "Transparent pricing with healthy profit margins" },
  { icon: "🎁", title: "Marketing Support", desc: "Co-branded materials & social media assets" },
  { icon: "📦", title: "Bulk Pricing", desc: "Volume discounts for distributors & retailers" },
];

export default function PartnerWithUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    number: "",
    city: "",
    state: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/partner/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Thanks! We will reach out shortly.", {
          description: `${formData.name || "Partner"}, your interest has been recorded.`,
        });
        setFormData({ name: "", email: "", number: "", city: "", state: "", message: "" });
      } else {
        const data = await res.json();
        toast.error(data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#F8F5F2]">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-[#1F6F78] to-[#144D53] py-16 md:py-20 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="inline-block px-4 py-1.5 bg-[#E6A15A]/20 text-[#E6A15A] text-[10px] font-bold tracking-widest uppercase rounded-full mb-4 border border-[#E6A15A]/30">
            🤝 Partner Programme
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-jost mb-4">
            Partner with Nutry Bites
          </h1>
          <p className="text-lg text-white/80 font-lato max-w-2xl mx-auto leading-relaxed">
            Join India&apos;s fastest-growing healthy snack brand. Whether you are a
            distributor, retailer, gym owner, or influencer — grow with us.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left: Info */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-jost text-gray-900 mb-4">
              Two Partnership Models
            </h2>
            <p className="text-gray-600 font-lato leading-relaxed mb-8">
              We offer flexible partnership options designed to fit your business.
              Share your details and our team will get in touch within 24 hours.
            </p>

            <div className="space-y-4 mb-10">
              <div className="flex gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-[#1F6F78]/30 transition-colors">
                <div className="w-12 h-12 bg-[#f0f9f8] rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  💰
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 font-jost mb-1">Commission Model</h3>
                  <p className="text-gray-600 text-sm font-lato">
                    Earn attractive commissions on every sale you generate. Perfect for influencers, health coaches, and online sellers.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-[#E6A15A]/30 transition-colors">
                <div className="w-12 h-12 bg-[#fff9f0] rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  🏪
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 font-jost mb-1">Distribution / Bulk Model</h3>
                  <p className="text-gray-600 text-sm font-lato">
                    Become a Nutry Bites authorised distributor and stock our products in your store, gym, or corporate pantry at wholesale prices.
                  </p>
                </div>
              </div>
            </div>

            {/* Perks Grid */}
            <h3 className="text-lg font-bold font-jost text-gray-900 mb-4">Why Partner With Us?</h3>
            <div className="grid grid-cols-2 gap-3">
              {perks.map((p) => (
                <div
                  key={p.title}
                  className="flex gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                >
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm font-jost">{p.title}</p>
                    <p className="text-gray-500 text-xs font-lato mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl font-bold font-jost text-gray-900 mb-2">
              Apply to Partner
            </h2>
            <p className="text-gray-500 text-sm font-lato mb-7">
              Fill out the form below. Our partnerships team will contact you within 24–48 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                  <Input
                    id="name" name="name"
                    placeholder="Rahul Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-11 rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                  <Input
                    id="email" name="email" type="email"
                    placeholder="rahul@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-11 rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="number" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                  <Input
                    id="number" name="number" type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.number}
                    onChange={handleChange}
                    required
                    className="h-11 rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-700">City</Label>
                  <Input
                    id="city" name="city"
                    placeholder="Gurugram"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="h-11 rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-sm font-semibold text-gray-700">State</Label>
                <Input
                  id="state" name="state"
                  placeholder="Haryana"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="h-11 rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-sm font-semibold text-gray-700">Tell Us About Your Business</Label>
                <Textarea
                  id="message" name="message"
                  placeholder="Briefly describe your business and how you'd like to partner with Nutry Bites (e.g., gym owner, online reseller, supermarket chain)..."
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78] resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1F6F78] hover:bg-[#E6A15A] text-white rounded-full h-12 text-base font-bold shadow-lg shadow-[#1F6F78]/20 transition-all duration-300 active:scale-95"
              >
                {isSubmitting ? "Submitting..." : "Submit Partnership Request"}
              </Button>

              <p className="text-center text-xs text-gray-400 font-lato">
                Your trusted partner for healthy makhana snacking.
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
