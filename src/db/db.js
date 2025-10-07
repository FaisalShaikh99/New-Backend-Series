// ========================================
// DATABASE CONNECTION MODULE
// ========================================
// Ye file MongoDB Atlas se connection establish karti hai
// Mongoose ODM use karke database operations handle karte hain

// ========== IMPORTS ==========
import mongoose from "mongoose";           // MongoDB ODM (Object Document Mapper)
import { DB_NAME } from "../constants.js"; // Database name constant

// ========================================
// DATABASE CONNECTION FUNCTION
// ========================================
// Database connection establish karne ke liye async function

const connectDB = async () => {
    try {
        // ========== MONGODB CONNECTION ==========
        // MongoDB Atlas se connect karo
        // process.env.MONGODB_URL = MongoDB connection string
        // DB_NAME = Database ka naam (constants.js se)
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`) 
        
        // ========== SUCCESS LOGGING ==========
        // Connection successful hone par log print karo
        console.log(`\n✅ MongoDB connected successfully!`)
        console.log(`📊 Database Host: ${connectionInstance.connection.host}`)
        console.log(`🗄️  Database Name: ${DB_NAME}`)

    } catch (error) { 
        // ========== ERROR HANDLING ==========
        // Agar connection fail ho jaye to error handle karo
        console.error("❌ MongoDB connection failed:", error);
        
        // ========== PROCESS TERMINATION ==========
        // Server ko terminate kar do agar database connect nahi ho paaye
        process.exit(1) 
    }
}  

// ========================================
// EXPORT CONNECTION FUNCTION
// ========================================
// connectDB function ko export karo taki index.js mein use kar sakein
export default connectDB