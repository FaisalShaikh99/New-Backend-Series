// ========================================
// CLOUDINARY FILE UPLOAD UTILITY
// ========================================
// Ye file Cloudinary service ke saath file upload handle karti hai
// Images, videos, aur other files ko cloud mein store karta hai

// ========== IMPORTS ==========
import {v2 as cloudinary} from "cloudinary"  // Cloudinary SDK v2
import fs from "fs"                          // File system operations

// ========================================
// CLOUDINARY CONFIGURATION
// ========================================
// Environment variables se Cloudinary credentials set karo
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // Cloudinary account name
  api_key: process.env.CLOUDINARY_API_KEY,        // API key
  api_secret: process.env.CLOUDINARY_API_SECRET   // API secret
});

// ========================================
// FILE UPLOAD FUNCTION
// ========================================
// Local file ko Cloudinary mein upload karne ke liye
const uploadOnCloudinary = async (localFilePath) => {
    try {
        // ========== FILE PATH VALIDATION ==========
        // Check karo ki file path valid hai ya nahi
        if (!localFilePath) return null
        
        // ========== CLOUDINARY UPLOAD ==========
        // File ko Cloudinary mein upload karo
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"  // Automatically detect file type (image, video, etc.)
        })
        
        // ========== SUCCESS LOGGING ==========
        // Upload successful hone par log print karo
        console.log("✅ File uploaded successfully on Cloudinary:", response.url);
        
        // ========== LOCAL FILE CLEANUP ==========
        // Local temporary file ko delete kar do (space save karne ke liye)
        fs.unlinkSync(localFilePath)
        
        // ========== RETURN RESPONSE ==========
        // Cloudinary response return karo (URL, public_id, etc.)
        return response;

    } catch (error) {
        // ========== ERROR HANDLING ==========
        // Upload fail hone par error handle karo
        console.error("❌ Cloudinary upload failed:", error);
        
        // ========== CLEANUP ON ERROR ==========
        // Local file ko delete kar do (cleanup)
        fs.unlinkSync(localFilePath) 
        
        // ========== RETURN NULL ==========
        // Error case mein null return karo
        return null;
    }
}

// ========================================
// EXPORT FUNCTION
// ========================================
export {uploadOnCloudinary}