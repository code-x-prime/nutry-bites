import Link from "next/link";

export const metadata = {
  title: "Cancellation Policy – Nutry Bites",
  description: "Understand the Nutry Bites cancellation policy for healthy makhana snack orders.",
};

const sections = [
  {
    icon: "🔄",
    title: "Order Cancellation",
    content: (
      <>
        <p>
          <strong className="text-[#1F6F78]">Nutry Bites</strong> believes in helping its customers as much as possible
          and has a liberal cancellation policy:
        </p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>Cancellations are accepted only if the request is made <strong>within the same day</strong> of placing the order.</li>
          <li>If the order has already been communicated to our fulfilment team or dispatched, cancellation may not be possible.</li>
          <li>Once an order is shipped, it cannot be cancelled. Returns are eligible for 1 days once the delivery is made. For any issue, reach out to us via email and valid proof.</li>
        </ul>
      </>
    ),
  },
  {
    icon: "📦",
    title: "Shipped & Perishable Items",
    content: (
      <p>
        Nutry Bites does not accept cancellations for perishable items like roasted makhana once they have been shipped. 
        In case of issues with delivery, damaged packaging, or defective products, please refer to our 
        <Link href="/refund-policy" className="text-[#1F6F78] font-semibold hover:underline mx-1">
          Refund Policy
        </Link>
        for return or replacement options.
      </p>
    ),
  },
  {
    icon: "📞",
    title: "How to Cancel Your Order",
    content: (
      <>
        <p>To request a cancellation:</p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>Email us at <a href="mailto:support@nutrybites.co.in" className="text-[#1F6F78] font-semibold hover:text-[#E6A15A] transition-colors">support@nutrybites.co.in</a> with your order number and request.</li>
          <li>Or call/WhatsApp us at <strong className="text-gray-900">8910072220</strong> for immediate assistance during support hours.</li>
          <li>Our customer support team will confirm your cancellation status as soon as possible.</li>
        </ul>
      </>
    ),
  },
];

export default function CancellationPolicy() {
  return (
    <main className="min-h-screen bg-[#F8F5F2]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1F6F78] to-[#144D53] py-14 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-jost mb-3">Cancellation Policy</h1>
          <p className="text-white/70 font-lato">
            Last updated: <strong className="text-white">June 22, 2026</strong>
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Intro */}
          <div className="p-8 md:p-10 border-b border-gray-100">
            <p className="text-lg text-gray-700 font-lato leading-relaxed">
              At <strong className="text-[#1F6F78]">Nutry Bites</strong>, we understand that plans change. 
              If you need to cancel your order, we are here to help make the process as simple as possible.
              Please read our cancellation policy guidelines below.
            </p>
          </div>

          {/* Sections */}
          <div className="divide-y divide-gray-100">
            {sections.map((s, i) => (
              <div key={i} className="p-8 md:p-10">
                <h2 className="text-xl font-bold font-jost text-[#1F6F78] mb-4 flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
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
            <p className="text-gray-600 font-lato mb-4">
              Need to cancel an order urgently? Get in touch with our team.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1F6F78] text-white font-bold rounded-full hover:bg-[#E6A15A] transition-colors duration-300 shadow-lg shadow-[#1F6F78]/20"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
