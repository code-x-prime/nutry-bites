import { FiStar, FiTruck, FiUsers, FiLock } from "react-icons/fi";

const BenefitsSec = () => {
  const benefits = [
    {
      title: "Premium Quality",
      description:
        "Carefully sourced and roasted makhana made with high-quality ingredients for a crunchy experience.",
      icon: FiStar,
    },
    {
      title: "Fast Delivery",
      description:
        "Get your healthy snacks delivered to your doorstep within 2-3 business days.",
      icon: FiTruck,
    },
    {
      title: "Nutrition Support",
      description:
        "Our team of health enthusiasts is available to help you choose the perfect snacks for your diet.",
      icon: FiUsers,
    },
    {
      title: "Secure Payments",
      description: "Shop with confidence with our 100% secure payment gateway.",
      icon: FiLock,
    },
  ];

  return (
    <section className="bg-[#144D53] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-jost text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
            Why Choose Nutry Bites
          </h2>
          <p className="text-white/50 text-sm mt-2">
            We&apos;re committed to providing you with the best snacking experience
          </p>
          <div className="w-10 h-[3px] bg-gradient-to-r from-[#1F6F78] to-[#E6A15A] rounded mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-[#1F6F78]/40 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#1F6F78]/20 rounded-xl flex items-center justify-center mb-4">
                  <IconComponent className="h-6 w-6 text-[#E6A15A]" strokeWidth={1.5} />
                </div>
                <h3 className="font-jost font-bold text-white text-base mb-2">
                  {benefit.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSec;
