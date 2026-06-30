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
 * Get V2 OAuth Access Token
 */
async function getV2Token(clientId, clientSecret, clientVersion = "1", mode) {
  const tokenUrl = mode === "LIVE"
    ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_version", clientVersion || "1");
  params.append("client_secret", clientSecret);
  params.append("grant_type", "client_credentials");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "accept": "application/json",
    },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data?.message || `Failed to fetch PhonePe access token: ${response.status}`);
  }
  return data.access_token;
}

/**
 * Initiate a PhonePe payment (Supports both V1 and V2)
 */
export async function initiatePhonePePayment({
  authMethod = "V1",
  merchantId,
  saltKey,
  saltIndex,
  clientId,
  clientSecret,
  clientVersion = "1",
  mode = "TEST",
  transactionId,
  amountInPaise,
  redirectUrl,
  callbackUrl,
  mobileNumber,
  userId,
}) {
  const isV2 = authMethod === "V2" && clientId && clientSecret;

  if (isV2) {
    const accessToken = await getV2Token(clientId, clientSecret, clientVersion || "1", mode);

    const apiUrl = mode === "LIVE"
      ? "https://api.phonepe.com/apis/pg/checkout/v2/pay"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

    const requestBody = {
      merchantOrderId: transactionId,
      amount: amountInPaise,
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: redirectUrl,
        },
      },
    };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `O-Bearer ${accessToken}`,
      "accept": "application/json",
    };

    if (callbackUrl) {
      headers["X-CALLBACK-URL"] = callbackUrl;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok || !data.redirectUrl) {
      throw new Error(
        data?.message || `PhonePe V2 API error: ${response.status}`
      );
    }

    // Wrap V2 response to fit V1 structure expected by backend
    return {
      success: true,
      data: {
        redirectInfo: {
          url: data.redirectUrl,
        },
      },
    };
  }

  // --- V1 Flow (Fallback) ---
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
 * Check PhonePe payment status (Supports both V1 and V2)
 */
export async function checkPhonePeStatus({
  authMethod = "V1",
  merchantId,
  saltKey,
  saltIndex,
  clientId,
  clientSecret,
  clientVersion = "1",
  mode = "TEST",
  transactionId,
}) {
  const isV2 = authMethod === "V2" && clientId && clientSecret;

  if (isV2) {
    const accessToken = await getV2Token(clientId, clientSecret, clientVersion || "1", mode);

    const baseUrl = mode === "LIVE"
      ? "https://api.phonepe.com/apis/pg/checkout/v2/order"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order";

    const apiUrl = `${baseUrl}/${transactionId}/status`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${accessToken}`,
        "accept": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.state) {
      throw new Error(
        data?.message || `PhonePe V2 Status API error: ${response.status}`
      );
    }

    // Map V2 state to V1 format expected by the backend verify function
    const isCompleted = data.state === "COMPLETED";
    const isFailed = data.state === "FAILED";

    return {
      success: isCompleted,
      code: isCompleted ? "PAYMENT_SUCCESS" : (isFailed ? "PAYMENT_FAILED" : "PAYMENT_PENDING"),
      message: data.state || "Payment status checked",
      data: {
        merchantTransactionId: transactionId,
        amount: data.amount,
      },
    };
  }

  // --- V1 Flow (Fallback) ---
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

