// ========================================
// SERVER ENTRY POINT
// ========================================
// Ye file server ka main entry point hai
// Database connection aur server start yahan hota hai

// ========== ENVIRONMENT CONFIGURATION ==========
// ES Module (import/export) use kar rahe ho isliye 'dotenv' import kar rahe ho
import dotenv from 'dotenv'

// ========== DATABASE CONNECTION ==========
// Database connection function import karo
import connectDB from "./db/db.js";

// ========== EXPRESS APP ==========
// Express app import karo
import { app } from './app.js';

// ========================================
// ENVIRONMENT VARIABLES CONFIGURATION
// ========================================
// dotenv.config() ka kaam hai .env file ke variables ko process.env mein load karna
dotenv.config({
    path: './.env'   // Explicitly path diya, warna by default root folder se .env uthata hai
})

// ========================================
// DATABASE CONNECTION & SERVER START
// ========================================
// Pehle database se connect karenge, phir server start karenge

connectDB()
.then(() => {
    // ========== DATABASE CONNECTION SUCCESS ==========
    // Database successfully connect ho gaya hai
    console.log("✅ Database connected successfully!")
                                                          
    // ========== SERVER START ==========
    // Express app ko listen karaya (server start kar diya)
    app.listen(process.env.PORT || 8000, () => {
        console.log(`🚀 Server is running at port : ${process.env.PORT || 8000}`) 
        console.log(`🌐 Server URL: http://localhost:${process.env.PORT || 8000}`)
    })

    // ========== ERROR HANDLING ==========
    // Agar app mein koi error aata hai (like server crash, port busy, etc.)
    app.on("error", (error) => {
        console.error("❌ Server Error: ", error)
        throw error
    })

})
.catch((error) => {
    // ========== DATABASE CONNECTION FAILED ==========
    // Agar DB connection fail ho jaye to ye chalega
    console.log("❌ MongoDB connection failed !!!", error);  
    process.exit(1) // Server ko terminate kar do
})

// ========================================
// OLD APPROACH (COMMENTED OUT)
// ========================================
// Pehle ye approach use karte the, ab modular approach use kar rahe hain
/*
import express from 'express'
const app = express()

( async () => {
    try {
       // Directly mongoose connect karwaya
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

       app.on("error", (error) => {
        console.error("ERR: ", error)
        throw error
       })

       app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`);
       })

    } catch (error) {
        console.log("Error : ", error);
        throw error
    }
})()
*/