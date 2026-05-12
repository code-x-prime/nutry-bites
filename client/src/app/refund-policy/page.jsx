import Link from "next/link";

export const metadata = {
  title: "Refund & Cancellation Policy – Nutry Bites",
  description: "Understand the Nutry Bites refund and cancellation policy for healthy makhana snack orders.",
};

const sections = [
  {
    icon: "🔄",
    title: "Cancellation Policy",
    content: (
      <>
        <p>
          <strong className="text-[#1F6F78]">Nutry Bites</strong> believes in helping its customers as much as possible
          and has a liberal cancellation policy:
        </p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>Cancellations are accepted only if the request is made <strong>within the same day</strong> of placing the order.</li>
          <li>If the order has already been communicated to our fulfilment team or dispatched, cancellation may not be possible.</li>
          <li>Once an order is shipped, it cannot be cancelled — only a return/replacement can be initiated.</li>
        </ul>
      </>
    ),
  },
  {
    icon: "📦",
    title: "Damaged or Defective Products",
    content: (
      <>
        <p>
          <strong className="text-[#1F6F78]">Nutry Bites</strong> does not accept cancellation for perishable items like
          roasted makhana once shipped. However, a <strong>refund or replacement</strong> will be provided if:
        </p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>The product received is damaged, defective, or tampered with.</li>
          <li>The quality is significantly different from what was advertised.</li>
          <li>You report the issue to our Customer Service <strong>within 24 hours</strong> of delivery with photo/video proof.</li>
        </ul>
      </>
    ),
  },
  {
    icon: "🔍",
    title: "Product Not as Described",
    content: (
      <p>
        If you feel the product received is not as shown on the website or does not meet your expectations, please notify
        our customer service team on the <strong>same day of delivery</strong>. Our team will review your complaint and take an
        appropriate decision, which may include a replacement or refund.
      </p>
    ),
  },
  {
    icon: "💰",
    title: "Refund Timeline",
    content: (
      <p>
        In case of refunds approved by <strong className="text-[#1F6F78]">Nutry Bites</strong>, the amount will be
        credited back to your original payment method within <strong>3–5 business days</strong>. Bank processing times
        may vary. UPI and wallet refunds are typically faster.
      </p>
    ),
  },
  {
    icon: "📞",
    title: "How to Raise a Request",
    content: (
      <>
        <p>To raise a refund or replacement request:</p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>Email us at <a href="mailto:nutrybitesstore@gmail.com" className="text-[#1F6F78] font-semibold hover:text-[#E6A15A] transition-colors">nutrybitesstore@gmail.com</a> with your order number</li>
          <li>Attach clear photos or a video of the issue</li>
          <li>Our team will respond within 24–48 business hours</li>
        </ul>
      </>
    ),
  },
];

export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-[#F8F5F2]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1F6F78] to-[#144D53] py-14 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-jost mb-3">Refund & Cancellation Policy</h1>
          <p className="text-white/70 font-lato">
            Last updated: <strong className="text-white">May 12, 2026</strong>
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Intro */}
          <div className="p-8 md:p-10 border-b border-gray-100">
            <p className="text-lg text-gray-700 font-lato leading-relaxed">
              At <strong className="text-[#1F6F78]">Nutry Bites</strong>, your satisfaction is our priority.
              We want you to love every bite. If something goes wrong, we&apos;re here to make it right.
              Please read our refund and cancellation policy below.
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
              Have an issue with your order? We&apos;re happy to help.
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
