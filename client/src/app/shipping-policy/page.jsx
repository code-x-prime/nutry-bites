import Link from "next/link";

export const metadata = {
  title: "Shipping Policy – Nutry Bites",
  description: "Learn about Nutry Bites shipping timelines, delivery partners, and policies for makhana snack orders.",
};

const highlights = [
  { icon: "⚡", title: "Quick Dispatch", desc: "Orders dispatched within 0–3 business days" },
  { icon: "🌍", title: "Pan-India Delivery", desc: "We deliver to all major cities & towns" },
  { icon: "📦", title: "Secure Packaging", desc: "Food-safe, tamper-proof packaging always" },
  { icon: "🔔", title: "Live Tracking", desc: "Track your order via the confirmation email" },
];

const sections = [
  {
    title: "Dispatch Timeline",
    content: (
      <>
        <p>
          For domestic orders, we dispatch through registered courier companies and/or India Post Speed Post.
          Orders are typically shipped within <strong>0–3 business days</strong> from the date of payment confirmation.
        </p>
        <p className="mt-3">
          Delivery timelines post-dispatch:
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-2 text-gray-600">
          <li><strong>Metro cities</strong> (Delhi, Mumbai, Bangalore, etc.): 2–4 business days</li>
          <li><strong>Tier-2 & Tier-3 cities</strong>: 4–7 business days</li>
          <li><strong>Remote/rural areas</strong>: 7–10 business days</li>
        </ul>
      </>
    ),
  },
  {
    title: "Delivery Responsibility",
    content: (
      <p>
        <strong className="text-[#1F6F78]">Nutry Bites</strong> guarantees to hand over the consignment to the courier
        company within 0–3 business days of order confirmation. We are not liable for delays caused by the courier partner
        or postal authorities once the shipment has been handed over. Delivery timelines are estimates and not guaranteed.
      </p>
    ),
  },
  {
    title: "Delivery Address",
    content: (
      <p>
        All orders are delivered to the address provided at checkout. Please ensure your address, including pin code,
        is accurate. <strong className="text-[#1F6F78]">Nutry Bites</strong> is not responsible for failed deliveries
        due to incorrect or incomplete address information. A confirmation email will be sent to your registered email
        ID once your order is shipped.
      </p>
    ),
  },
  {
    title: "Free Shipping",
    content: (
      <>
        <p>We offer free shipping on orders above a minimum order value. Details:</p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>Free standard shipping on orders over <strong>₹999</strong></li>
          <li>Orders below ₹999 attract a nominal shipping fee at checkout</li>
          <li>Bulk / wholesale orders: contact us for custom shipping arrangements</li>
        </ul>
      </>
    ),
  },
  {
    title: "Lost or Undelivered Shipments",
    content: (
      <p>
        If your order is marked as delivered but you have not received it, please contact us within{" "}
        <strong>48 hours</strong> of the stated delivery date. We will raise a complaint with the courier partner
        and initiate an investigation. Replacements or refunds for lost shipments are handled on a case-by-case basis.
      </p>
    ),
  },
];

export default function ShippingPolicy() {
  return (
    <main className="min-h-screen bg-[#F8F5F2]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1F6F78] to-[#144D53] py-14 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-jost mb-3">Shipping Policy</h1>
          <p className="text-white/70 font-lato">
            Last updated: <strong className="text-white">July 14, 2025</strong>
          </p>
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-gray-100 text-center"
            >
              <div className="text-3xl mb-2">{h.icon}</div>
              <p className="font-bold text-gray-900 font-jost text-sm mb-1">{h.title}</p>
              <p className="text-gray-500 text-xs font-lato">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-10 pb-14">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Sections */}
          <div className="divide-y divide-gray-100">
            {sections.map((s, i) => (
              <div key={i} className="p-8 md:p-10">
                <h2 className="text-xl font-bold font-jost text-[#1F6F78] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-[#f0f9f8] rounded-lg flex items-center justify-center text-sm font-bold text-[#1F6F78] flex-shrink-0">
                    {i + 1}
                  </span>
                  {s.title}
                </h2>
                <div className="text-gray-700 font-lato leading-relaxed text-[15px]">
                  {s.content}
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="p-8 md:p-10 bg-[#f0f9f8] border-t border-gray-100 text-center">
            <p className="text-gray-600 font-lato mb-1">For any shipping-related queries, contact us at</p>
            <a href="mailto:nutrybites@gmail.com" className="text-[#1F6F78] font-bold hover:text-[#E6A15A] transition-colors">
              nutrybites@gmail.com
            </a>
            <div className="mt-5">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#1F6F78] text-white font-bold rounded-full hover:bg-[#E6A15A] transition-colors duration-300 shadow-lg shadow-[#1F6F78]/20"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
