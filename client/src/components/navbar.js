"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect, useRef } from "react";
import {
  FiSearch,
  FiHeart,
  FiMenu,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiUser,
  FiPhone,
  FiTruck,
  FiLogOut,
  FiPackage,
  FiHome,
  FiGrid,
} from "react-icons/fi";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { useRouter, usePathname } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { ClientOnly } from "./client-only";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import Image from "next/image";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState(null);
  const searchInputRef = useRef(null);
  const navbarRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Track scroll position for transparent/solid header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setActiveMenu(null);
  }, [pathname]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setActiveMenu(null);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    // Static links always shown (guarantee nav is never empty)
    const staticFallback = [
      { name: "HOME", href: "/", isStatic: true },
      { name: "ALL PRODUCTS", href: "/products", isStatic: true },
      { name: "CATEGORIES", href: "/categories", isStatic: true },
      { name: "NEW ARRIVALS", href: "/products?productType=new", highlight: true },
      { name: "SALE", href: "/products?sale=true", highlight: true, isSale: true },
      { name: "ABOUT", href: "/about", isStatic: true },
      { name: "CONTACT", href: "/contact", isStatic: true },
    ];

    const fetchCategories = async () => {
      try {
        const response = await fetchApi("/public/categories-with-subcategories");
        if (response?.data?.categories && response.data.categories.length > 0) {
          setCategories(response.data.categories);

          // Build menu items from categories
          const dynamicMenuItems = [
            { name: "HOME", href: "/", isStatic: true },
            {
              name: "NEW ARRIVALS",
              href: "/products?productType=new",
              highlight: true,
            },
          ];

          // Add categories with sub-categories
          response.data.categories.forEach((category) => {
            const menuItem = {
              name: category.name.toUpperCase(),
              href: `/products?category=${category.slug}`,
            };

            // Add mega menu if category has sub-categories
            if (category.subCategories && category.subCategories.length > 0) {
              menuItem.megaMenu = {
                categories: [
                  {
                    name: `Shop All ${category.name}`,
                    href: `/products?category=${category.slug}`
                  },
                  ...category.subCategories.map((subCat) => ({
                    name: subCat.name,
                    href: `/products?category=${category.slug}&subCategory=${subCat.slug}`,
                  })),
                ],
              };
            }

            dynamicMenuItems.push(menuItem);
          });

          // Add static tail links
          dynamicMenuItems.push({
            name: "SALE",
            href: "/products?sale=true",
            highlight: true,
            isSale: true,
          });
          dynamicMenuItems.push({ name: "ABOUT", href: "/about", isStatic: true });
          dynamicMenuItems.push({ name: "CONTACT", href: "/contact", isStatic: true });

          setMenuItems(dynamicMenuItems);
        } else {
          // API returned empty categories — use static fallback
          setMenuItems(staticFallback);
        }
      } catch (error) {
        console.log("Categories API failed, using fallback nav");
        setMenuItems(staticFallback);
      }
    };

    // Set static fallback immediately so nav is never empty
    setMenuItems(staticFallback);
    fetchCategories();
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  return (
    <>
      <header
        ref={navbarRef}
        className={cn(
          "sticky top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "shadow-nav" : ""
        )}
      >
        <Toaster position="top-center" richColors />

        {/* ── Top Promo Bar ── */}
        <div className="bg-[#1F6F78] py-2">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center text-center">
              <p className="text-white text-[0.7rem] md:text-xs font-semibold tracking-[0.1em] font-jost uppercase">
                ✦ FREE DELIVERY ABOVE ₹999 | 100% HEALTHY & ROASTED SNACKS ✦
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Nav Bar ── */}
        <div
          className={cn(
            "transition-all duration-300 bg-white border-b border-nyxis-gray-200",
            isScrolled && "shadow-nav"
          )}
        >
          <div className="max-w-7xl mx-auto px-4">
            {/* Mobile Header */}
            <div className="flex lg:hidden items-center justify-between h-20">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="p-2 text-nyxis-dark hover:text-nyxis-500 transition-colors"
                  aria-label="Open menu"
                >
                  <FiMenu className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-nyxis-dark hover:text-nyxis-500 transition-colors"
                  aria-label="Search"
                >
                  <FiSearch className="h-5 w-5" />
                </button>
              </div>

              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Nutry Bites"
                  width={100}
                  height={100}
                  className="h-14 md:h-16 w-auto"
                />
              </Link>

              <div className="flex items-center gap-1">
                <ClientOnly>
                  <Link
                    href="/wishlist"
                    className="p-2 text-nyxis-gray-400 hover:text-nyxis-500 transition-colors"
                  >
                    <FiHeart className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/cart"
                    className="p-2 text-nyxis-dark hover:text-nyxis-500 transition-colors relative"
                  >
                    <HiOutlineShoppingBag className="h-5 w-5" />
                    {getCartItemCount() > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-nyxis-gold text-nyxis-dark text-[0.6rem] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center">
                        {getCartItemCount()}
                      </span>
                    )}
                  </Link>
                </ClientOnly>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between h-[72px] gap-6">
              {/* Logo */}
              <Link href="/" className="flex items-center shrink-0">
                <Image
                  src="/logo.png"
                  alt="Nutry Bites"
                  width={120}
                  height={120}
                  className="h-16 w-auto"
                />
              </Link>

              {/* Search Bar */}
              <div className="flex-1 max-w-xl">
                <form onSubmit={handleSearch} className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-nyxis-500" />
                  <input
                    type="search"
                    placeholder="Search products, brands..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-full border border-nyxis-gray-200 bg-nyxis-off-white text-sm text-nyxis-dark placeholder:text-nyxis-gray-400 focus:bg-white focus:border-nyxis-500 focus:ring-1 focus:ring-nyxis-500 focus:outline-none transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-5">
                {/* Account */}
                <ClientOnly>
                  <div className="relative">
                    <button
                      className="flex flex-col items-center text-nyxis-gray-400 hover:text-nyxis-500 transition-colors"
                      onClick={() =>
                        setActiveMenu(
                          activeMenu === "account" ? null : "account"
                        )
                      }
                    >
                      <FiUser className="h-5 w-5" />
                      <span className="text-[0.65rem] mt-0.5 font-medium">Account</span>
                    </button>

                    {/* Account Dropdown */}
                    <div
                      className={cn(
                        "absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-dropdown border border-nyxis-gray-200 py-2 transition-all duration-200 origin-top-right z-50",
                        activeMenu === "account"
                          ? "opacity-100 scale-100 visible"
                          : "opacity-0 scale-95 invisible pointer-events-none"
                      )}
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-4 py-3 border-b border-nyxis-gray-200">
                            <p className="font-jost font-bold text-nyxis-dark text-sm">
                              {user?.name || "User"}
                            </p>
                            <p className="text-xs text-nyxis-gray-400 truncate">
                              {user?.email}
                            </p>
                          </div>
                          <Link
                            href="/account"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-nyxis-50 hover:text-nyxis-500 transition-colors"
                            onClick={() => setActiveMenu(null)}
                          >
                            <FiUser className="h-4 w-4" /> My Account
                          </Link>
                          <Link
                            href="/account/orders"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-nyxis-50 hover:text-nyxis-500 transition-colors"
                            onClick={() => setActiveMenu(null)}
                          >
                            <FiPackage className="h-4 w-4" /> My Orders
                          </Link>
                          <Link
                            href="/wishlist"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-nyxis-50 hover:text-nyxis-500 transition-colors"
                            onClick={() => setActiveMenu(null)}
                          >
                            <FiHeart className="h-4 w-4" /> My Wishlist
                          </Link>
                          <div className="border-t border-nyxis-gray-200 mt-1 pt-1">
                            <button
                              onClick={() => {
                                handleLogout();
                                setActiveMenu(null);
                              }}
                              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <FiLogOut className="h-4 w-4" /> Logout
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 space-y-2">
                          <Link
                            href="/auth"
                            onClick={() => setActiveMenu(null)}
                          >
                            <button className="w-full bg-nyxis-500 hover:bg-nyxis-600 text-white font-jost font-semibold py-2.5 rounded-lg transition-colors text-sm">
                              Login
                            </button>
                          </Link>
                          <Link
                            href="/auth?mode=register"
                            onClick={() => setActiveMenu(null)}
                          >
                            <button className="w-full border-2 border-nyxis-500 text-nyxis-500 hover:bg-nyxis-500 hover:text-white font-jost font-semibold py-2.5 rounded-lg transition-all text-sm mt-2">
                              Register
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </ClientOnly>

                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className="flex flex-col items-center text-nyxis-gray-400 hover:text-nyxis-500 transition-colors"
                >
                  <FiHeart className="h-5 w-5" />
                  <span className="text-[0.65rem] mt-0.5 font-medium">Wishlist</span>
                </Link>

                {/* Cart */}
                <ClientOnly>
                  <Link
                    href="/cart"
                    className="flex items-center gap-2 bg-nyxis-500 hover:bg-nyxis-600 text-white rounded-full px-4 py-2 transition-all duration-200 shadow-[0_2px_8px_rgba(22,100,84,0.25)] hover:shadow-[0_4px_12px_rgba(22,100,84,0.35)]"
                  >
                    <HiOutlineShoppingBag className="h-4.5 w-4.5" />
                    <span className="text-sm font-semibold font-jost">Cart</span>
                    {getCartItemCount() > 0 && (
                      <span className="bg-nyxis-gold text-nyxis-dark text-[0.6rem] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                        {getCartItemCount()}
                      </span>
                    )}
                  </Link>
                </ClientOnly>
              </div>
            </div>
          </div>
        </div>

        {/* ── Category Navigation ── */}
        <nav
          className={cn(
            "hidden lg:block border-b border-nyxis-gray-200 transition-all duration-300 bg-white"
          )}
        >
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex items-center justify-center">
              {menuItems.map((item) => (
                <li
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.megaMenu && setActiveMenu(item.name)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  {item.highlight ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-4 py-2.5 text-xs font-bold tracking-wider transition-colors",
                        item.isSale
                          ? "text-nyxis-gold hover:text-nyxis-gold-light"
                          : "text-nyxis-500 hover:text-nyxis-600"
                      )}
                    >
                      {item.isSale ? `🔥 ${item.name}` : `🍃 ${item.name}`}
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-4 py-2.5 text-sm font-medium tracking-wide transition-colors relative",
                        pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                          ? "text-[#1F6F78] font-semibold"
                          : "text-gray-700 hover:text-[#1F6F78]",
                        activeMenu === item.name && "text-[#1F6F78]"
                      )}
                    >
                      {item.name}
                      {/* Bottom active indicator */}
                      <span
                        className={cn(
                          "absolute bottom-0 left-4 right-4 h-[2px] bg-[#1F6F78] transform origin-left transition-transform duration-200 rounded-full",
                          (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) || activeMenu === item.name)
                            ? "scale-x-100"
                            : "scale-x-0 group-hover:scale-x-100"
                        )}
                      />
                    </Link>
                  )}

                  {/* Mega Menu */}
                  {item.megaMenu && (
                    <div
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 top-full w-[280px] bg-white rounded-xl shadow-dropdown border border-nyxis-gray-200 transition-all duration-200 origin-top z-50",
                        activeMenu === item.name
                          ? "opacity-100 scale-100 visible"
                          : "opacity-0 scale-95 invisible pointer-events-none"
                      )}
                    >
                      <div className="p-5">
                        <h3 className="text-xs font-bold text-nyxis-500 tracking-widest mb-3 uppercase">
                          Shop by Category
                        </h3>
                        <ul className="space-y-1">
                          {item.megaMenu.categories.map((cat) => (
                            <li key={cat.href}>
                              <Link
                                href={cat.href}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-nyxis-500 hover:bg-nyxis-50 px-3 py-2 rounded-lg transition-all duration-150"
                                onClick={() => setActiveMenu(null)}
                              >
                                <FiChevronRight className="h-3 w-3 opacity-40" />
                                {cat.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* ── Mobile Search Overlay ── */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="flex gap-2 bg-white border border-nyxis-gray-200 rounded-2xl p-2 shadow-card focus-within:border-nyxis-500 focus-within:shadow-[0_4px_16px_rgba(22,100,84,0.1)] transition-all">
              <FiSearch className="ml-3 self-center text-nyxis-gray-400 h-5 w-5 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search products, brands..."
                className="flex-1 outline-none text-sm text-nyxis-dark bg-transparent py-2 px-1 placeholder:text-nyxis-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-nyxis-gray-400 hover:text-nyxis-dark"
              >
                <FiX className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Mobile Drawer ── */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden transition-opacity duration-300",
          isMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white transform transition-transform duration-300 flex flex-col shadow-modal",
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Menu Header */}
          <div className="bg-[#1F6F78] px-5 py-6 flex items-center justify-between shrink-0">
            <div>
              <Image src="/logo.png" alt="Nutry Bites" width={100} height={40} className="h-10 w-auto brightness-0 invert" />
              <p className="text-[#E6A15A] text-[0.65rem] tracking-[0.2em] uppercase mt-2 font-bold font-jost">Healthy Snacks Anytime</p>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1.5 text-white/60 hover:text-white transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* User Section */}
          <ClientOnly>
            <div className="px-5 py-4 border-b border-nyxis-gray-200 flex items-center justify-between shrink-0 bg-nyxis-50">
              {isAuthenticated ? (
                <div>
                  <p className="font-jost font-bold text-nyxis-dark text-sm">
                    Hi, {user?.name || "User"}
                  </p>
                  <p className="text-xs text-nyxis-gray-400">{user?.email}</p>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center gap-2 text-nyxis-500 font-jost font-semibold text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="h-4 w-4" />
                  Login / Register
                </Link>
              )}
              <Link
                href="/wishlist"
                className="p-2 text-nyxis-gray-400 hover:text-nyxis-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiHeart className="h-5 w-5" />
              </Link>
            </div>
          </ClientOnly>

          {/* Menu Items - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* NEW ARRIVALS */}
            <div className="bg-nyxis-500">
              <Link
                href="/products?productType=new"
                className="flex items-center justify-between px-5 py-3.5 hover:bg-nyxis-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="font-jost font-bold text-white text-sm tracking-wide">🍃 NEW ARRIVALS</span>
                <FiChevronRight className="h-4 w-4 text-white/60" />
              </Link>
            </div>

            {/* Categories */}
            {menuItems
              .filter((item) => !item.highlight)
              .map((item) => (
                <div key={item.name} className="border-b border-nyxis-gray-200">
                  {item.megaMenu ? (
                    <>
                      <button
                        onClick={() =>
                          setExpandedMobileMenu(
                            expandedMobileMenu === item.name ? null : item.name
                          )
                        }
                        className="flex items-center justify-between w-full px-5 py-3.5 text-nyxis-dark hover:bg-nyxis-50 transition-colors"
                      >
                        <span className="font-medium text-sm">{item.name}</span>
                        <FiChevronDown
                          className={cn(
                            "h-4 w-4 text-nyxis-gray-400 transition-transform duration-200",
                            expandedMobileMenu === item.name && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Submenu */}
                      <div
                        className={cn(
                          "bg-nyxis-50 overflow-hidden transition-all duration-300",
                          expandedMobileMenu === item.name
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="py-1">
                          <Link
                            href={item.href}
                            className="block px-7 py-2.5 text-nyxis-500 font-semibold text-sm hover:bg-nyxis-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Shop All {item.name}
                          </Link>
                          {item.megaMenu.categories.slice(1).map((cat) => (
                            <Link
                              key={cat.href}
                              href={cat.href}
                              className="block px-7 py-2.5 text-gray-600 text-sm hover:bg-nyxis-100 hover:text-nyxis-500"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center justify-between px-5 py-3.5 text-nyxis-dark hover:bg-nyxis-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="font-medium text-sm">{item.name}</span>
                      <FiChevronRight className="h-4 w-4 text-nyxis-gray-400" />
                    </Link>
                  )}
                </div>
              ))}

            {/* SALE */}
            <div className="bg-gradient-to-r from-nyxis-gold-dark to-nyxis-gold">
              <Link
                href="/products?sale=true"
                className="flex items-center justify-between px-5 py-3.5 hover:opacity-90 transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="font-jost font-bold text-nyxis-dark text-sm tracking-wide">🔥 CLEARANCE SALE</span>
                <FiChevronRight className="h-4 w-4 text-nyxis-dark/60" />
              </Link>
            </div>

            {/* Additional Links */}
            <div className="py-3 border-t border-nyxis-gray-200 mt-1">
              <Link
                href="/account/orders"
                className="flex items-center gap-3 px-5 py-2.5 text-gray-600 text-sm hover:text-nyxis-500 hover:bg-nyxis-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiTruck className="h-4 w-4" />
                Track Order
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 px-5 py-2.5 text-gray-600 text-sm hover:text-nyxis-500 hover:bg-nyxis-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiPhone className="h-4 w-4" />
                Contact Us
              </Link>
            </div>

            {/* Logout Button */}
            <ClientOnly>
              {isAuthenticated && (
                <div className="px-5 py-4 border-t border-nyxis-gray-200">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-red-500 font-medium text-sm hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <FiLogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </ClientOnly>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-nyxis-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-4 gap-1 safe-area-pb">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center py-2.5 transition-colors",
              pathname === "/" ? "text-nyxis-500" : "text-nyxis-gray-400"
            )}
          >
            <FiHome className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </Link>

          <Link
            href="/products"
            className={cn(
              "flex flex-col items-center justify-center py-2.5 transition-colors",
              pathname.includes("/products")
                ? "text-nyxis-500"
                : "text-nyxis-gray-400"
            )}
          >
            <FiGrid className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Shop</span>
          </Link>

          <Link
            href="/wishlist"
            className={cn(
              "flex flex-col items-center justify-center py-2.5 transition-colors",
              pathname === "/wishlist" ? "text-nyxis-500" : "text-nyxis-gray-400"
            )}
          >
            <FiHeart className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Wishlist</span>
          </Link>

          <ClientOnly>
            <Link
              href="/cart"
              className={cn(
                "flex flex-col items-center justify-center py-2.5 relative transition-colors",
                pathname === "/cart" ? "text-nyxis-500" : "text-nyxis-gray-400"
              )}
            >
              <div className="relative">
                <HiOutlineShoppingBag className="h-5 w-5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-nyxis-gold text-nyxis-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">Cart</span>
            </Link>
          </ClientOnly>
        </div>
      </div>


    </>
  );
}
