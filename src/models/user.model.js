// ========================================
// USER MODEL - Database Schema Definition
// ========================================
// Ye file MongoDB mein User collection ka structure define karti hai
// Mongoose ODM use karke database operations handle karte hain

import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"  // JWT tokens generate karne ke liye
import bcrypt from "bcrypt"     // Password hashing ke liye

// ========================================
// USER SCHEMA DEFINITION
// ========================================
// Schema define karta hai ki User document mein kya-kya fields honge
const userSchema = new Schema(
    {
        // ========== BASIC USER INFO ==========
        username: {
            type: String,
            required: true,        // Compulsory field
            unique: true,          // Har username unique hona chahiye
            lowercase: true,       // Always store in lowercase
            trim: true,            // Remove extra spaces
            index: true            // Database index for faster queries
        },
        email: {
            type: String,
            required: true,        // Email field mandatory
            unique: true,          // Har email unique hona chahiye
            lowercase: true,       // Always store in lowercase
            trim: true,            // Remove extra spaces
        },
        fullName: {
            type: String,
            required: true,        // Full name mandatory
            trim: true,            // Remove extra spaces
            index: true            // Index for faster search
        },
        
        // ========== PROFILE IMAGES ==========
        avatar: {
            type: String,          // Cloudinary URL store karenge
            required: true,        // Profile picture mandatory
        },
        coverImage: {
            type: String,          // Cover image URL (optional)
        },
        
        // ========== USER ACTIVITY ==========
        watchHistory: [
            {
                type: Schema.Types.ObjectId,  // Video ka reference
                ref: "Video"                  // Video model se connect
            }
        ],
        
        // ========== SECURITY FIELDS ==========
        password: {
            type: String,
            required: [true, 'Password is required']  // Custom error message
        },
        refreshToken: {
            type: String          // JWT refresh token store karte hain
        }

    },
    {
        timestamps: true          // Automatically add createdAt and updatedAt
    }
)

// ========================================
// MIDDLEWARE FUNCTIONS
// ========================================

// ========== PASSWORD HASHING MIDDLEWARE ==========
// Ye function automatically chalega jab bhi user save hoga
userSchema.pre("save", async function (next) {
    // Sirf tab hash karo jab password modify ho raha ho
    if(!this.isModified("password")) return next();

    // Password ko 10 rounds mein hash karo (salt rounds)
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// ========================================
// INSTANCE METHODS (User ke methods)
// ========================================

// ========== PASSWORD VERIFICATION METHOD ==========
// Ye method check karta hai ki entered password correct hai ya nahi
userSchema.methods.isPasswordCorrect = async function(password){
    // bcrypt.compare() plain password aur hashed password ko compare karta hai
    return await bcrypt.compare(password, this.password)
}

// ========== ACCESS TOKEN GENERATION ==========
// Short-lived token (15-30 minutes) - API calls ke liye
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,           // User ID
            email: this.email,       // User email
            username: this.username, // Username
            fullName: this.fullName  // Full name
        },
        process.env.ACCESS_TOKEN_SECRET,  // Secret key from environment
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY  // Token expiry time
        }
    )
}

// ========== REFRESH TOKEN GENERATION ==========
// Long-lived token (7-30 days) - Access token refresh karne ke liye
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,           // Sirf user ID (minimal data)
        },
        process.env.REFRESH_TOKEN_SECRET,  // Different secret for refresh token
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY  // Longer expiry
        }
    )
}

// ========================================
// EXPORT USER MODEL
// ========================================
// "User" naam se model create karo aur export karo
export const User = mongoose.model("User", userSchema)