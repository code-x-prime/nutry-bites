"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaCheckCircle,
  FaGift,
  FaShoppingBag,
} from "react-icons/fa";
import {
  FaCircleInfo,
} from "react-icons/fa6";
import { ImSpinner2 } from "react-icons/im";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const transactionId = searchParams.get("transactionId");
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");
  const pendingOrder = searchParams.get("pendingOrder");
  const alreadyProcessed = searchParams.get("alreadyProcessed");

  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push("/account/orders");
    }
  }, [countdown, router]);

  if (pendingOrder === "true") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-[32px] shadow-2xl p-10 text-center">
          <div className="h-24 w-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCircleInfo className="h-12 w-12 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Received!</h1>
          <p className="text-gray-600 mb-4">
            Your payment was successful. Our team will process your order shortly and you will receive a confirmation email.
          </p>
          {transactionId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6 text-sm">
              <p className="text-gray-500">Transaction ID</p>
              <p className="font-mono font-medium text-gray-800">{transactionId}</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-6">
            If you have any questions, contact support with your Transaction ID above.
          </p>
          <Link href="/account/orders">
            <button className="w-full py-3 bg-[#1F6F78] text-white rounded-xl font-semibold hover:bg-[#144D53] transition-colors">
              View My Orders
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-[32px] shadow-2xl p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1F6F78]/5 to-transparent pointer-events-none" />

        <div className="relative">
          <div className="relative flex justify-center mb-6">
            <div
              className={`h-32 w-32 bg-[#1F6F78]/10 rounded-full flex items-center justify-center transition-all duration-700 ${
                showConfetti ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            >
              <FaCheckCircle className="h-16 w-16 text-[#1F6F78]" />
            </div>
            {showConfetti && (
              <>
                <div className="animate-ping absolute h-36 w-36 rounded-full bg-[#1F6F78] opacity-10" />
              </>
            )}
          </div>

          <h1
            className={`text-4xl font-bold mb-2 text-gray-800 transition-all duration-500 ${
              showConfetti ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Woohoo!
          </h1>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            {alreadyProcessed === "true" ? "Order Already Confirmed" : "Order Confirmed!"}
          </h2>

          {orderNumber && (
            <div className="bg-[#1F6F78]/10 py-2 px-6 rounded-full inline-block mb-4">
              <p className="text-lg font-semibold text-[#1F6F78]">Order #{orderNumber}</p>
            </div>
          )}

          <div className="flex items-center justify-center bg-green-50 p-4 rounded-xl mb-6">
            <FaCheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
            <p className="text-green-700 font-medium">Payment Successful via PhonePe ✓</p>
          </div>

          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Thank you for your purchase! Your order has been confirmed and you&apos;ll receive an email shortly.
            Our team will prepare your order and ship it soon.
          </p>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ImSpinner2 className="h-4 w-4 text-blue-500 animate-spin" />
              <p className="text-blue-700 text-sm">
                Redirecting to orders page in {countdown} seconds...
              </p>
            </div>
            <Link href="/account/orders">
              <button className="text-blue-600 hover:text-blue-800 text-sm underline">
                Go to orders now →
              </button>
            </Link>
          </div>

          <div className="flex justify-center gap-3">
            <Link href="/account/orders">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#1F6F78] text-white rounded-xl font-semibold hover:bg-[#144D53] transition-colors">
                <FaShoppingBag size={16} />
                My Orders
              </button>
            </Link>
            <Link href="/products">
              <button className="flex items-center gap-2 px-6 py-3 border-2 border-[#1F6F78] text-[#1F6F78] rounded-xl font-semibold hover:bg-[#1F6F78]/5 transition-colors">
                <FaGift size={16} />
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <ImSpinner2 className="h-12 w-12 animate-spin text-[#1F6F78]" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
