// ========================================
// USER CONTROLLER - Business Logic Handler
// ========================================
// Ye file user-related sabhi operations handle karti hai
// Register, Login, Profile updates, etc.

// ========== IMPORTS ==========
import { asyncHandler } from "../utils/asyncHandler.js"; // Error handling wrapper
import {ApiError} from "../utils/ApiError.js"           // Custom error class
import {User} from "../models/user.model.js"            // User model for database operations
import {uploadOnCloudinary} from "../utils/cloudinary.js"  // File upload utility
import { ApiResponse } from "../utils/ApiResponse.js";  // Standardized response format
import jwt from "jsonwebtoken";                         // JWT token operations
import mongoose from "mongoose";                        // MongoDB operations

// ========================================
// HELPER FUNCTIONS
// ========================================

// ========================================
// USER CONTROLLER FUNCTIONS
// ========================================

// ========== USER REGISTRATION ==========
// Naya user register karne ke liye
const registerUser = asyncHandler( async (req, res) => {   
    // ========== REGISTRATION STEPS ==========
    // 1. Frontend se user details leo
    // 2. Validation check karo (empty fields)
    // 3. Check karo ki user already exists hai ya nahi
    // 4. Images check karo (avatar mandatory)
    // 5. Cloudinary mein upload karo
    // 6. Database mein user create karo
    // 7. Password aur refresh token response se hatao
    // 8. Success response bhejo

    console.log(req.files); // Debug: uploaded files check karo
   
    // ========== EXTRACT USER DATA ==========
    const {fullName, email, username, password } = req.body
    console.log("email: ", email);
    console.log(req.body);
    
    // ========== VALIDATION ==========
    // Check karo ki koi field empty to nahi hai
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // ========== DUPLICATE USER CHECK ==========
    // Check karo ki username ya email already exist karta hai
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]  // Username ya email se search karo
    })

    console.log(existedUser);
    
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // ========== FILE UPLOAD HANDLING ==========
    // Avatar file path extract karo
   const avatarLocalPath = req.files?.avatar[0]?.path;
   console.log(avatarLocalPath);
   
   // Cover image optional hai, check karo ki hai ya nahi
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    // ========== AVATAR VALIDATION ==========
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // ========== CLOUDINARY UPLOAD ==========
    // Files ko Cloudinary mein upload karo
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   
    // Check karo ki avatar successfully upload hua ya nahi
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   
    // ========== USER CREATION ==========
    // Database mein naya user create karo
    const user = await User.create({
        fullName,
        avatar: avatar.url,                    // Cloudinary URL
        coverImage: coverImage?.url || "",     // Cover image URL (optional)
        email, 
        password,                              // Password automatically hash hoga (pre middleware)
        username: username.toLowerCase()       // Username lowercase mein store karo
    })

    // ========== RESPONSE PREPARATION ==========
    // User data fetch karo (password aur refresh token ke bina)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  // Password aur refresh token exclude karo
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // ========== SUCCESS RESPONSE ==========
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

// ========== TOKEN GENERATION HELPER ==========
// Ye function access aur refresh token dono generate karta hai
const generateAccessAndRefreshToken = async(userId) => {
    try {
       const user = await User.findById(userId)  // Database se user fetch karo
       const accessToken = user.generateAccessToken(); // Access token generate karo
       const refreshToken  = user.generateRefreshToken(); // Refresh token generate karo

       // Refresh token ko database mein store karo
       user.refreshToken  = refreshToken; 
       await user.save({validateBeforeSave : false}) // Validation skip karo

       return {accessToken, refreshToken}

      } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

// ========== USER LOGIN ==========
// Existing user login karne ke liye
const loginUser =  asyncHandler( async (req, res) => {
    // ========== LOGIN STEPS ==========
    // 1. Username/email aur password leo
    // 2. Database mein user search karo
    // 3. Password verify karo
    // 4. Access aur refresh token generate karo
    // 5. Cookies mein tokens store karo
    // 6. Success response bhejo

    const {username, email, password} = req.body
    
    // ========== INPUT VALIDATION ==========
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // ========== USER LOOKUP ==========
    // Database mein user search karo (username ya email se)
    const user = await User.findOne({
        $or : [{username}, {email}]  // Username ya email se search karo
    })
 
    if (!user) { 
        throw new ApiError(400, "User does not exist")      
    }

    // ========== PASSWORD VERIFICATION ==========
    // User model ke method se password verify karo
    const isPasswordValid = await user.isPasswordCorrect(password) 
    if (!isPasswordValid) { 
        throw new ApiError(400, "Password incorrect")      
    }

    // ========== TOKEN GENERATION ==========
    // Access aur refresh token generate karo
   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id); 
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken") 

   // ========== COOKIE OPTIONS ==========
   // Security ke liye cookie options set karo
   const options = { 
         httpOnly : true,  // JavaScript se access nahi kar sakte
         secure : true     // HTTPS pe hi send hoga
   }

   // ========== SUCCESS RESPONSE ==========
   return res   
   .status(200)
   .cookie("accessToken", accessToken, options)  // Access token cookie mein
   .cookie("refreshToken", refreshToken, options) // Refresh token cookie mein
   .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User loggedin successfully"
        )
   )
})

// ========== USER LOGOUT ==========
// User logout karne ke liye
const logoutUser = asyncHandler( async (req, res) => {
    // ========== TOKEN CLEANUP ==========
    // Database se refresh token remove karo
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1  // Refresh token field remove karo
            }
        },
        {
            new : true
        }
     )
     
     // ========== COOKIE CLEARING ==========
     const options = {
         httpOnly : true,
         secure : true 
   }
   
   return res
   .status(200)
   .clearCookie("accessToken", options)  // Access token cookie clear karo
   .clearCookie("refreshToken", options) // Refresh token cookie clear karo
   .json(new ApiResponse(200, {}, "User logged out"))
})

// ========== REFRESH ACCESS TOKEN ==========
// Access token refresh karne ke liye
const refreshAccessToken = asyncHandler(async (req, res) => {

    // ========== TOKEN EXTRACTION ==========
    // Refresh token cookie ya body se leo
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        // ========== TOKEN VERIFICATION ==========
        // Refresh token verify karo
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        // ========== USER LOOKUP ==========
        // Token se user ID extract karo aur user find karo
        const user =  await User.findById(decodedToken?._id)
    
       if (!user) {
         throw new ApiError(401, "Invalid Refresh token")   
       }
    
       // ========== TOKEN VALIDATION ==========
       // Check karo ki token database mein stored token se match karta hai
       if (incomingRefreshToken !== user?.refreshToken) {
           throw new ApiError(401, "Refresh token is expried aur used")
       }
    
       // ========== NEW TOKEN GENERATION ==========
       const options = {
        httpOnly : true,
        secure : true
       }
    
       // Naye access aur refresh token generate karo
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
       // ========== SUCCESS RESPONSE ==========
       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newRefreshToken, options)
       .json(
         new ApiResponse(
            200,
            {accessToken, newRefreshToken},
            "Access Token refreshed Successfully"
         )
       )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

// ========== CHANGE PASSWORD ==========
// User password change karne ke liye
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    // ========== CURRENT USER LOOKUP ==========
    const user = await User.findById(req.user?._id)
    
    // ========== OLD PASSWORD VERIFICATION ==========
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // ========== PASSWORD UPDATE ==========
    user.password = newPassword
    await user.save({validateBeforeSave: false}) // Pre middleware automatically hash karega

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

// ========== GET CURRENT USER ==========
// Logged in user ka data fetch karne ke liye
const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "current user fetched successfully"))
})

// ========== UPDATE ACCOUNT DETAILS ==========
// User ka basic info update karne ke liye
const updateAccountDetails = asyncHandler( async (req, res) => {
    
    const{fullName, email} = req.body
    console.log(fullName);
    
    // ========== VALIDATION ==========
    if(!fullName && !email){
        throw new ApiError(400, "All fields are required")
    }

    // ========== USER UPDATE ==========
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },
        {new : true}  // Updated data return karo
    ).select("-password") // Password exclude karo

    return res
    .status(200)
    .json(new ApiResponse(
        200, user, "Account details updated successfully"
    ))
})

// ========== UPDATE USER AVATAR ==========
// User ka profile picture update karne ke liye
const updateUserAvatar = asyncHandler( async(req, res) => {
    // ========== FILE EXTRACTION ==========
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
         throw new ApiError(400, "Avatar file is missing")
    }

    // ========== CLOUDINARY UPLOAD ==========
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }
    
    // ========== DATABASE UPDATE ==========
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    // TODO: Purane avatar ko Cloudinary se delete karo

    return res
    .status(200)
    .json(
        new ApiResponse(
        200, user, "Avatar updated successfully"
    ))
})

// ========== UPDATE USER COVER IMAGE ==========
// User ka cover image update karne ke liye
const updateUserCoverImage = asyncHandler( async(req, res) => {
    // ========== FILE EXTRACTION ==========
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
         throw new ApiError(400, "Cover image file is missing")
    }

    // ========== CLOUDINARY UPLOAD ==========
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image");
    }

    // ========== DATABASE UPDATE ==========
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
            coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200, user, "Cover image  updated successfully"
    ))
})

// ========== GET USER CHANNEL PROFILE ==========
// Kisi specific user ka channel profile fetch karne ke liye
const getUserChannleProfile = asyncHandler( async (req,res) => {
      const {username} = req.params

      // ========== VALIDATION ==========
      if (!username?.trim()) {
          throw new ApiError(400, "username is missing")
      }

     // ========== AGGREGATION PIPELINE ==========
     // Complex query with multiple lookups
     const channel = await User.aggregate([
        {
            // ========== MATCH STAGE ==========
            // Username se user find karo
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            // ========== SUBSCRIBERS LOOKUP ==========
            // Jo log is user ko subscribe karte hain
            $lookup : {
                from : "subscriptions",     // Subscriptions collection
                localField : "_id",         // User ka _id
                foreignField : "channel",   // Subscription mein channel field
                as : "subscribers"          // Result array ka naam
            }
        },
        {
            // ========== SUBSCRIBED TO LOOKUP ==========
            // Jo channels ye user subscribe karta hai
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            // ========== ADD FIELDS STAGE ==========
            // Naye calculated fields add karo
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"  // Subscribers array ka size
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo" // Subscribed channels ka size
                },
                isSubscribed : {
                    // ========== CONDITIONAL LOGIC ==========
                    // Check karo ki current user is channel ko subscribe karta hai ya nahi
                    $cond : {
                        if : {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
          // ========== PROJECT STAGE ==========
          // Sirf required fields return karo
          $project : {
             fullName : 1,
             username : 1,
             subscribersCount : 1,
             channelsSubscribedToCount : 1,
             isSubscribed : 1,
             avatar : 1,
             coverImage : 1,
             email : 1
        }
        }
    ])

    // ========== VALIDATION ==========
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
    
})

// ========== GET WATCH HISTORY ==========
// User ka video watch history fetch karne ke liye
const getWatchHistory =  asyncHandler( async (req, res) => {
    // ========== AGGREGATION PIPELINE ==========
    const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
        $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            { $project: { fullName: 1, username: 1, avatar: 1 } }
                        ]
                    }
                }
            ]
        }
    }
]);

if (!user[0]) {
    return res.status(404).json(new ApiResponse(404, [], "User not found"));
}

return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully"));
})

// ========================================
// EXPORT ALL CONTROLLER FUNCTIONS
// ========================================
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannleProfile,
    getWatchHistory
}