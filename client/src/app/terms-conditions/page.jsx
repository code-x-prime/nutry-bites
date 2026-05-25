import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions – Nutry Bites",
  description: "Read the Terms & Conditions for using the Nutry Bites website and purchasing our healthy makhana snacks.",
};

const terms = [
  "The content of the pages of this website is subject to change without notice.",
  "Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness, or suitability of the information and materials found on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.",
  "Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services, or information available through our website meet your specific requirements.",
  "Our website contains material owned by or licensed to us. This includes, but is not limited to, the design, layout, look, appearance, and graphics. Reproduction is prohibited other than in accordance with the copyright notice that forms part of these terms and conditions.",
  "All trade marks reproduced on our website that are not the property of, or licensed to, the operator are acknowledged on the website.",
  "Unauthorised use of information provided by us may give rise to a claim for damages and/or be a criminal offence.",
  "From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information and do not signify that we endorse those website(s).",
  `You may not create a link to our website from another website or document without Nutry Bites's prior written consent.`,
  "Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India.",
  "We shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorisation for any transaction, on account of the cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.",
];

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-[#F8F5F2]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1F6F78] to-[#144D53] py-14 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-jost mb-3 text-white">Terms & Conditions</h1>
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
              For the purpose of these Terms and Conditions, the terms{" "}
              <strong>&quot;we&quot;, &quot;us&quot;, &quot;our&quot;</strong> refer to{" "}
              <strong className="text-[#1F6F78]">Nutry Bites</strong>, whose registered office is located at{" "}
              <strong>-6/7 A, ACHARYYA JADADISH CHANDRA BOSE ROAD, KOLKATA -700017.</strong>{" "}
              <strong>&quot;you&quot;, &quot;your&quot;, &quot;user&quot;</strong> refers to any natural or legal
              person who visits our website and/or purchases from us.
            </p>
            <p className="mt-4 text-gray-700 font-lato leading-relaxed">
              Your use of the website and/or purchase from us are governed by the following Terms and Conditions:
            </p>
          </div>

          {/* Terms list */}
          <div className="p-8 md:p-10">
            <ol className="space-y-6">
              {terms.map((term, i) => (
                <li key={i} className="flex gap-4">
                  <span className="w-8 h-8 bg-[#f0f9f8] rounded-lg flex items-center justify-center text-sm font-bold text-[#1F6F78] flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-gray-700 font-lato leading-relaxed text-[15px]">{term}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Governing Law */}
          <div className="p-8 md:p-10 border-t border-gray-100 bg-[#f8f5f2]">
            <h2 className="text-xl font-bold font-jost text-[#1F6F78] mb-3">Governing Law</h2>
            <p className="text-gray-700 font-lato leading-relaxed text-[15px]">
              These Terms and Conditions are governed by and construed in accordance with the laws of India.
              Any disputes relating to these terms and conditions shall be subject to the exclusive jurisdiction
              of the courts of Kolkata, West Bengal, India.
            </p>
          </div>

          {/* Footer CTA */}
          <div className="p-8 md:p-10 bg-[#f0f9f8] border-t border-gray-100 text-center">
            <p className="text-gray-600 font-lato mb-4">
              Questions about our terms? We&apos;re here to help.
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
