"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FiInstagram,
  FiYoutube,
  FiMail,
  FiPhone,
  FiMapPin,
  FiChevronDown,
  FiShield,
  FiTruck,
  FiRefreshCw,
} from "react-icons/fi";
import {
  FaFacebookF,
  FaTwitter,
  FaPinterestP,
} from "react-icons/fa";
import { fetchApi } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function Footer() {
  const pathname = usePathname();
  const [socialLinks, setSocialLinks] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);

  const isAuthPage = ["/auth", "/forgot-password", "/verify-otp", "/reset-password", "/verify-email"].some(path => typeof pathname === "string" && pathname.startsWith(path));

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchApi("/public/settings", {
          credentials: "include",
        });
        if (res?.success) {
          setSocialLinks(res.data?.socialLinks || {});
          setContactInfo({
            email: res.data?.contactEmail || "nutrybitesstore@gmail.com",
            phone: res.data?.contactPhone || "8910072220, 6290958664",
            address: res.data?.contactAddress || "-6/7 A, ACHARYYA JADADISH CHANDRA BOSE ROAD, KOLKATA -700017",
          });
        }
      } catch (error) {
        console.log("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const shopLinks = [
    { name: "New Arrivals", href: "/products?productType=new" },
    { name: "Best Sellers", href: "/products?productType=bestseller" },
    { name: "Trending Now", href: "/products?productType=trending" },
    { name: "All Products", href: "/products" },
    { name: "Sale", href: "/products?sale=true" },
  ];

  const helpLinks = [
    { name: "Contact Us", href: "/contact" },
    { name: "About Us", href: "/about" },
    { name: "FAQs", href: "/faqs" },
    { name: "Track Order", href: "/account/orders" },
  ];

  const policyLinks = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Shipping Policy", href: "/shipping-policy" },
    { name: "Terms & Conditions", href: "/terms-conditions" },
  ];

  const trustItems = [
    { Icon: FiShield, title: "100% Roasted", desc: "Healthy & oil-free" },
    { Icon: FiTruck, title: "Free Shipping", desc: "Orders over ₹999" },
    { Icon: FiRefreshCw, title: "Freshness Guaranteed", desc: "Always crispy & fresh" },
  ];

  const socialIcons = [
    { key: "facebook", Icon: FaFacebookF },
    { key: "twitter", Icon: FaTwitter },
    { key: "instagram", Icon: FiInstagram },
    { key: "youtube", Icon: FiYoutube },
    { key: "pinterest", Icon: FaPinterestP },
  ];

  const FooterSection = ({ title, links, sectionKey }) => (
    <div>
      {/* Desktop heading */}
      <h3 className="hidden md:block font-semibold text-sm text-white mb-4">
        {title}
      </h3>
      {/* Mobile accordion */}
      <button
        className="md:hidden w-full flex items-center justify-between py-3 border-b border-gray-700"
        onClick={() => toggleSection(sectionKey)}
      >
        <h3 className="font-semibold text-sm text-white">
          {title}
        </h3>
        <FiChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${expandedSection === sectionKey ? "rotate-180" : ""
            }`}
        />
      </button>
      <ul
        className={`space-y-2.5 mt-3 overflow-hidden transition-all duration-300 md:max-h-none md:opacity-100 ${expandedSection === sectionKey
          ? "max-h-[300px] opacity-100"
          : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
          }`}
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-block"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  if (pathname && isAuthPage) return null;

  return (
    <footer className="mt-auto mb-14 lg:mb-0">
      {/* ── Trust Bar ── */}
      <div className="bg-[#1F6F78]/5 border-t border-[#1F6F78]/10 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
            {trustItems.map((item) => {
              const { Icon } = item;
              return (
                <div key={item.title} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f0f9f8] rounded-xl flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#1F6F78]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="bg-[#144D53] text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/logo.png"
                  alt="Nutry Bites"
                  width={120}
                  height={120}
                  className="h-24 w-auto brightness-0 invert"
                />
              </Link>
              <p className="text-gray-300 text-sm leading-relaxed max-w-sm mb-6">
                Nutry Bites is your destination for premium, oil-free roasted snacks. We specialize in wholesome Makhana and nutritious munchies designed for your active lifestyle.
              </p>

              {/* Contact info */}
              <div className="space-y-3">
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-3 text-gray-300 hover:text-white text-sm transition-colors"
                >
                  <FiMail className="h-4 w-4 flex-shrink-0" />
                  {contactInfo.email}
                </a>
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="flex items-center gap-3 text-gray-300 hover:text-white text-sm transition-colors"
                >
                  <FiPhone className="h-4 w-4 flex-shrink-0" />
                  {contactInfo.phone}
                </a>
                <p className="flex items-center gap-3 text-gray-300 text-sm">
                  <FiMapPin className="h-4 w-4 flex-shrink-0" />
                  {contactInfo.address}
                </p>
                <div className="pt-2 text-white text-[12px] font-bold uppercase tracking-wider">
                  <p className="text-white">GST NO: 19ASGPY5969C1Z1</p>
                  <p className="text-white">FSSAI LIC NO: 22826039000129</p>
                </div>
              </div>
            </div>

            {/* Link Columns */}
            <FooterSection
              title="Shop"
              links={shopLinks}
              sectionKey="shop"
            />
            <FooterSection
              title="Help"
              links={helpLinks}
              sectionKey="help"
            />
            <FooterSection
              title="Policies"
              links={policyLinks}
              sectionKey="policies"
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="bg-[#0d3538] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-xs text-center">
            © {new Date().getFullYear()} <strong className="text-white">Nutry Bites</strong> · All rights reserved. | Developed by <a href="https://groxmedia.in" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors font-medium">Grox Media</a>
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socialIcons.map(({ key, Icon }) => {
              const url = socialLinks[key];
              if (!url) return null;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={key}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
