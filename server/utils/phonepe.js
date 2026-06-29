import crypto from "crypto";
import fetch from "node-fetch";

// PhonePe API Endpoints
const PHONEPE_ENDPOINTS = {
  TEST: {
    pay: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
    status: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status",
  },
  LIVE: {
    pay: "https://api.phonepe.com/apis/hermes/pg/v1/pay",
    status: "https://api.phonepe.com/apis/hermes/pg/v1/status",
  },
};

/**
 * Generate X-VERIFY checksum for PhonePe API
 * @param {string} payload - Base64 encoded payload
 * @param {string} endpoint - API endpoint path (e.g. "/pg/v1/pay")
 * @param {string} saltKey - PhonePe Salt Key
 * @param {string|number} saltIndex - PhonePe Salt Index
 */
export function generateChecksum(payload, endpoint, saltKey, saltIndex) {
  const dataToHash = payload + endpoint + saltKey;
  const sha256 = crypto.createHash("sha256").update(dataToHash).digest("hex");
  return `${sha256}###${saltIndex}`;
}

/**
 * Initiate a PhonePe payment
 * @param {Object} params
 * @param {string} params.merchantId
 * @param {string} params.saltKey
 * @param {string|number} params.saltIndex
 * @param {string} params.mode - "TEST" | "LIVE"
 * @param {string} params.transactionId - Unique transaction ID
 * @param {number} params.amountInPaise - Amount in paise (INR * 100)
 * @param {string} params.redirectUrl - URL to redirect after payment
 * @param {string} params.callbackUrl - Webhook callback URL
 * @param {string} params.mobileNumber - User's mobile number (optional)
 * @param {string} params.userId - User ID
 */
export async function initiatePhonePePayment({
  merchantId,
  saltKey,
  saltIndex,
  mode = "TEST",
  transactionId,
  amountInPaise,
  redirectUrl,
  callbackUrl,
  mobileNumber,
  userId,
}) {
  const payloadData = {
    merchantId,
    merchantTransactionId: transactionId,
    merchantUserId: `MUID_${userId.slice(-8)}`,
    amount: amountInPaise,
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl,
    mobileNumber: mobileNumber || undefined,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payloadData)).toString("base64");
  const endpoint = "/pg/v1/pay";
  const checksum = generateChecksum(base64Payload, endpoint, saltKey, saltIndex);

  const apiUrl = PHONEPE_ENDPOINTS[mode]?.pay || PHONEPE_ENDPOINTS.TEST.pay;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      accept: "application/json",
    },
    body: JSON.stringify({ request: base64Payload }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data?.message || `PhonePe API error: ${response.status}`
    );
  }

  return data;
}

/**
 * Check PhonePe payment status
 * @param {Object} params
 * @param {string} params.merchantId
 * @param {string} params.saltKey
 * @param {string|number} params.saltIndex
 * @param {string} params.mode - "TEST" | "LIVE"
 * @param {string} params.transactionId - Unique transaction ID
 */
export async function checkPhonePeStatus({
  merchantId,
  saltKey,
  saltIndex,
  mode = "TEST",
  transactionId,
}) {
  const endpoint = `/pg/v1/status/${merchantId}/${transactionId}`;
  const checksum = generateChecksum("", endpoint, saltKey, saltIndex);

  const baseUrl =
    mode === "LIVE"
      ? PHONEPE_ENDPOINTS.LIVE.status
      : PHONEPE_ENDPOINTS.TEST.status;

  const apiUrl = `${baseUrl}/${merchantId}/${transactionId}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": merchantId,
      accept: "application/json",
    },
  });

  const data = await response.json();
  return data;
}
