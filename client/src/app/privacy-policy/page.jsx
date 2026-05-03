import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – Nutry Bites",
  description: "Read the Nutry Bites Privacy Policy to understand how we collect, use and protect your personal data.",
};

const sections = [
  {
    title: "Information We Collect",
    content: (
      <>
        <p>We may collect the following information when you use our website or place an order:</p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>Name, email address, and phone number</li>
          <li>Shipping and billing address</li>
          <li>Payment information (processed securely via third-party gateways)</li>
          <li>Demographic data such as postal code, preferences, and interests</li>
          <li>Usage data: pages visited, device type, and browsing behaviour</li>
        </ul>
      </>
    ),
  },
  {
    title: "How We Use Your Information",
    content: (
      <>
        <p>We use your data to provide a better experience and improve our services:</p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>Process and fulfil your snack orders</li>
          <li>Send order confirmations and shipping updates</li>
          <li>Personalise your shopping experience</li>
          <li>Send promotional offers and new product launches (with your consent)</li>
          <li>Improve our website and product range based on feedback</li>
        </ul>
      </>
    ),
  },
  {
    title: "How We Use Cookies",
    content: (
      <p>
        We use cookies to analyse website traffic and remember your preferences. Cookies help us tailor the site to your needs.
        You can disable cookies in your browser settings, though this may affect site functionality.
        We only use cookies for statistical analysis; no personal data is stored without your consent.
      </p>
    ),
  },
  {
    title: "Data Security",
    content: (
      <p>
        Nutry Bites is committed to ensuring your information is secure. We implement appropriate technical and
        organisational measures to prevent unauthorised access, disclosure, alteration, or destruction of your personal data.
        Payment information is always processed via encrypted, PCI-compliant gateways.
      </p>
    ),
  },
  {
    title: "Controlling Your Personal Information",
    content: (
      <>
        <p>You have full control over your personal data:</p>
        <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-600">
          <li>Opt out of marketing emails by clicking &quot;Unsubscribe&quot; in any email</li>
          <li>Request to view, update, or delete your data by emailing us</li>
          <li>We will never sell, rent, or trade your personal information to third parties</li>
        </ul>
        <p className="mt-3">
          To exercise your rights, contact us at{" "}
          <a href="mailto:nutrybites@gmail.com" className="text-[#1F6F78] font-semibold hover:text-[#E6A15A] transition-colors">
            nutrybites@gmail.com
          </a>
        </p>
      </>
    ),
  },
  {
    title: "Policy Updates",
    content: (
      <p>
        Nutry Bites may update this policy from time to time. Any changes will be posted on this page with an updated date.
        We encourage you to review this page periodically to stay informed about how we protect your information.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#F8F5F2]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1F6F78] to-[#144D53] py-14 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-jost mb-3">Privacy Policy</h1>
          <p className="text-white/70 font-lato">
            Last updated: <strong className="text-white">July 14, 2025</strong>
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Intro */}
          <div className="p-8 md:p-10 border-b border-gray-100">
            <p className="text-lg text-gray-700 font-lato leading-relaxed">
              This Privacy Policy sets out how{" "}
              <strong className="text-[#1F6F78]">Nutry Bites</strong> uses and protects any information
              that you provide when you visit our website and/or purchase from us. We are committed to
              ensuring that your privacy is protected and your data is handled responsibly.
            </p>
          </div>

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
            <p className="text-gray-600 font-lato mb-4">
              Have questions about our privacy practices?
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1F6F78] text-white font-bold rounded-full hover:bg-[#E6A15A] transition-colors duration-300 shadow-lg shadow-[#1F6F78]/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
