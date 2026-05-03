import { prisma } from "../config/db.js";

/**
 * Store Configuration Utility
 * Centralized configuration for store name, email, and other store-specific settings
 * All values can be overridden via environment variables
 */

export const getStoreConfig = () => {
  return {
    // Store Information
    storeName: process.env.STORE_NAME || "Nutry Bites",
    storeEmail: process.env.STORE_EMAIL || "support@nutrybites.com",
    storePhone: process.env.STORE_PHONE || "+91 93150 71969",
    storeAddress:
      process.env.STORE_ADDRESS || "89/2 Sector 39, Gurugram, Haryana - 122001",

    // Store Description/Tagline
    storeTagline: process.env.STORE_TAGLINE || "Healthy Snacks Anytime",
    storeDescription:
      process.env.STORE_DESCRIPTION ||
      "Your trusted partner for healthy makhana snacks",

    // Email Configuration
    fromName: process.env.FROM_NAME || process.env.STORE_NAME || "Nutry Bites",
    fromEmail:
      process.env.FROM_EMAIL ||
      process.env.STORE_EMAIL ||
      process.env.SMTP_USER ||
      "support@nutrybites.com",

    // Website Information
    websiteUrl: process.env.WEBSITE_URL || "https://nutrybites.com",
    supportEmail:
      process.env.SUPPORT_EMAIL ||
      process.env.STORE_EMAIL ||
      "support@nutrybites.com",

    // Social Media (optional)
    socialFacebook: process.env.SOCIAL_FACEBOOK || "",
    socialTwitter: process.env.SOCIAL_TWITTER || "",
    socialInstagram: process.env.SOCIAL_INSTAGRAM || "",
    socialYoutube: process.env.SOCIAL_YOUTUBE || "",
  };
};

/**
 * Get store name
 */
export const getStoreName = () => {
  return getStoreConfig().storeName;
};

/**
 * Get store email
 */
export const getStoreEmail = () => {
  return getStoreConfig().storeEmail;
};

/**
 * Get from name for emails
 */
export const getFromName = () => {
  return getStoreConfig().fromName;
};

/**
 * Get from email for emails
 */
export const getFromEmail = () => {
  return getStoreConfig().fromEmail;
};

/**
 * Get full store information object
 */
export const getFullStoreInfo = () => {
  const config = getStoreConfig();
  return {
    name: config.storeName,
    email: config.storeEmail,
    phone: config.storePhone,
    address: config.storeAddress,
    tagline: config.storeTagline,
    description: config.storeDescription,
    websiteUrl: config.websiteUrl,
    supportEmail: config.supportEmail,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    social: {
      facebook: config.socialFacebook,
      twitter: config.socialTwitter,
      instagram: config.socialInstagram,
      youtube: config.socialYoutube,
    },
  };
};

/**
 * Get store config from SiteSettings (DB) when available, else fallback to env
 * Use this for order emails and other dynamic content
 */
export async function getStoreConfigFromDb() {
  try {
    const siteSettings = await prisma.siteSettings.findFirst();
    if (siteSettings) {
      return {
        storeName: siteSettings.siteName || process.env.STORE_NAME || "Nutry Bites",
        storeEmail: siteSettings.siteEmail || process.env.STORE_EMAIL || "support@nutrybites.com",
        storePhone: siteSettings.sitePhone || process.env.STORE_PHONE || "+91 93150 71969",
        storeAddress: siteSettings.siteAddress || process.env.STORE_ADDRESS || "89/2 Sector 39, Gurugram, Haryana - 122001",
        storeTagline: siteSettings.siteDescription || process.env.STORE_TAGLINE || "Healthy Snacks Anytime",
        storeDescription: siteSettings.siteDescription || process.env.STORE_DESCRIPTION || "Your trusted partner for healthy makhana snacks",
        fromName: siteSettings.siteName || process.env.FROM_NAME || "Nutry Bites",
        fromEmail: siteSettings.siteEmail || process.env.FROM_EMAIL || "support@nutrybites.com",
        websiteUrl: process.env.WEBSITE_URL || "https://nutrybites.com",
        supportEmail: siteSettings.siteEmail || process.env.SUPPORT_EMAIL || "support@nutrybites.com",
        orderEmailFooter: siteSettings.orderEmailFooter || "",
        siteGSTIN: siteSettings.siteGSTIN || "",
      };
    }
  } catch (err) {
    console.warn("Could not fetch SiteSettings for store config:", err?.message);
  }
  return getStoreConfig();
}

export default getStoreConfig;
