import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";   // 👈 IMPORTANT

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("✅ File uploaded:", response.url);

    // ✅ SAFE async cleanup
    await fs.unlink(localFilePath).catch(() => {});

    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);

    // ✅ SAFE cleanup even if upload fails
    if (localFilePath) {
      await fs.unlink(localFilePath).catch(() => {});
    }

    return null;
  }
};

export { uploadOnCloudinary };
