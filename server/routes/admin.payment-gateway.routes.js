import express from "express";
import {
    getPaymentGatewaySettings,
    getPaymentGatewaySetting,
    upsertPaymentGatewaySetting,
    deletePaymentGatewaySetting,
    getDecryptedPaymentKeys,
} from "../controllers/admin.payment-gateway.controller.js";
import {
    verifyAdminJWT,
} from "../middlewares/admin.middleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdminJWT);

// Shortcut: Get current admin's own payment gateway settings
// Must be BEFORE /:userId to prevent "me" being treated as a userId param
router.get("/payment-gateway-settings/me", (req, res, next) => {
    req.params.userId = req.admin?.id || "me";
    return getPaymentGatewaySettings(req, res, next);
});

// Get all payment gateway settings for a user
router.get("/payment-gateway-settings/:userId", getPaymentGatewaySettings);

// Get specific gateway setting
router.get(
    "/payment-gateway-settings/:userId/:gateway",
    getPaymentGatewaySetting
);

// Create or Update payment gateway setting
router.post(
    "/payment-gateway-settings/:userId",
    upsertPaymentGatewaySetting
);
router.put(
    "/payment-gateway-settings/:userId",
    upsertPaymentGatewaySetting
);

// Delete payment gateway setting
router.delete(
    "/payment-gateway-settings/:userId/:gateway",
    deletePaymentGatewaySetting
);

// Get decrypted keys (backend internal use)
router.get(
    "/payment-gateway-settings/:userId/:gateway/keys",
    getDecryptedPaymentKeys
);

export default router;
