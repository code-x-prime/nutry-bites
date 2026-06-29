"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaTimesCircle,
  FaArrowLeft,
  FaShoppingCart,
  FaPhoneAlt,
} from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get("error") || "Payment was not completed";
  const code = searchParams.get("code") || "";
  const transactionId = searchParams.get("transactionId") || "";

  const friendlyMessages = {
    PAYMENT_ERROR: "There was an error processing your payment. Please try again.",
    PAYMENT_PENDING: "Your payment is still pending. Please check your PhonePe app.",
    TIMED_OUT: "Payment timed out. Please try again.",
    BAD_REQUEST: "Invalid payment request. Please try again.",
    AUTHORIZATION_FAILED: "Payment authorization failed. Please try a different payment method.",
    INTERNAL_SERVER_ERROR: "PhonePe server error. Please try again in a few minutes.",
  };

  const displayMessage = code && friendlyMessages[code]
    ? friendlyMessages[code]
    : decodeURIComponent(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-[32px] shadow-2xl p-10 text-center">
        <div className="h-28 w-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaTimesCircle className="h-14 w-14 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-2">We were unable to process your payment.</p>

        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-red-700 font-medium mb-1">Reason:</p>
          <p className="text-sm text-red-600">{displayMessage}</p>
          {code && (
            <p className="text-xs text-red-400 mt-1">Code: {code}</p>
          )}
        </div>

        {transactionId && (
          <div className="bg-gray-50 rounded-xl p-3 mb-6 text-sm">
            <p className="text-gray-500 text-xs mb-1">Transaction ID (for support)</p>
            <p className="font-mono font-medium text-gray-700 break-all">{transactionId}</p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left text-sm text-amber-800">
          <p className="font-semibold mb-2">What you can do:</p>
          <ul className="space-y-1 list-disc list-inside text-amber-700">
            <li>Check if your bank account was debited</li>
            <li>Try again with a different payment method</li>
            <li>Contact your bank if the amount was deducted</li>
            <li>Use COD (Cash on Delivery) as an alternative</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/checkout")}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1F6F78] text-white rounded-xl font-semibold hover:bg-[#144D53] transition-colors"
          >
            <FaArrowLeft size={14} />
            Try Again
          </button>

          <Link href="/cart" className="w-full">
            <button className="flex items-center justify-center gap-2 w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              <FaShoppingCart size={16} />
              Back to Cart
            </button>
          </Link>

          <Link href="/contact" className="w-full">
            <button className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 rounded-xl font-medium hover:text-gray-700 transition-colors text-sm">
              <FaPhoneAlt size={12} />
              Contact Support
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <ImSpinner2 className="h-12 w-12 animate-spin text-[#1F6F78]" />
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
