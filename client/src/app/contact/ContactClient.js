"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  FiMail as Mail,
  FiMapPin as MapPin,
  FiInstagram as Instagram,
  FiPhone as Phone,
} from "react-icons/fi";
import { FaFacebookF as Facebook, FaTwitter as Twitter } from "react-icons/fa";
import { toast } from "sonner";

export default function ContactPage() {
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const response = await fetchApi("/content/contact", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast.success(response.data.message || "Your message has been sent!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <main className="py-12 md:py-20 bg-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#E6A15A]/10 text-[#E6A15A] text-[10px] font-bold tracking-widest uppercase rounded-full mb-3">
              Get in touch
            </span>
            <h1 className="text-3xl md:text-5xl font-bold font-jost text-[#1F6F78] mb-4">
              Get in Touch with Nutry Bites
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-lato">
              We’d love to hear from you regarding our healthy makhana snacks.
              Your trusted partner for healthy snacking.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-12 items-start">
            {/* Contact Form - 3 columns */}
            <div className="md:col-span-3 bg-white p-6 md:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
              <h2 className="text-2xl font-bold mb-8 font-jost text-gray-900">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-700 ml-1">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your name"
                      className="rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78] h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email"
                      className="rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78] h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-gray-700 ml-1">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78] h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-semibold text-gray-700 ml-1">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What is this regarding?"
                      className="rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78] h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold text-gray-700 ml-1">
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="rounded-xl border-gray-200 focus:border-[#1F6F78] focus:ring-[#1F6F78] resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1F6F78] hover:bg-[#144D53] text-white rounded-full h-14 text-base font-bold shadow-lg shadow-[#1F6F78]/20 transition-all active:scale-95"
                  disabled={formLoading}
                >
                  {formLoading ? "Sending Message..." : "Send Message"}
                </Button>
              </form>
            </div>

            {/* Contact Information - 2 columns */}
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
                <h3 className="text-xl font-bold mb-6 font-jost text-gray-900">Reach Out Directly</h3>
                <div className="space-y-6">
                  <div className="flex items-start group">
                    <div className="w-12 h-12 bg-[#f0faf7] rounded-2xl flex items-center justify-center mr-4 group-hover:bg-[#1F6F78] transition-colors duration-300">
                      <MapPin className="h-5 w-5 text-[#1F6F78] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Our Office</p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        -6/7 A, ACHARYYA JADADISH CHANDRA BOSE ROAD,<br />KOLKATA -700017
                      </p>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-[#1F6F78] text-[10px] font-bold uppercase tracking-wide">GST: 19ASGPY5969C1Z1</p>
                        <p className="text-[#1F6F78] text-[10px] font-bold uppercase tracking-wide">FSSAI: 22826039000129</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start group">
                    <div className="w-12 h-12 bg-[#fff9e6] rounded-2xl flex items-center justify-center mr-4 group-hover:bg-[#E6A15A] transition-colors duration-300">
                      <Mail className="h-5 w-5 text-[#E6A15A] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Email Us</p>
                      <p className="text-gray-600 text-sm">nutrybitesstore@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start group">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-blue-600 transition-colors duration-300">
                      <Phone className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Call Us</p>
                      <p className="text-gray-600 text-sm">8910072220, 6290958664</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1F6F78] p-8 rounded-3xl shadow-xl shadow-[#1F6F78]/20">
                <h3 className="text-xl font-bold mb-6 font-jost text-white">Join Our Community</h3>
                <p className="text-white/80 text-sm mb-6 font-lato leading-relaxed">
                  Follow us on social media for healthy snacking tips, new flavor launches,
                  and exclusive community offers.
                </p>
                <div className="flex space-x-4">
                  <a
                    href="https://facebook.com/nutrybites"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 p-3 rounded-xl hover:bg-white/20 hover:scale-110 transition-all"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5 text-white" />
                  </a>
                  <a
                    href="https://instagram.com/nutrybites"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 p-3 rounded-xl hover:bg-white/20 hover:scale-110 transition-all"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5 text-white" />
                  </a>
                  <a
                    href="https://twitter.com/nutrybites"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 p-3 rounded-xl hover:bg-white/20 hover:scale-110 transition-all"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
