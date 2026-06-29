import express from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  getPaymentSettings,
  getRazorpayKey,
  checkout,
  paymentVerification,
  getOrderHistory,
  getOrderDetails,
  cancelOrder,
  createCashOrder,
  phonePeCallback,
  getShippingRates,
  initPhonePePayment,
  verifyPhonePePayment,
  phonePeWebhook,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Public route - Get payment settings
router.get("/settings", getPaymentSettings);

// PhonePe callback (public route - called by PhonePe - legacy)
router.post("/phonepe-callback", phonePeCallback);

// PhonePe webhook (public - server to server callback from PhonePe)
router.post("/phonepe/webhook", phonePeWebhook);

// PhonePe verify/redirect URL (public - PhonePe redirects here after payment)
// This is a GET because PhonePe does a browser redirect to this URL
router.get("/phonepe/verify", verifyPhonePePayment);

// All other payment routes require authentication
router.use(verifyJWTToken);

// Get Razorpay key
router.get("/razorpay-key", getRazorpayKey);

// Create order (checkout) - Razorpay
router.post("/checkout", checkout);

// Verify Razorpay payment
router.post("/verify", paymentVerification);

// Create Cash on Delivery order
router.post("/cash-order", createCashOrder);

// PhonePe: Initiate payment (authenticated - user must be logged in)
router.post("/phonepe/initiate", initPhonePePayment);

// Get live Shiprocket courier rates for a delivery address
router.post("/shipping-rates", getShippingRates);

// Order history
router.get("/orders", getOrderHistory);

// Order details
router.get("/orders/:orderId", getOrderDetails);

// Cancel order
router.post("/orders/:orderId/cancel", cancelOrder);

export default router;
