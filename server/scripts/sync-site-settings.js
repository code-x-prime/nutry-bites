import { prisma } from "../config/db.js";

async function main() {
  console.log("🚀 Starting Site Settings Synchronization...");

  const siteDetails = {
    siteName: "Nutry Bites",
    siteEmail: "nutrybitesstore@gmail.com",
    sitePhone: "8910072220, 6290958664",
    siteAddress: "-6/7 A, ACHARYYA JADADISH CHANDRA BOSE ROAD, KOLKATA -700017",
    siteGSTIN: "19ASGPY5969C1Z1",
    siteFSSAI: "22826039000129",
    siteDescription: "Healthy Snacks Anytime",
    siteCity: "Kolkata",
    siteState: "West Bengal",
    sitePincode: "700017",
    siteCountry: "India"
  };

  try {
    const existing = await prisma.siteSettings.findFirst();

    if (existing) {
      console.log("📝 Existing Site Settings found. Updating...");
      const updated = await prisma.siteSettings.update({
        where: { id: existing.id },
        data: siteDetails
      });
      console.log("✅ Site Settings updated successfully!");
      console.log(JSON.stringify(updated, null, 2));
    } else {
      console.log("🆕 No Site Settings found. Creating new record...");
      const created = await prisma.siteSettings.create({
        data: siteDetails
      });
      console.log("✅ Site Settings created successfully!");
      console.log(JSON.stringify(created, null, 2));
    }
  } catch (error) {
    console.error("❌ Error during synchronization:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database.");
  });
