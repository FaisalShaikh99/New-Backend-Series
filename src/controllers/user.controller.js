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
import { OAuth2Client } from "google-auth-library";
import { verifyMail } from "../emailVerify/verifyMail.js";
import { Session } from "../models/session.Model.js";
import { sendOtpMail } from "../emailVerify/sendOtp.js";
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

    const token = jwt.sign({ id: user._id }, process.env.EMAIL_VERIFY_SECRET, { expiresIn: "10m" })
        verifyMail(token, email)
        user.token = token
        await user.save()
    // ========== SUCCESS RESPONSE ==========
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      throw new ApiError(400, "Verification token missing");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);
    } catch (err) {
      throw new ApiError(400, "Verification link expired or invalid");
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
      return res.status(200).json(
        new ApiResponse(200, null, "Email already verified")
      );
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;

    await user.save();

    return res.status(200).json(
      new ApiResponse(200, null, "Email verified successfully")
    );

  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

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
const  loginUser =  asyncHandler( async (req, res) => {
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

    // Google account check
    if (user.googleId) {
    throw new ApiError(
        400,
        "This account was created using Google login"
    );
    }

    // Password required
    if (!password) {
    throw new ApiError(400, "Password is required");
    }

    // Password verification
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
    throw new ApiError(400, "Password incorrect");
    }

    if (!user.isVerified) {
       throw new ApiError(403, "Verify your account before login");
    }

    // check for existing session and delete it
        const existingSession = await Session.findOne({ userId: user._id });
        if (existingSession) {
            await Session.deleteOne({ userId: user._id })
        }

        //create a new session
        await Session.create({ userId: user._id })

    // ========== TOKEN GENERATION ==========
    // Access aur refresh token generate karo
   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id); 
   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });  
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken") 

    user.isLoggedIn = true;
    await user.save()

   // ========== COOKIE OPTIONS ==========
   // Security ke liye cookie options set karo
   const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
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
            `Welcome back ${user.username}`
        )
   )
})

// ============ THIRD PARTY AUTHENTICATION ===========
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        throw new ApiError(400, "Google idToken is required");
    }

    // STEP 1: Verify Google Token
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    // STEP 2: Get Payload from Google
    const payload = ticket.getPayload();

    const { email, name, picture, sub } = payload;

    let avatarUrl = picture?.replace("=s96-c", "=s400-c");;
    
    
    if (avatarUrl && avatarUrl.endsWith('/picture/0')) { 
        avatarUrl = `${req.protocol}://${req.get('host')}/images/default-avatar.png`; 
    }

    if (!email) {
        throw new ApiError(400, "Google email not found");
    }

    // STEP 3: Find or Create User
    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            fullName: name,
            email,
            avatar: avatarUrl,
            username: email.split("@")[0],
            googleId: sub,
            password: null,
            isLoggedIn : true,
            isVerified : true  
        });
    }
    console.log(user);

    // STEP 4: Generate Tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = { httpOnly: true, secure: true };

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Google Login Successful")
        );
});

// ========== LOGOUT ==========
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

    const userId = req.user._id;
    await Session.deleteMany( {userId} );
    await User.findByIdAndUpdate( userId, { isLoggedIn: false })

   return res
   .status(200)
   .clearCookie("accessToken", options)  // Access token cookie clear karo
   .clearCookie("refreshToken", options) // Refresh token cookie clear karo
   .json(new ApiResponse(200, {}, "User logged out"))
})

const forgotPassword = asyncHandler( async (req, res) => {
    const {email} =  req.body;

    const user = await User.findOne({email})
    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000)

    user.otp = otp,
    user.otpExpiry = expiry

    await user.save()
    await sendOtpMail(email, otp);
    return res
    .json(
        new ApiResponse(
            200,
             "Otp send Successfully"
        )
    )
})

const verifyOTP = asyncHandler( async (req, res) => {
    const {otp} = req.body
    const {email} = req.params

    console.log(otp)
     if(!otp){
        throw new ApiError(404, "OTP not found")
    }

    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404, "User not found")
    }

    if(!user.otp || ! user.otpExpiry){
        throw new ApiError(401, "OTP not generated or already verified")
    }

    if( user.otpExpiry < new Date()){
        throw new ApiError(400, "OTP has expired, Please generate new OTP")
    }

    if(otp !== user.otp){
        throw new ApiError(400, "Invalid OTP")
    }

    user.otp = null;
    user.otpExpiry = null;
    user.isOtpVerified = true;
    await user.save();

    return res
    .json(
        new ApiResponse(
            200,
            "OTP verified successfully"
        )
    )
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {newPassword, confirmPassword} = req.body
    const {email} = req.params
    console.log(newPassword, confirmPassword, email)

    if(!newPassword || !confirmPassword){
        throw new ApiError(400, "All fields are required")
    }


    if(newPassword !== confirmPassword){
       throw new ApiError(400, "Password do not match")
    }
    // ========== CURRENT USER LOOKUP ==========
   const user = await User.findOne({ email });

    if(!user){
        throw new ApiError(404, "User not found")
    }

    if (!user.isOtpVerified) {
        throw new ApiError(403, "OTP verification required");
    }
    // ========== PASSWORD UPDATE ==========
    user.password = newPassword
    user.otp = null;
    user.otpExpiry = null;
    user.isOtpVerified = false;

    await user.save();


    return res
    .status(200)
    .json(new ApiResponse(200, null,  "Password changed successfully"))
})
// ========== REFRESH ACCESS TOKEN ==========
// Access token refresh karne ke liye
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request - refresh token missing");
  }

  try {
    // 1️⃣ Verify incoming refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // 2️⃣ Find user by decoded token _id
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token - user not found");
    }

    // 3️⃣ Validate refresh token with DB
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token expired or already used");
    }

    // 4️⃣ Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true, // production ke liye
      sameSite: "strict",
    };

    // 5️⃣ Send cookies + response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});


// ========== CHANGE PASSWORD ==========
// User password change karne ke liye


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
    
    const{fullName, username, email} = req.body
    console.log(fullName);
    
    // ========== VALIDATION ==========
    if(!fullName && !username && !email  ){
        throw new ApiError(400, "All fields are required")
    }

    // ========== USER UPDATE ==========
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                username,
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
    verifyEmail,
    loginUser,
    googleLogin,
    logoutUser,
    forgotPassword,
    verifyOTP,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannleProfile,
    getWatchHistory
}