import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const SupplementStoreUI = () => {
  const router = useRouter();

  return (
    <div className="bg-white py-5 md:py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* ---- MOBILE IMAGE (small screens) ---- */}
        <div
          className="block md:hidden cursor-pointer rounded-2xl overflow-hidden shadow-xl"
          onClick={() => router.push("/products")}
        >
          <Image
            src={"/mob-1.png"}
            width={1000}
            height={450}
            alt="Nutry Bites Makhana"
            className="w-full h-auto object-cover aspect-[1000/450]"
          />
        </div>

        {/* ---- DESKTOP IMAGE (large screens) ---- */}
        <div
          className="hidden md:block cursor-pointer rounded-3xl overflow-hidden shadow-2xl"
          onClick={() => router.push("/products")}
        >
          <Image
            src={"/desk-1.png"}
            width={1900}
            height={400}
            alt="Nutry Bites Makhana"
            className="w-full h-auto object-cover aspect-[1900/400]"
          />
        </div>

      </div>
    </div>
  );
};

export default SupplementStoreUI;
