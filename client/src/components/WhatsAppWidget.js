"use client";

import Image from "next/image";

export function WhatsAppWidget() {
  const phoneNumber = "918910072220";
  const message = "Hi! I would like to know more about Nutry Bites.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-40 transition-all duration-300 hover:scale-110 active:scale-95 group
        bottom-20 right-5 
        lg:bottom-6 lg:right-6
        drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:drop-shadow-[0_8px_16px_rgba(37,211,102,0.3)]"
      aria-label="Contact us on WhatsApp"
    >
      {/* Pulse effect background */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20 animate-ping" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-gray-100">
        Chat with us!
      </span>

      <div className="relative w-14 h-14 md:w-16 md:h-16">
        <Image
          src="/whatsapp.png"
          alt="WhatsApp"
          fill
          sizes="(max-width: 768px) 56px, 64px"
          className="object-contain"
          priority
        />
      </div>
    </a>
  );
}
