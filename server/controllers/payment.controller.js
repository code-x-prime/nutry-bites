import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";
import { getOrderConfirmationTemplate } from "../email/temp/EmailTemplate.js";
import { getFileUrl } from "../utils/deleteFromS3.js";
import { processReferralReward } from "./referral.controller.js";
import { decrypt } from "../utils/encryption.js";
import { processOrderForShipping, checkServiceability, getDefaultPickupAddress, isShiprocketEnabled } from "../utils/shiprocket.js";
import { getStoreConfigFromDb } from "../utils/storeConfig.js";
import { applyFlashSalePrice } from "../utils/flashSaleHelpers.js";
import { initiatePhonePePayment, checkPhonePeStatus } from "../utils/phonepe.js";


async function getPaymentGatewayConfig(userId = null, gateway = "RAZORPAY") {

  let paymentSettings;

  if (userId) {
    paymentSettings = await prisma.paymentGatewaySetting.findUnique({
      where: {
        userId_gateway: {
          userId,
          gateway: gateway.toUpperCase(),
        },
      },
    });
  }

  if (!paymentSettings) {
    paymentSettings = await prisma.paymentGatewaySetting.findFirst({
      where: {
        gateway: gateway.toUpperCase(),
        isActive: true,
      },
    });
  }

  // Fallback to SiteSettings for Razorpay when no PaymentGatewaySetting
  if ((!paymentSettings || !paymentSettings.isActive) && gateway.toUpperCase() === "RAZORPAY") {
    const siteSettings = await prisma.siteSettings.findFirst();
    if (siteSettings?.razorpayEnabled && siteSettings?.razorpayKeyId && siteSettings?.razorpayKeySecret) {
      let decryptedSecret;
      try {
        decryptedSecret = decrypt(siteSettings.razorpayKeySecret.startsWith("enc:")
          ? siteSettings.razorpayKeySecret.replace("enc:", "")
          : siteSettings.razorpayKeySecret);
      } catch (e) {
        decryptedSecret = siteSettings.razorpayKeySecret;
      }
      return {
        razorpayInstance: new Razorpay({
          key_id: siteSettings.razorpayKeyId,
          key_secret: decryptedSecret,
        }),
        paymentSettings: {
          gateway: "RAZORPAY",
          mode: "LIVE",
          userId: null,
          razorpayKeyId: siteSettings.razorpayKeyId,
          razorpayKeySecret: decryptedSecret,
        },
      };
    }
  }

  if (!paymentSettings || !paymentSettings.isActive) {
    throw new ApiError(
      400,
      `Payment gateway ${gateway} is not configured or not active. Please configure payment gateway keys in admin settings.`
    );
  }

  if (gateway.toUpperCase() === "RAZORPAY") {
    if (!paymentSettings.razorpayKeyId || !paymentSettings.razorpayKeySecret) {
      throw new ApiError(400, "Razorpay keys are not configured. Please configure Razorpay Key ID and Key Secret in Payment Gateway Settings.");
    }

    let decryptedSecret;
    try {
      decryptedSecret = decrypt(paymentSettings.razorpayKeySecret);
      if (!decryptedSecret || decryptedSecret.trim() === "") {
        throw new Error("Decrypted secret is empty");
      }
    } catch (decryptError) {
      console.error("Error decrypting Razorpay key secret:", decryptError);
      throw new ApiError(400, "Failed to decrypt Razorpay key secret. Please reconfigure your Razorpay keys.");
    }

    let razorpayInstance;
    try {
      razorpayInstance = new Razorpay({
        key_id: paymentSettings.razorpayKeyId,
        key_secret: decryptedSecret,
      });
    } catch (razorpayError) {
      console.error("Error initializing Razorpay:", razorpayError);
      throw new ApiError(400, `Failed to initialize Razorpay: ${razorpayError.message || "Invalid keys"}`);
    }

    return {
      razorpayInstance,
      paymentSettings: {
        gateway: paymentSettings.gateway,
        mode: paymentSettings.mode,
        userId: paymentSettings.userId,
        razorpayKeyId: paymentSettings.razorpayKeyId,
        razorpayKeySecret: decryptedSecret,
      },
    };
  }

  // For PhonePe, return settings without Razorpay instance
  return {
    razorpayInstance: null,
    paymentSettings: {
      gateway: paymentSettings.gateway,
      mode: paymentSettings.mode,
      userId: paymentSettings.userId,
      phonepeMerchantId: paymentSettings.phonepeMerchantId,
      phonepeSaltKey: paymentSettings.phonepeSaltKey
        ? decrypt(paymentSettings.phonepeSaltKey)
        : null,
      phonepeSaltIndex: paymentSettings.phonepeSaltIndex,
      phonepeAuthMethod: paymentSettings.phonepeAuthMethod || "V1",
      phonepeClientId: paymentSettings.phonepeClientId,
      phonepeClientSecret: paymentSettings.phonepeClientSecret
        ? decrypt(paymentSettings.phonepeClientSecret)
        : null,
      phonepeClientVersion: paymentSettings.phonepeClientVersion || "1",
    },
  };
}

// Get payment settings (public endpoint for checkout page)
export const getPaymentSettings = asyncHandler(async (req, res) => {
  // Get or create payment settings (singleton)
  let paymentSettings = await prisma.paymentSettings.findFirst();

  // If no settings exist, create default ones
  if (!paymentSettings) {
    paymentSettings = await prisma.paymentSettings.create({
      data: {
        cashEnabled: true,
        razorpayEnabled: false,
        codCharge: 0,
      },
    });
  }

  // Check if payment gateway keys are configured
  // For now, we'll check for any active payment gateway settings
  // In a multi-merchant system, we might need to check for the order owner's keys
  // For now, checking if any admin has configured keys

  // Check Razorpay keys (PaymentGatewaySetting or SiteSettings)
  let razorpaySettings = await prisma.paymentGatewaySetting.findFirst({
    where: {
      gateway: "RAZORPAY",
      isActive: true,
      razorpayKeyId: { not: null },
      razorpayKeySecret: { not: null },
    },
  });
  if (!razorpaySettings) {
    const siteSettings = await prisma.siteSettings.findFirst();
    if (siteSettings?.razorpayEnabled && siteSettings?.razorpayKeyId && siteSettings?.razorpayKeySecret) {
      razorpaySettings = { id: "site" };
    }
  }

  // Check PhonePe keys
  const activePhonePe = await prisma.paymentGatewaySetting.findFirst({
    where: {
      gateway: "PHONEPE",
      isActive: true,
    },
  });

  const isPhonePeValid = activePhonePe && (
    (activePhonePe.phonepeAuthMethod === "V2" && activePhonePe.phonepeMerchantId && activePhonePe.phonepeClientId && activePhonePe.phonepeClientSecret) ||
    ((!activePhonePe.phonepeAuthMethod || activePhonePe.phonepeAuthMethod === "V1") && activePhonePe.phonepeMerchantId && activePhonePe.phonepeSaltKey && activePhonePe.phonepeSaltIndex)
  );

  const phonepeSettings = isPhonePeValid ? activePhonePe : null;

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        cashEnabled: paymentSettings.cashEnabled,
        razorpayEnabled: paymentSettings.razorpayEnabled && !!razorpaySettings,
        phonepeEnabled: !!phonepeSettings,
        phonepeMode: phonepeSettings?.mode || "TEST",
        codCharge: parseFloat(paymentSettings.codCharge) || 0,
      },
      "Payment settings fetched successfully"
    )
  );
});

// Get Razorpay Key (from DB for the user)
export const getRazorpayKey = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.body.userId;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const paymentConfig = await getPaymentGatewayConfig(userId, "RAZORPAY");

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { key: paymentConfig.paymentSettings.razorpayKeyId || null },
        "Razorpay key fetched successfully"
      )
    );
});

// Create Razorpay order
export const checkout = asyncHandler(async (req, res) => {
  const {
    amount,
    currency = "INR",
    couponCode,
    couponId,
    discountAmount,
    paymentGateway = "RAZORPAY", // Default to RAZORPAY
  } = req.body;
  const userId = req.user.id;

  if (!amount || amount < 1) {
    throw new ApiError(400, "Valid amount is required");
  }

  try {
    // Get payment gateway config from DB (use order owner's keys)
    // For now, using the user's own keys. Later can be extended for multi-merchant
    const paymentConfig = await getPaymentGatewayConfig(userId, paymentGateway);

    // Support RAZORPAY only (PhonePe temporarily disabled)
    if (paymentGateway.toUpperCase() !== "RAZORPAY") {
      throw new ApiError(400, "Only RAZORPAY is currently supported for checkout");
    }

    // Check if user has any previous canceled orders that might cause issues
    const existingCanceledOrders = await prisma.order.findMany({
      where: {
        userId,
        status: "CANCELLED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    if (existingCanceledOrders.length > 0) {
      // Log information about canceled orders
      console.log("User has canceled orders, proceeding with clean checkout");
    }

    // Generate a short receipt ID (must be ≤ 40 chars for Razorpay)
    // Use a short timestamp and last 4 chars of userId
    const shortUserId = userId.slice(-4);
    const timestamp = Date.now().toString().slice(-10);
    const receipt = `rcpt_${timestamp}_${shortUserId}`;

    // Store coupon information in the receipt notes
    const notes = {};
    if (couponCode) {
      notes.couponCode = couponCode;
    }
    if (couponId) {
      notes.couponId = couponId;
    }
    if (discountAmount && discountAmount > 0) {
      notes.discountAmount = discountAmount;
    }
    // Store payment gateway info in notes
    notes.paymentGateway = paymentConfig.paymentSettings.gateway;
    notes.paymentMode = paymentConfig.paymentSettings.mode;
    notes.paymentOwnerId = paymentConfig.paymentSettings.userId;

    // Ensure amount has 2 decimal places for precise calculation
    // Then convert to paise (multiply by 100) and ensure it's an integer
    const decimalAmount = parseFloat(parseFloat(amount).toFixed(2));
    const amountInPaise = Math.round(decimalAmount * 100);

    const options = {
      amount: amountInPaise, // Razorpay takes amount in paise as integer
      currency,
      receipt: receipt,
      notes: Object.keys(notes).length > 0 ? notes : undefined,
    };

    const order = await paymentConfig.razorpayInstance.orders.create(options);

    if (!order) {
      throw new ApiError(500, "Error creating Razorpay order");
    }

    // Store the coupon information in the response
    const responseData = {
      ...order,
      couponData: Object.keys(notes).length > 0 ? notes : null,
    };

    res
      .status(200)
      .json(new ApiResponsive(200, responseData, "Order created successfully"));
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    // Format error response properly
    let errorMessage = "Error creating Razorpay order";
    let errorDetails = [];

    if (error.error && error.error.description) {
      errorMessage = error.error.description;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new ApiError(500, errorMessage, errorDetails);
  }
});

// Verify payment and create order
export const paymentVerification = asyncHandler(async (req, res) => {
  // Extract parameters with fallbacks for both snake_case and camelCase formats
  const razorpay_order_id =
    req.body.razorpay_order_id || req.body.razorpayOrderId;
  const razorpay_payment_id =
    req.body.razorpay_payment_id || req.body.razorpayPaymentId;
  const razorpay_signature =
    req.body.razorpay_signature || req.body.razorpaySignature;
  const {
    shippingAddressId,
    billingAddressSameAsShipping = true,
    billingAddress,
    couponCode: requestCouponCode,
    couponId: requestCouponId,
    discountAmount: requestDiscount,
    notes,
  } = req.body;

  // Validation
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment details");
  }

  if (!shippingAddressId) {
    throw new ApiError(400, "Shipping address is required");
  }


  const userId = req.user.id;
  let paymentConfig;
  let paymentGateway = "RAZORPAY";
  let paymentMode = "TEST";
  let paymentOwnerId = userId;

  try {
    // Try to get payment gateway from request body or default to RAZORPAY
    paymentGateway = req.body.paymentGateway || "RAZORPAY";
    paymentConfig = await getPaymentGatewayConfig(userId, paymentGateway);
    paymentMode = paymentConfig.paymentSettings.mode;
    paymentOwnerId = paymentConfig.paymentSettings.userId;
  } catch (error) {
    throw new ApiError(400, error.message || "Payment gateway not configured");
  }

  // Verify signature using DB key
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", paymentConfig.paymentSettings.razorpayKeySecret)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  try {
    // Check if payment already processed
    const existingPayment = await prisma.razorpayPayment.findUnique({
      where: { razorpayPaymentId: razorpay_payment_id },
    });

    if (existingPayment) {
      throw new ApiError(400, "Payment already processed");
    }

    // Check for cancelled orders with this Razorpay order ID
    const cancelledOrder = await prisma.razorpayPayment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        order: {
          status: "CANCELLED",
        },
      },
      include: {
        order: true,
      },
    });

    if (cancelledOrder) {
      console.log(
        `Detected payment for previously cancelled order: ${cancelledOrder.order.orderNumber}`
      );
      throw new ApiError(
        400,
        "This order was previously cancelled. Please start a new checkout process."
      );
    }

    if (!razorpay_signature) {
      throw new ApiError(400, "Razorpay signature is missing");
    }

    // Get user's cart items
    const userId = req.user.id;
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                pricingSlabs: {
                  orderBy: { minQty: 'desc' }
                }
              },
            },
            attributes: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
            pricingSlabs: {
              orderBy: { minQty: 'desc' }
            }
          },
        },
      },
    });

    if (!cartItems.length) {
      throw new ApiError(400, "No items in cart");
    }

    // Check if user has an active coupon
    const userCoupon = await prisma.userCoupon.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        coupon: true,
      },
    });

    // Verify shipping address
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId,
      },
    });

    if (!shippingAddress) {
      throw new ApiError(404, "Shipping address not found");
    }

    // Calculate order totals
    let subTotal = 0;
    let tax = 0; // Tax is now set to 0
    let shippingCost = 0;
    let discount = 0;
    let couponCode = null;
    let couponId = null;

    const calculateEffectivePriceRazorpay = async (variant, quantity) => {
      const qty = parseInt(quantity);
      let basePrice = parseFloat(variant.salePrice || variant.price);
      const flashSale = await applyFlashSalePrice(basePrice, variant.productId);
      if (flashSale.hasFlashSale) basePrice = flashSale.price;
      if (variant.pricingSlabs && variant.pricingSlabs.length > 0) {
        const match = variant.pricingSlabs.find(slab =>
          qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)
        );
        if (match) return parseFloat(match.price);
      }
      if (variant.product.pricingSlabs && variant.product.pricingSlabs.length > 0) {
        const match = variant.product.pricingSlabs.find(slab =>
          qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)
        );
        if (match) return parseFloat(match.price);
      }
      return basePrice;
    };

      for (const item of cartItems) {
        const variant = item.productVariant;
        const price = Math.round(await calculateEffectivePriceRazorpay(variant, item.quantity));
        const itemTotal = Math.round(price * item.quantity);
        subTotal += itemTotal;

      if (variant.quantity < item.quantity) {
        throw new ApiError(400, `Not enough stock for ${variant.product.name}`);
      }
    }

    const shiprocketSettings = await prisma.shiprocketSettings.findFirst();
    if (shiprocketSettings) {
      const threshold = parseFloat(shiprocketSettings.freeShippingThreshold || 0);
      const charge = parseFloat(shiprocketSettings.shippingCharge || 0);

      if (threshold > 0 && subTotal >= threshold) {
        shippingCost = 0;
      } else {
        shippingCost = charge;
      }
    }

    if (userCoupon && userCoupon.coupon) {
      couponCode = userCoupon.coupon.code;
      couponId = userCoupon.coupon.id;

      // Calculate discount based on coupon type
      if (userCoupon.coupon.discountType === "PERCENTAGE") {
        // Calculate percentage discount with cap if needed
        let discountPercentage = parseFloat(userCoupon.coupon.discountValue);

        if (discountPercentage > 90 || userCoupon.coupon.isDiscountCapped) {
          discountPercentage = Math.min(discountPercentage, 90);
        }

        discount = (subTotal * discountPercentage) / 100;
      } else {
        // Fixed amount discount, not exceeding subtotal
        discount = Math.min(
          parseFloat(userCoupon.coupon.discountValue),
          subTotal
        );
      }

      // After successful order, deactivate the coupon for this user
      // We'll do this in the transaction to ensure it only happens if order is created
    }
    // If no userCoupon but we have coupon info stored in the Razorpay order, use that
    else {
      try {
        // First check if direct coupon info was provided in the request
        if (requestCouponCode || requestCouponId || requestDiscount) {
          if (requestCouponCode) couponCode = requestCouponCode;
          if (requestCouponId) couponId = requestCouponId;
          if (requestDiscount) discount = parseFloat(requestDiscount);
        }
        // Fallback to Razorpay order notes
        else {
          // Fetch the Razorpay order to get notes using DB keys
          const razorpayOrderDetails = await paymentConfig.razorpayInstance.orders.fetch(
            razorpay_order_id
          );

          if (razorpayOrderDetails.notes) {
            // Get coupon information from notes
            if (razorpayOrderDetails.notes.couponCode) {
              couponCode = razorpayOrderDetails.notes.couponCode;
            }

            if (razorpayOrderDetails.notes.couponId) {
              couponId = razorpayOrderDetails.notes.couponId;
            }

            if (razorpayOrderDetails.notes.discountAmount) {
              discount = parseFloat(razorpayOrderDetails.notes.discountAmount);
            }

            // Get payment gateway info from notes
            if (razorpayOrderDetails.notes.paymentGateway) {
              paymentGateway = razorpayOrderDetails.notes.paymentGateway;
            }
            if (razorpayOrderDetails.notes.paymentMode) {
              paymentMode = razorpayOrderDetails.notes.paymentMode;
            }
            if (razorpayOrderDetails.notes.paymentOwnerId) {
              paymentOwnerId = razorpayOrderDetails.notes.paymentOwnerId;
            }
          }
        }

        // If we have couponId but no couponCode or vice versa, try to get the missing information
        if (couponId && !couponCode) {
          const coupon = await prisma.coupon.findUnique({
            where: { id: couponId },
          });
          if (coupon) {
            couponCode = coupon.code;
          }
        } else if (couponCode && !couponId) {
          const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode },
          });
          if (coupon) {
            couponId = coupon.id;
          }
        }
      } catch (err) {
        console.log("Error processing coupon information:", err);
        // Continue with the process, just without coupon info
      }
    }

    // Tax is 0% now
    tax = 0;

    // Generate order number (use SiteSettings.orderPrefix when available)
    const siteSettingsOrderNum = await prisma.siteSettings.findFirst();
    const orderPrefix = siteSettingsOrderNum?.orderPrefix || "ORD";
    const orderNumber = `${orderPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Get Razorpay payment details using DB keys
    const razorpayPaymentDetails = await paymentConfig.razorpayInstance.payments.fetch(
      razorpay_payment_id
    );
    const paymentMethod = mapRazorpayMethod(razorpayPaymentDetails.method);

    // Create order and process payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order (whole numbers only - no decimals)
      const roundedSubTotal = Math.round(subTotal);
      const roundedShipping = Math.round(shippingCost);
      const roundedDiscount = Math.round(discount);
      const roundedTotal = Math.round(roundedSubTotal + roundedShipping - roundedDiscount);
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subTotal: roundedSubTotal.toString(),
          tax: Math.round(tax).toString(),
          shippingCost: roundedShipping.toString(),
          discount: roundedDiscount,
          paymentGateway,
          paymentMode,
          paymentOwnerId,
          total: roundedTotal.toString(),
          shippingAddressId,
          billingAddressSameAsShipping,
          billingAddress: !billingAddressSameAsShipping
            ? billingAddress
            : undefined,
          notes,
          status: "PAID",
          paymentMethod: paymentGateway === "PHONEPE" ? "PHONEPE" : "RAZORPAY",
          couponCode,
          couponId: couponId,
        },
      });

      // If a coupon was used, mark it as inactive for this user
      if (userCoupon && userCoupon.coupon) {
        await tx.userCoupon.update({
          where: {
            id: userCoupon.id,
          },
          data: {
            isActive: false,
          },
        });

        // Update the coupon's used count
        await tx.coupon.update({
          where: {
            id: userCoupon.coupon.id,
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // 2. Create the Razorpay payment record
      const payment = await tx.razorpayPayment.create({
        data: {
          orderId: order.id,
          amount: Math.round(roundedSubTotal + tax + roundedShipping - roundedDiscount).toString(),
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "CAPTURED",
          paymentMethod,
          notes: razorpayPaymentDetails,
        },
      });

      // Note: Partner commissions will be created automatically when order status is updated to DELIVERED
      // This ensures partners only get paid after successful delivery, not just on payment

      // 3. Create order items and update inventory
      const orderItems = [];
      for (const item of cartItems) {
        const variant = item.productVariant;
        const price = Math.round(await calculateEffectivePriceRazorpay(variant, item.quantity));
        const subtotal = Math.round(price * item.quantity);

        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: variant.product.id,
            variantId: variant.id,
            price,
            quantity: item.quantity,
            subtotal,
          },
        });
        orderItems.push(orderItem);

        // Update inventory
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Log inventory change
        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            quantityChange: -item.quantity,
            reason: "sale",
            referenceId: order.id,
            previousQuantity: variant.quantity,
            newQuantity: variant.quantity - item.quantity,
            createdBy: userId,
          },
        });
      }

      // 4. Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return { order, payment, orderItems };
    });

    // Process referral reward (outside transaction to avoid blocking)
    processReferralReward(result.order.id, userId).catch((err) => {
      console.error("Referral reward processing error:", err);
    });

    // Process Shiprocket shipping (outside transaction, non-blocking)
    // This creates the order in Shiprocket and assigns AWB if enabled
    processOrderForShipping(result.order.id).catch((err) => {
      console.error("Shiprocket order processing error:", err);
      // Non-critical - admin can manually sync later
    });

    // Send order confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && user.email) {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: result.order.id },
          include: {
            product: true,
            variant: {
              include: {
                attributes: {
                  include: {
                    attributeValue: {
                      include: {
                        attribute: true
                      }
                    }
                  }
                },
                images: true
              },
            },
          },
        });

        // Format items for email
        const emailItems = orderItems.map((item) => ({
          name: item.product.name,
          variant: item.variant.attributes.map(attr =>
            `${attr.attributeValue.attribute.name}: ${attr.attributeValue.value}`
          ).join(", "),
          quantity: item.quantity,
          price: parseFloat(item.price).toFixed(2),
        }));

        // Send email (use SiteSettings for company info)
        const storeConfig = await getStoreConfigFromDb();
        await sendEmail({
          email: user.email,
          subject: `Order Confirmation - #${result.order.orderNumber}`,
          html: getOrderConfirmationTemplate({
            userName: user.name || "Valued Customer",
            orderNumber: result.order.orderNumber,
            orderDate: result.order.createdAt,
            paymentMethod: result.payment.paymentMethod || "Online",
            items: emailItems,
            subtotal: parseFloat(result.order.subTotal).toFixed(2),
            shipping: "0.00", // Set shipping to 0
            tax: "0.00", // Set tax to 0
            total: (
              parseFloat(result.order.subTotal) -
              parseFloat(result.order.discount || 0)
            ).toFixed(2), // Calculate total without tax/shipping
            shippingAddress: shippingAddress,
          }, storeConfig),
        });
      }
    } catch (emailError) {
      console.error("Order confirmation email error:", emailError);
      // Don't throw error, continue with response
    }

    // Return success response
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          paymentId: result.payment.id,
        },
        "Payment verified and order created successfully"
      )
    );
  } catch (error) {
    console.error("Payment Verification Error:", error);

    if (error.code === "P2002") {
      throw new ApiError(400, "Duplicate payment record");
    }

    if (error.code === "P2025") {
      throw new ApiError(404, "Related record not found");
    }

    throw new ApiError(
      error.statusCode || 500,
      error.message || "Payment verification failed"
    );
  }
});

// Get order history
export const getOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get total count
  const totalOrders = await prisma.order.count({
    where: { userId },
  });

  // Get orders with pagination
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            include: {
              attributes: {
                include: {
                  attributeValue: {
                    include: {
                      attribute: true,
                    },
                  },
                },
              },
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          returnRequests: {
            select: {
              id: true,
              status: true,
              reason: true,
              customReason: true,
              createdAt: true,
              processedAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
      tracking: true,
      razorpayPayment: {
        select: {
          paymentMethod: true,
          status: true,
          razorpayPaymentId: true,
        },
      },
      coupon: {
        select: {
          code: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  // Format response
  const formattedOrders = orders.map((order) => {
    // Ensure we use the original total without modifying it
    const originalTotal = parseFloat(order.total);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status,
      // Use the original stored total
      total: originalTotal,
      subTotal: parseFloat(order.subTotal),
      shippingCost: parseFloat(order.shippingCost) || 0,
      tax: parseFloat(order.tax) || 0,
      discount: parseFloat(order.discount) || 0,
      couponCode: order.couponCode || null,
      couponDetails: order.coupon
        ? {
          code: order.coupon.code,
          discountType: order.coupon.discountType,
          discountValue: parseFloat(order.coupon.discountValue),
        }
        : null,
      paymentMethod: order.paymentMethod || order.razorpayPayment?.paymentMethod || "ONLINE",
      paymentStatus: order.razorpayPayment?.status || order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        image: item.product.images[0]
          ? getFileUrl(item.product.images[0].url)
          : null,
        slug: item.product.slug,
        // Extract all attributes dynamically
        attributes: (() => {
          if (!item.variant?.attributes) return {};
          const attributesMap = {};
          item.variant.attributes.forEach((vav) => {
            const attrName = vav.attributeValue?.attribute?.name;
            const attrValue = vav.attributeValue?.value;
            if (attrName && attrValue) {
              attributesMap[attrName] = attrValue;
            }
          });
          return attributesMap;
        })(),
        // Backward compatibility - keep color and size for existing code
        color: (() => {
          const colorAttr = item.variant?.attributes?.find(
            (attr) => attr.attributeValue?.attribute?.name === "Color"
          );
          return colorAttr?.attributeValue?.value || null;
        })(),
        size: (() => {
          const sizeAttr = item.variant?.attributes?.find(
            (attr) => attr.attributeValue?.attribute?.name === "Size"
          );
          return sizeAttr?.attributeValue?.value || null;
        })(),
        price: parseFloat(item.price),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal),
        // Include return request information
        returnRequest: item.returnRequests && item.returnRequests.length > 0
          ? {
            id: item.returnRequests[0].id,
            status: item.returnRequests[0].status,
            reason: item.returnRequests[0].reason,
            customReason: item.returnRequests[0].customReason,
            createdAt: item.returnRequests[0].createdAt,
            processedAt: item.returnRequests[0].processedAt,
          }
          : null,
      })),
      tracking: order.tracking
        ? {
          carrier: order.tracking.carrier,
          trackingNumber: order.tracking.trackingNumber,
          status: order.tracking.status,
          estimatedDelivery: order.tracking.estimatedDelivery,
        }
        : null,
      trackingUrl: order.trackingUrl,
      awbCode: order.awbCode,
      courierName: order.courierName,
    };
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        orders: formattedOrders,
        pagination: {
          total: totalOrders,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalOrders / parseInt(limit)),
        },
      },
      "Order history fetched successfully"
    )
  );
});

// Get order details by ID
export const getOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  // Get order with details
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            include: {
              attributes: {
                include: {
                  attributeValue: {
                    include: {
                      attribute: true,
                    },
                  },
                },
              },
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          // Include return requests for each item
          returnRequests: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      shippingAddress: true,
      tracking: {
        include: {
          updates: {
            orderBy: {
              timestamp: "desc",
            },
          },
        },
      },
      razorpayPayment: true,
      coupon: {
        select: {
          code: true,
          description: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Format response - use original values to maintain historical pricing
  const formattedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt,
    status: order.status,
    cancelReason: order.cancelReason || null,
    cancelledAt: order.cancelledAt || null,
    cancelledBy: order.cancelledBy || null,
    subTotal: parseFloat(order.subTotal),
    tax: parseFloat(order.tax),
    shippingCost: parseFloat(order.shippingCost),
    discount: parseFloat(order.discount) || 0,
    // Use the original total stored in the database to preserve historical pricing
    total: parseFloat(order.total),
    paymentMethod: order.paymentMethod || order.razorpayPayment?.paymentMethod || "ONLINE",
    paymentId: order.razorpayPayment?.razorpayPaymentId,
    codCharge: parseFloat(order.codCharge) || 0,
    trackingUrl: order.trackingUrl,
    awbCode: order.awbCode,
    courierName: order.courierName,
    shiprocket: {
      orderId: order.shiprocketOrderId,
      shipmentId: order.shiprocketShipmentId,
      awbCode: order.awbCode,
      courierName: order.courierName,
      status: order.shiprocketStatus,
      trackingUrl: order.trackingUrl,
    },
    paymentStatus: order.razorpayPayment?.status || order.status,
    notes: order.notes,
    couponCode: order.couponCode,
    couponId: order.couponId,
    // Add detailed coupon information
    couponDetails: order.coupon
      ? {
        code: order.coupon.code,
        description: order.coupon.description,
        discountType: order.coupon.discountType,
        discountValue: parseFloat(order.coupon.discountValue),
      }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      image: item.product.images[0]
        ? getFileUrl(item.product.images[0].url)
        : null,
      slug: item.product.slug,
      color: item.variant.color?.name,
      size: item.variant.size?.name || null,
      price: parseFloat(item.price),
      quantity: item.quantity,
      subtotal: parseFloat(item.subtotal),
      // Include return request information
      returnRequest: item.returnRequests && item.returnRequests.length > 0
        ? {
          id: item.returnRequests[0].id,
          status: item.returnRequests[0].status,
          reason: item.returnRequests[0].reason,
          customReason: item.returnRequests[0].customReason,
          createdAt: item.returnRequests[0].createdAt,
          processedAt: item.returnRequests[0].processedAt,
        }
        : null,
    })),
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddressSameAsShipping
      ? order.shippingAddress
      : order.billingAddress,
    tracking: order.tracking
      ? {
        carrier: order.tracking.carrier,
        trackingNumber: order.tracking.trackingNumber,
        status: order.tracking.status,
        estimatedDelivery: order.tracking.estimatedDelivery,
        updates: order.tracking.updates.map((update) => ({
          status: update.status,
          timestamp: update.timestamp,
          location: update.location,
          description: update.description,
        })),
      }
      : null,
  };

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        formattedOrder,
        "Order details fetched successfully"
      )
    );
});

// Cancel order
export const cancelOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError(400, "Cancellation reason is required");
  }

  // Find order
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          variant: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only allow cancellation for certain statuses (allow PAID if not yet shipped)
  const allowedStatuses = ["PENDING", "PROCESSING", "PAID"];
  if (!allowedStatuses.includes(order.status)) {
    throw new ApiError(400, "This order cannot be cancelled");
  }

  // Process cancellation in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
    });

    // 2. Return items to inventory
    for (const item of order.items) {
      // Update inventory
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });

      // Log inventory change
      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId,
          quantityChange: item.quantity,
          reason: "cancellation",
          referenceId: order.id,
          previousQuantity: item.variant.quantity,
          newQuantity: item.variant.quantity + item.quantity,
          createdBy: userId,
        },
      });
    }

    // 3. Handle payment refund if needed (just mark as refund pending)
    if (order.razorpayPayment) {
      await tx.razorpayPayment.update({
        where: { orderId },
        data: {
          status: "REFUNDED",
        },
      });
    }
  });

  // Cancel Shiprocket order if it exists (outside transaction, non-blocking)
  if (order.shiprocketOrderId) {
    try {
      const { cancelShiprocketOrder, getShiprocketSettings } = await import("../utils/shiprocket.js");
      const settings = await getShiprocketSettings();
      if (settings.isEnabled) {
        await cancelShiprocketOrder(order.shiprocketOrderId);
        // Update order shiprocket status
        await prisma.order.update({
          where: { id: orderId },
          data: { shiprocketStatus: "CANCELLED" },
        });
        console.log(`Shiprocket order ${order.shiprocketOrderId} cancelled`);
      }
    } catch (error) {
      console.error("Failed to cancel Shiprocket order:", error.message);
      // Non-critical - order is already cancelled in our system
    }
  }

  res
    .status(200)
    .json(
      new ApiResponsive(200, { success: true }, "Order cancelled successfully")
    );
});

// Create Cash on Delivery order
// PhonePe Callback Handler
export const phonePeCallback = asyncHandler(async (req, res) => {
  try {
    // PhonePe sends callback as POST with base64 encoded response
    const { response } = req.body;

    if (!response) {
      throw new ApiError(400, "Response data is required");
    }

    // Decode response
    const decodedResponse = JSON.parse(Buffer.from(response, "base64").toString());
    const {
      success,
      code,
      message,
      data
    } = decodedResponse;

    const transactionId = data?.merchantTransactionId;

    if (!transactionId) {
      throw new ApiError(400, "Transaction ID is required");
    }

    // Get stored transaction
    const storedTransaction = await prisma.phonePeTransaction.findUnique({
      where: { transactionId },
    });

    if (!storedTransaction) {
      throw new ApiError(404, "Transaction not found");
    }

    const orderData = JSON.parse(storedTransaction.orderData);

    // Check payment status
    if (success && code === "PAYMENT_SUCCESS") {
      // Payment successful - create order (similar to createCashOrder)
      const userId = orderData.userId;

      // Get cart items
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw new ApiError(400, "Cart is empty");
      }

      // Calculate totals
      let subTotal = 0;
      for (const item of cartItems) {
        const variant = item.productVariant;
        const price = parseFloat(variant.salePrice || variant.price);
        subTotal += price * item.quantity;
      }

      let discount = orderData.discountAmount || 0;
      const tax = 0;
      const shippingCost = 0;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create order
      const result = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            subTotal: subTotal.toFixed(2),
            tax: tax.toFixed(2),
            shippingCost,
            discount,
            total: (subTotal - discount).toFixed(2),
            paymentMethod: "PHONEPE",
            paymentGateway: orderData.paymentGateway,
            paymentMode: orderData.paymentMode,
            paymentOwnerId: orderData.paymentOwnerId,
            shippingAddressId: orderData.shippingAddressId,
            billingAddressSameAsShipping: orderData.billingAddressSameAsShipping,
            status: "PAID",
            couponCode: orderData.couponCode,
            couponId: orderData.couponId,
            notes: JSON.stringify({
              phonepeTransactionId: transactionId,
              phonepePaymentId: data?.transactionId,
            }),
          },
        });

        // Create order items
        for (const item of cartItems) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              price: parseFloat(item.productVariant.salePrice || item.productVariant.price),
            },
          });

          // Update inventory
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Clear cart
        await tx.cartItem.deleteMany({
          where: { userId },
        });

        // Update transaction status
        await tx.phonePeTransaction.update({
          where: { transactionId },
          data: { status: "SUCCESS", orderId: order.id },
        });

        return order;
      });

      // Redirect to success page
      res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/account/orders?success=true&orderId=${result.id}`);
    } else {
      // Payment failed
      await prisma.phonePeTransaction.update({
        where: { transactionId },
        data: { status: "FAILED", errorMessage: message || code },
      });

      res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?transactionId=${transactionId}&error=${encodeURIComponent(message || code)}`);
    }
  } catch (error) {
    console.error("PhonePe callback error:", error);
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/payment/failed?error=${encodeURIComponent(error.message)}`);
  }
});

export const createCashOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddressId,
    billingAddressSameAsShipping = true,
    billingAddress,
    couponCode: requestCouponCode,
    couponId: requestCouponId,
    discountAmount: requestDiscount,
    notes,
  } = req.body;

  if (!shippingAddressId) {
    throw new ApiError(400, "Shipping address is required");
  }

  // Check payment settings
  const paymentSettings = await prisma.paymentSettings.findFirst();
  if (!paymentSettings || !paymentSettings.cashEnabled) {
    throw new ApiError(400, "Cash on Delivery is not enabled");
  }

  try {
    // Get user's cart items
    const userId = req.user.id;
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                pricingSlabs: {
                  orderBy: { minQty: 'desc' }
                }
              },
            },
            attributes: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
            pricingSlabs: {
              orderBy: { minQty: 'desc' }
            }
          },
        },
      },
    });

    if (!cartItems.length) {
      throw new ApiError(400, "No items in cart");
    }

    // Check if user has an active coupon
    const userCoupon = await prisma.userCoupon.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        coupon: true,
      },
    });

    // Verify shipping address
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId,
      },
    });

    if (!shippingAddress) {
      throw new ApiError(404, "Shipping address not found");
    }

    // Calculate order totals
    let subTotal = 0;
    let tax = 0;
    let shippingCost = 0;
    let discount = 0;
    let couponCode = null;
    let couponId = null;

    const calculateEffectivePriceCOD = async (variant, quantity) => {
      const qty = parseInt(quantity);
      let basePrice = parseFloat(variant.salePrice || variant.price);
      const flashSale = await applyFlashSalePrice(basePrice, variant.productId);
      if (flashSale.hasFlashSale) basePrice = flashSale.price;
      if (variant.pricingSlabs && variant.pricingSlabs.length > 0) {
        const match = variant.pricingSlabs.find(slab =>
          qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)
        );
        if (match) return parseFloat(match.price);
      }
      if (variant.product.pricingSlabs && variant.product.pricingSlabs.length > 0) {
        const match = variant.product.pricingSlabs.find(slab =>
          qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)
        );
        if (match) return parseFloat(match.price);
      }
      return basePrice;
    };

    for (const item of cartItems) {
      const variant = item.productVariant;
      const price = Math.round(await calculateEffectivePriceCOD(variant, item.quantity));
      const itemTotal = Math.round(price * item.quantity);
      subTotal += itemTotal;

      if (variant.quantity < item.quantity) {
        throw new ApiError(400, `Not enough stock for ${variant.product.name}`);
      }
    }

    const shiprocketSettings = await prisma.shiprocketSettings.findFirst();
    if (shiprocketSettings) {
      const threshold = parseFloat(shiprocketSettings.freeShippingThreshold || 0);
      const charge = parseFloat(shiprocketSettings.shippingCharge || 0);

      if (threshold > 0 && subTotal >= threshold) {
        shippingCost = 0;
      } else {
        shippingCost = charge;
      }
    }

    if (userCoupon && userCoupon.coupon) {
      couponCode = userCoupon.coupon.code;
      couponId = userCoupon.coupon.id;

      if (userCoupon.coupon.discountType === "PERCENTAGE") {
        let discountPercentage = parseFloat(userCoupon.coupon.discountValue);
        if (discountPercentage > 90 || userCoupon.coupon.isDiscountCapped) {
          discountPercentage = Math.min(discountPercentage, 90);
        }
        discount = (subTotal * discountPercentage) / 100;
      } else {
        discount = Math.min(
          parseFloat(userCoupon.coupon.discountValue),
          subTotal
        );
      }
    } else if (requestCouponCode || requestCouponId || requestDiscount) {
      if (requestCouponCode) couponCode = requestCouponCode;
      if (requestCouponId) couponId = requestCouponId;
      if (requestDiscount) discount = parseFloat(requestDiscount);
    }

    tax = 0;

    // Generate order number (use SiteSettings.orderPrefix when available)
    const siteSettingsForOrder = await prisma.siteSettings.findFirst();
    const orderPrefix = siteSettingsForOrder?.orderPrefix || "ORD";
    const orderNumber = `${orderPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Get COD charge from payment settings
    const codCharge = parseFloat(paymentSettings.codCharge) || 0;

    // Create order in a transaction (whole numbers only)
    const roundedSubTotalCOD = Math.round(subTotal);
    const roundedShippingCOD = Math.round(shippingCost);
    const roundedDiscountCOD = Math.round(discount);
    const roundedCodCharge = Math.round(codCharge);
    const roundedTotalCOD = Math.round(roundedSubTotalCOD + roundedShippingCOD + roundedCodCharge - roundedDiscountCOD);
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subTotal: roundedSubTotalCOD.toString(),
          tax: Math.round(tax).toString(),
          shippingCost: roundedShippingCOD.toString(),
          discount: roundedDiscountCOD,
          codCharge: roundedCodCharge.toString(),
          total: roundedTotalCOD.toString(),
          paymentMethod: "CASH",
          shippingAddressId,
          billingAddressSameAsShipping,
          billingAddress: !billingAddressSameAsShipping
            ? billingAddress
            : undefined,
          notes,
          status: "PENDING", // COD orders start as PENDING
          couponCode,
          couponId: couponId,
        },
      });

      // If a coupon was used, mark it as inactive for this user
      if (userCoupon && userCoupon.coupon) {
        await tx.userCoupon.update({
          where: {
            id: userCoupon.id,
          },
          data: {
            isActive: false,
          },
        });

        await tx.coupon.update({
          where: {
            id: userCoupon.coupon.id,
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // 2. Create order items and update inventory
      const orderItems = [];
      for (const item of cartItems) {
        const variant = item.productVariant;
        const price = Math.round(await calculateEffectivePriceCOD(variant, item.quantity));
        const subtotal = Math.round(price * item.quantity);

        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: variant.product.id,
            variantId: variant.id,
            price,
            quantity: item.quantity,
            subtotal,
          },
        });
        orderItems.push(orderItem);

        // Update inventory
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Log inventory change
        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            quantityChange: -item.quantity,
            reason: "sale",
            referenceId: order.id,
            previousQuantity: variant.quantity,
            newQuantity: variant.quantity - item.quantity,
            createdBy: userId,
          },
        });
      }

      // 3. Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return { order, orderItems };
    });

    // Process referral reward (outside transaction to avoid blocking)
    processReferralReward(result.order.id, userId).catch((err) => {
      console.error("Referral reward processing error:", err);
    });

    // Process Shiprocket shipping (outside transaction, non-blocking)
    processOrderForShipping(result.order.id).catch((err) => {
      console.error("Shiprocket order processing error:", err);
    });

    // Send order confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && user.email) {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: result.order.id },
          include: {
            product: true,
            variant: {
              include: {
                attributes: {
                  include: {
                    attributeValue: {
                      include: {
                        attribute: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        const emailItems = orderItems.map((item) => ({
          name: item.product.name,
          variant: item.variant.attributes
            .map((va) => va.attributeValue.value)
            .join(" "),
          quantity: item.quantity,
          price: parseFloat(item.price).toFixed(2),
        }));

        const storeConfig = await getStoreConfigFromDb();
        await sendEmail({
          email: user.email,
          subject: `Order Confirmation - #${result.order.orderNumber}`,
          html: getOrderConfirmationTemplate({
            userName: user.name || "Valued Customer",
            orderNumber: result.order.orderNumber,
            orderDate: result.order.createdAt,
            paymentMethod: "Cash on Delivery",
            items: emailItems,
            subtotal: parseFloat(result.order.subTotal).toFixed(2),
            shipping: parseFloat(result.order.shippingCost).toFixed(2),
            tax: "0.00",
            total: (
              parseFloat(result.order.subTotal) +
              parseFloat(result.order.shippingCost) -
              parseFloat(result.order.discount || 0)
            ).toFixed(2),
            shippingAddress: shippingAddress,
          }, storeConfig),
        });
      }
    } catch (emailError) {
      console.error("Order confirmation email error:", emailError);
    }

    // Return success response
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          paymentMethod: "CASH",
        },
        "Cash on Delivery order created successfully"
      )
    );
  } catch (error) {
    console.error("Cash Order Creation Error:", error);

    if (error.code === "P2002") {
      throw new ApiError(400, "Duplicate order record");
    }

    if (error.code === "P2025") {
      throw new ApiError(404, "Related record not found");
    }

    throw new ApiError(
      error.statusCode || 500,
      error.message || "Cash order creation failed"
    );
  }
});

// Helper function to map Razorpay payment method to our enum
function mapRazorpayMethod(method) {
  const methodMap = {
    card: "CARD",
    netbanking: "NETBANKING",
    wallet: "WALLET",
    upi: "UPI",
    emi: "EMI",
  };

  return methodMap[method] || "OTHER";
}

/**
 * GET /payment/shipping-rates
 * Returns live Shiprocket courier options for a given delivery address.
 * Requires: shippingAddressId (body or query)
 * Returns list of available couriers with rate, ETD, name.
 */
export const getShippingRates = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shippingAddressId, isCod = false } = req.body;

  if (!shippingAddressId) {
    throw new ApiError(400, "Shipping address ID is required");
  }

  // 1. Check if Shiprocket is enabled
  const enabled = await isShiprocketEnabled();
  if (!enabled) {
    // Fallback: return static shipping from ShiprocketSettings
    const srSettings = await prisma.shiprocketSettings.findFirst();
    const charge = parseFloat(srSettings?.shippingCharge || 0);
    const threshold = parseFloat(srSettings?.freeShippingThreshold || 0);
    return res.status(200).json(
      new ApiResponsive(200, {
        shiprocketEnabled: false,
        couriers: [],
        staticCharge: charge,
        freeShippingThreshold: threshold,
      }, "Shiprocket not configured, using flat rate")
    );
  }

  // 2. Get pickup address
  const pickupAddress = await getDefaultPickupAddress();
  if (!pickupAddress) {
    throw new ApiError(400, "Pickup address not configured in admin panel");
  }

  // 3. Get delivery address
  const shippingAddress = await prisma.address.findFirst({
    where: { id: shippingAddressId, userId },
  });
  if (!shippingAddress) {
    throw new ApiError(404, "Shipping address not found");
  }

  // 4. Get cart items to calculate total weight
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      productVariant: true,
    },
  });

  if (!cartItems.length) {
    throw new ApiError(400, "Cart is empty");
  }

  // Get default dimensions from settings
  const srSettings = await prisma.shiprocketSettings.findFirst();
  const defaultWeight = parseFloat(srSettings?.defaultWeight || 0.5);

  // Calculate total weight from variant shipping weights
  let totalWeight = 0;
  for (const item of cartItems) {
    const variantWeight = parseFloat(item.productVariant.shippingWeight || defaultWeight);
    totalWeight += variantWeight * item.quantity;
  }
  // Minimum 0.1 kg
  totalWeight = Math.max(totalWeight, 0.1);

  // 5. Call Shiprocket serviceability API
  try {
    const serviceabilityData = await checkServiceability({
      pickupPincode: pickupAddress.pincode,
      deliveryPincode: shippingAddress.postalCode,
      weight: totalWeight,
      cod: isCod,
    });

    // 6. Parse and clean courier list
    const rawCouriers = serviceabilityData?.data?.available_courier_companies || [];
    const freeShippingThreshold = parseFloat(srSettings?.freeShippingThreshold || 0);
    const flatCharge = parseFloat(srSettings?.shippingCharge || 0);

    // Calculate cart subtotal for free shipping check
    let subtotal = 0;
    for (const item of cartItems) {
      const price = parseFloat(item.productVariant.salePrice || item.productVariant.price);
      subtotal += price * item.quantity;
    }

    const isFreeShipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;

    const couriers = rawCouriers
      .filter(c => c.rate !== undefined && c.rate !== null)
      .map(c => ({
        courierId: c.courier_company_id,
        courierName: c.courier_name,
        rate: isFreeShipping ? 0 : Math.round(parseFloat(c.rate || 0)),
        originalRate: Math.round(parseFloat(c.rate || 0)),
        estimatedDays: c.estimated_delivery_days || c.etd || null,
        etd: c.etd || null,
        codCharges: c.cod_charges ? Math.round(parseFloat(c.cod_charges)) : 0,
        rating: c.rating || 0,
        isRecommended: c.is_recommended === 1 || c.is_recommended === true,
        isSurface: c.is_surface === 1 || c.is_surface === true,
        deliveryPerformance: c.delivery_performance || null,
        pickupAvailability: c.pickup_availability || null,
        minWeight: c.min_weight || 0,
        maxWeight: c.max_weight || null,
      }))
      // Sort: recommended first, then by rate
      .sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.rate - b.rate;
      });

    return res.status(200).json(
      new ApiResponsive(200, {
        shiprocketEnabled: true,
        couriers,
        isFreeShipping,
        freeShippingThreshold,
        flatCharge,
        totalWeight,
        pickupPincode: pickupAddress.pincode,
        deliveryPincode: shippingAddress.postalCode,
      }, "Shipping rates fetched successfully")
    );
  } catch (error) {
    console.error("Shiprocket serviceability error:", error.message);
    // Graceful fallback to flat rate
    const charge = parseFloat(srSettings?.shippingCharge || 0);
    const threshold = parseFloat(srSettings?.freeShippingThreshold || 0);
    return res.status(200).json(
      new ApiResponsive(200, {
        shiprocketEnabled: true,
        couriers: [],
        isFreeShipping: false,
        freeShippingThreshold: threshold,
        flatCharge: charge,
        error: "Could not fetch live rates, using flat rate",
      }, "Using flat shipping rate")
    );
  }
});

// ============================================================
// PhonePe Payment Integration
// ============================================================

// Helper: Get active PhonePe gateway config from DB
async function getPhonePeConfig() {
  const setting = await prisma.paymentGatewaySetting.findFirst({
    where: {
      gateway: "PHONEPE",
      isActive: true,
    },
  });

  if (!setting) {
    throw new ApiError(400, "PhonePe payment gateway is not configured or not active. Please configure PhonePe keys in Payment Gateway Settings.");
  }

  // Validate fields based on auth method
  if (setting.phonepeAuthMethod === "V2") {
    if (!setting.phonepeMerchantId || !setting.phonepeClientId || !setting.phonepeClientSecret) {
      throw new ApiError(400, "PhonePe V2 credentials (Merchant ID, Client ID, Client Secret) are not fully configured.");
    }
  } else {
    if (!setting.phonepeMerchantId || !setting.phonepeSaltKey || !setting.phonepeSaltIndex) {
      throw new ApiError(400, "PhonePe V1 credentials (Merchant ID, Salt Key, Salt Index) are not fully configured.");
    }
  }

  return {
    merchantId: setting.phonepeMerchantId,
    saltKey: setting.phonepeSaltKey ? decrypt(setting.phonepeSaltKey) : null,
    saltIndex: setting.phonepeSaltIndex,
    authMethod: setting.phonepeAuthMethod || "V1",
    clientId: setting.phonepeClientId,
    clientSecret: setting.phonepeClientSecret ? decrypt(setting.phonepeClientSecret) : null,
    clientVersion: setting.phonepeClientVersion || "1",
    mode: setting.mode, // "TEST" | "LIVE"
    settingId: setting.id,
  };
}

// Helper: Build order from cart (shared between PhonePe initiate and verify)
async function buildOrderDataFromCart(userId, shippingAddressId, couponOverrides = {}) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      productVariant: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              pricingSlabs: { orderBy: { minQty: "desc" } },
            },
          },
          attributes: {
            include: {
              attributeValue: { include: { attribute: true } },
            },
          },
          pricingSlabs: { orderBy: { minQty: "desc" } },
        },
      },
    },
  });

  if (!cartItems.length) throw new ApiError(400, "Cart is empty");

  const shippingAddress = await prisma.address.findFirst({
    where: { id: shippingAddressId, userId },
  });
  if (!shippingAddress) throw new ApiError(404, "Shipping address not found");

  const calcPrice = async (variant, quantity) => {
    const qty = parseInt(quantity);
    let basePrice = parseFloat(variant.salePrice || variant.price);
    const flashSale = await applyFlashSalePrice(basePrice, variant.productId);
    if (flashSale.hasFlashSale) basePrice = flashSale.price;
    if (variant.pricingSlabs?.length > 0) {
      const match = variant.pricingSlabs.find(s => qty >= s.minQty && (s.maxQty === null || qty <= s.maxQty));
      if (match) return parseFloat(match.price);
    }
    if (variant.product.pricingSlabs?.length > 0) {
      const match = variant.product.pricingSlabs.find(s => qty >= s.minQty && (s.maxQty === null || qty <= s.maxQty));
      if (match) return parseFloat(match.price);
    }
    return basePrice;
  };

  let subTotal = 0;
  for (const item of cartItems) {
    const variant = item.productVariant;
    if (variant.quantity < item.quantity) {
      throw new ApiError(400, `Not enough stock for ${variant.product.name}`);
    }
    const price = Math.round(await calcPrice(variant, item.quantity));
    subTotal += Math.round(price * item.quantity);
  }

  // Shipping
  let shippingCost = 0;
  const srSettings = await prisma.shiprocketSettings.findFirst();
  if (srSettings) {
    const threshold = parseFloat(srSettings.freeShippingThreshold || 0);
    const charge = parseFloat(srSettings.shippingCharge || 0);
    shippingCost = threshold > 0 && subTotal >= threshold ? 0 : charge;
  }

  // Coupon
  let discount = 0;
  let couponCode = null;
  let couponId = null;
  const userCoupon = await prisma.userCoupon.findFirst({
    where: { userId, isActive: true },
    include: { coupon: true },
  });
  if (userCoupon?.coupon) {
    couponCode = userCoupon.coupon.code;
    couponId = userCoupon.coupon.id;
    if (userCoupon.coupon.discountType === "PERCENTAGE") {
      let pct = parseFloat(userCoupon.coupon.discountValue);
      if (pct > 90 || userCoupon.coupon.isDiscountCapped) pct = Math.min(pct, 90);
      discount = (subTotal * pct) / 100;
    } else {
      discount = Math.min(parseFloat(userCoupon.coupon.discountValue), subTotal);
    }
  } else if (couponOverrides.couponCode || couponOverrides.couponId || couponOverrides.discountAmount) {
    if (couponOverrides.couponCode) couponCode = couponOverrides.couponCode;
    if (couponOverrides.couponId) couponId = couponOverrides.couponId;
    if (couponOverrides.discountAmount) discount = parseFloat(couponOverrides.discountAmount);
  }

  const roundedSubTotal = Math.round(subTotal);
  const roundedShipping = Math.round(shippingCost);
  const roundedDiscount = Math.round(discount);
  const roundedTotal = Math.round(roundedSubTotal + roundedShipping - roundedDiscount);

  return {
    cartItems,
    shippingAddress,
    subTotal: roundedSubTotal,
    shippingCost: roundedShipping,
    discount: roundedDiscount,
    total: roundedTotal,
    couponCode,
    couponId,
    userCoupon,
    calcPrice,
  };
}

// POST /payment/phonepe/initiate
export const initPhonePePayment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    shippingAddressId,
    billingAddressSameAsShipping = true,
    couponCode,
    couponId,
    discountAmount,
  } = req.body;

  if (!shippingAddressId) throw new ApiError(400, "Shipping address is required");

  // Get PhonePe config
  const phonePeConfig = await getPhonePeConfig();

  // Build order data
  const orderData = await buildOrderDataFromCart(userId, shippingAddressId, {
    couponCode,
    couponId,
    discountAmount,
  });

  if (orderData.total < 1) throw new ApiError(400, "Order amount must be at least ₹1");

  // Generate unique transaction ID
  const transactionId = `PP_${Date.now()}_${userId.slice(-6)}`;

  // Get user mobile
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Callback URLs
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000";
  const serverUrl = process.env.BASE_URL || "http://localhost:4000";
  const redirectUrl = `${serverUrl}/api/payment/phonepe/verify?transactionId=${transactionId}`;
  const callbackUrl = `${serverUrl}/api/payment/phonepe/webhook`;

  // Store pending transaction with order snapshot
  await prisma.phonePeTransaction.create({
    data: {
      transactionId,
      userId,
      amount: orderData.total * 100, // in paise
      orderData: JSON.stringify({
        userId,
        shippingAddressId,
        billingAddressSameAsShipping,
        couponCode: orderData.couponCode,
        couponId: orderData.couponId,
        discountAmount: orderData.discount,
        paymentGateway: "PHONEPE",
        paymentMode: phonePeConfig.mode,
        subTotal: orderData.subTotal,
        shippingCost: orderData.shippingCost,
        discount: orderData.discount,
        total: orderData.total,
        clientRedirectBase: clientUrl,
      }),
      status: "PENDING",
    },
  });

  // Initiate payment with PhonePe
  const phonePeResponse = await initiatePhonePePayment({
    authMethod: phonePeConfig.authMethod,
    merchantId: phonePeConfig.merchantId,
    saltKey: phonePeConfig.saltKey,
    saltIndex: phonePeConfig.saltIndex,
    clientId: phonePeConfig.clientId,
    clientSecret: phonePeConfig.clientSecret,
    clientVersion: phonePeConfig.clientVersion,
    mode: phonePeConfig.mode,
    transactionId,
    amountInPaise: orderData.total * 100,
    redirectUrl,
    callbackUrl,
    mobileNumber: user?.phone || undefined,
    userId,
  });

  // Get redirect URL from PhonePe response
  const paymentUrl =
    phonePeResponse?.data?.instrumentResponse?.redirectInfo?.url ||
    phonePeResponse?.data?.redirectInfo?.url;

  if (!paymentUrl) {
    // Cleanup pending transaction
    await prisma.phonePeTransaction.update({
      where: { transactionId },
      data: { status: "FAILED", errorMessage: "No redirect URL in PhonePe response" },
    });
    throw new ApiError(500, "PhonePe did not return a payment URL. Please try again.");
  }

  return res.status(200).json(
    new ApiResponsive(200, { redirectUrl: paymentUrl, transactionId }, "PhonePe payment initiated")
  );
});

// GET /payment/phonepe/verify?transactionId=xxx
// This is the redirect URL PhonePe calls after payment
export const verifyPhonePePayment = asyncHandler(async (req, res) => {
  const { transactionId } = req.query;

  if (!transactionId) {
    return res.redirect(`${process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000"}/payment/failed?error=Missing+transaction+ID`);
  }

  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000";

  // Get the stored transaction
  const storedTransaction = await prisma.phonePeTransaction.findUnique({
    where: { transactionId },
  });

  if (!storedTransaction) {
    return res.redirect(`${clientUrl}/payment/failed?error=Transaction+not+found&transactionId=${transactionId}`);
  }

  // ✅ Double payment prevention - if already processed, redirect to success/failed
  if (storedTransaction.status === "SUCCESS" && storedTransaction.orderId) {
    return res.redirect(`${clientUrl}/payment/success?transactionId=${transactionId}&orderId=${storedTransaction.orderId}&alreadyProcessed=true`);
  }
  if (storedTransaction.status === "FAILED") {
    const errMsg = encodeURIComponent(storedTransaction.errorMessage || "Payment failed");
    return res.redirect(`${clientUrl}/payment/failed?error=${errMsg}&transactionId=${transactionId}`);
  }

  const orderSnap = JSON.parse(storedTransaction.orderData);
  const userId = storedTransaction.userId;

  // Get PhonePe config
  let phonePeConfig;
  try {
    phonePeConfig = await getPhonePeConfig();
  } catch (err) {
    await prisma.phonePeTransaction.update({
      where: { transactionId },
      data: { status: "FAILED", errorMessage: "PhonePe not configured" },
    });
    return res.redirect(`${clientUrl}/payment/failed?error=Payment+gateway+not+configured&transactionId=${transactionId}`);
  }

  // Check payment status with PhonePe API
  let statusResponse;
  try {
    statusResponse = await checkPhonePeStatus({
      authMethod: phonePeConfig.authMethod,
      merchantId: phonePeConfig.merchantId,
      saltKey: phonePeConfig.saltKey,
      saltIndex: phonePeConfig.saltIndex,
      clientId: phonePeConfig.clientId,
      clientSecret: phonePeConfig.clientSecret,
      clientVersion: phonePeConfig.clientVersion,
      mode: phonePeConfig.mode,
      transactionId,
    });
  } catch (err) {
    console.error("PhonePe status check error:", err);
    return res.redirect(`${clientUrl}/payment/failed?error=Could+not+verify+payment&transactionId=${transactionId}`);
  }

  const isSuccess = statusResponse?.success === true && statusResponse?.code === "PAYMENT_SUCCESS";

  if (!isSuccess) {
    const errCode = statusResponse?.code || "PAYMENT_FAILED";
    const errMsg = statusResponse?.message || "Payment was not successful";
    await prisma.phonePeTransaction.update({
      where: { transactionId },
      data: { status: "FAILED", errorMessage: `${errCode}: ${errMsg}` },
    });
    return res.redirect(`${clientUrl}/payment/failed?error=${encodeURIComponent(errMsg)}&code=${errCode}&transactionId=${transactionId}`);
  }

  // Payment successful - create order
  try {
    const orderData = await buildOrderDataFromCart(userId, orderSnap.shippingAddressId, {
      couponCode: orderSnap.couponCode,
      couponId: orderSnap.couponId,
      discountAmount: orderSnap.discount,
    });

    const siteSettings = await prisma.siteSettings.findFirst();
    const orderPrefix = siteSettings?.orderPrefix || "ORD";
    const orderNumber = `${orderPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const phonepePaymentId = statusResponse?.data?.transactionId || transactionId;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subTotal: orderData.subTotal.toString(),
          tax: "0",
          shippingCost: orderData.shippingCost.toString(),
          discount: orderData.discount,
          total: orderData.total.toString(),
          paymentMethod: "PHONEPE",
          paymentGateway: "PHONEPE",
          paymentMode: orderSnap.paymentMode || phonePeConfig.mode,
          shippingAddressId: orderSnap.shippingAddressId,
          billingAddressSameAsShipping: orderSnap.billingAddressSameAsShipping ?? true,
          status: "PAID",
          couponCode: orderData.couponCode,
          couponId: orderData.couponId,
          notes: JSON.stringify({
            phonePeTransactionId: transactionId,
            phonePePaymentId: phonepePaymentId,
          }),
        },
      });

      // Deactivate coupon if used
      if (orderData.userCoupon?.coupon) {
        await tx.userCoupon.update({
          where: { id: orderData.userCoupon.id },
          data: { isActive: false },
        });
        await tx.coupon.update({
          where: { id: orderData.userCoupon.coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Create order items + update inventory
      for (const item of orderData.cartItems) {
        const variant = item.productVariant;
        const price = Math.round(await orderData.calcPrice(variant, item.quantity));
        const subtotal = Math.round(price * item.quantity);

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: variant.product.id,
            variantId: variant.id,
            price,
            quantity: item.quantity,
            subtotal,
          },
        });

        await tx.productVariant.update({
          where: { id: variant.id },
          data: { quantity: { decrement: item.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            quantityChange: -item.quantity,
            reason: "sale",
            referenceId: order.id,
            previousQuantity: variant.quantity,
            newQuantity: variant.quantity - item.quantity,
            createdBy: userId,
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      // Mark PhonePe transaction as SUCCESS
      await tx.phonePeTransaction.update({
        where: { transactionId },
        data: { status: "SUCCESS", orderId: order.id },
      });

      return order;
    });

    // Non-blocking: referral + shiprocket + email
    processReferralReward(result.id, userId).catch((err) =>
      console.error("PhonePe referral error:", err)
    );
    processOrderForShipping(result.id).catch((err) =>
      console.error("PhonePe Shiprocket error:", err)
    );

    // Send confirmation email
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: result.id },
          include: {
            product: true,
            variant: {
              include: {
                attributes: {
                  include: { attributeValue: { include: { attribute: true } } },
                },
              },
            },
          },
        });
        const emailItems = orderItems.map((item) => ({
          name: item.product.name,
          variant: item.variant.attributes.map((a) => a.attributeValue.value).join(" "),
          quantity: item.quantity,
          price: parseFloat(item.price).toFixed(2),
        }));
        const storeConfig = await getStoreConfigFromDb();
        await sendEmail({
          email: user.email,
          subject: `Order Confirmation - #${result.orderNumber}`,
          html: getOrderConfirmationTemplate({
            userName: user.name || "Valued Customer",
            orderNumber: result.orderNumber,
            orderDate: result.createdAt,
            paymentMethod: "PhonePe",
            items: emailItems,
            subtotal: orderData.subTotal.toFixed(2),
            shipping: orderData.shippingCost.toFixed(2),
            tax: "0.00",
            total: orderData.total.toFixed(2),
            shippingAddress: orderData.shippingAddress,
          }, storeConfig),
        });
      }
    } catch (emailErr) {
      console.error("PhonePe order email error:", emailErr);
    }

    return res.redirect(
      `${clientUrl}/payment/success?transactionId=${transactionId}&orderId=${result.id}&orderNumber=${encodeURIComponent(result.orderNumber)}`
    );
  } catch (orderErr) {
    console.error("PhonePe order creation error:", orderErr);
    // Don't mark as failed yet - payment was successful, manual intervention may be needed
    return res.redirect(
      `${clientUrl}/payment/success?transactionId=${transactionId}&pendingOrder=true`
    );
  }
});

// POST /payment/phonepe/webhook
// PhonePe server-to-server callback (backup, in case redirect fails)
export const phonePeWebhook = asyncHandler(async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) return res.status(200).json({ success: true, message: "No response data" });

    let decodedResponse;
    try {
      decodedResponse = JSON.parse(Buffer.from(response, "base64").toString());
    } catch {
      return res.status(200).json({ success: true, message: "Invalid response format" });
    }

    const { success, code, data } = decodedResponse;
    const transactionId = data?.merchantTransactionId;
    if (!transactionId) return res.status(200).json({ success: true, message: "No transactionId" });

    const storedTx = await prisma.phonePeTransaction.findUnique({ where: { transactionId } });
    if (!storedTx) return res.status(200).json({ success: true, message: "Transaction not found" });

    // Skip if already processed (double payment prevention)
    if (storedTx.status === "SUCCESS") {
      return res.status(200).json({ success: true, message: "Already processed" });
    }

    if (success && code === "PAYMENT_SUCCESS") {
      // Payment successful via webhook - redirect verify will handle order creation
      // Just log it here, the redirect flow creates the order
      console.log(`PhonePe webhook: payment successful for ${transactionId}`);
    } else {
      // Mark as failed if not already done
      if (storedTx.status === "PENDING") {
        await prisma.phonePeTransaction.update({
          where: { transactionId },
          data: { status: "FAILED", errorMessage: decodedResponse.message || code },
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("PhonePe webhook error:", err);
    return res.status(200).json({ success: true }); // Always return 200 to PhonePe
  }
});
