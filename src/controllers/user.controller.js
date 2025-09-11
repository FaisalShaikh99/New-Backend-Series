// controllers (user.controller.js) → business logic handle karta hai (Cloudinary me upload, DB me save, etc.).
import { asyncHandler } from "../utils/asyncHandler.js"; // ye controllers ko handle karta hai
import {ApiError} from "../utils/ApiError.js" // isse ham error handing karna aasan hoga jis code ApiError file me dekh sakte ho
import {User} from "../models/user.model.js" // User create karne ke liye user model ki need hogi
import {uploadOnCloudinary} from "../utils/cloudinary.js"  // kisi bhi file upload karne ke liye cloudinary ki need hai
import { ApiResponse } from "../utils/ApiResponse.js"; // response ke liye
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId) => {
    try {
       const user = await User.findById(userId)  // get user from db by the userid
       const accessToken = user.generateAccessToken(); // generate access token from user.model.js
       const refreshToken  = user.generateRefreshToken(); // generate refresh token from user.model.js

       user.refreshToken  = refreshToken; // store refresh token in db
       await user.save({validateBeforeSave : false}) // user ka data vapas validation na ho isliye use save kar ke false kara hai

       return {accessToken, refreshToken}

      } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

const registerUser = asyncHandler( async (req, res) => {   // first controller register
    // steps :
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    console.log(req.files);
   
    const {fullName, email, username, password } = req.body
    console.log("email: ", email);
    console.log(req.body);
    
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")  // if data empty
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    console.log(existedUser);
    
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   console.log(avatarLocalPath);
   
//    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   // agar avatar nahi mila tu
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    // creating user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser =  asyncHandler( async (req, res) => {
    // step:
    // get user detail from database
    // compare conditon for username/email aur password
    // check validation that user has been already exist or not
    // use of access and refresh token

    const {username, email, password} = req.body
    
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    // checking of username and email in database 
    const user = await User.findOne({
        $or : [{username}, {email}]  // username ya email se check hoga
    })
 
    if (!user) { // agar user nahi hai to error
        throw new ApiError(400, "User does not exist")      
    }

    const isPasswordValid = await user.isPasswordCorrect(password) // password valid hai
    if (!isPasswordValid) { // agar pass valid nahi hai to error
        throw new ApiError(400, "Password incorrect")      
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id); // call uper vale fn ko aur access and refresh token user ko diye
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // loggedin user password aur refresh token vapas nahi karne

   const options = { // security ke liye
         httpOnly : true,  
         secure : true 
   }

   return res   // return response
   .status(200)
   .cookie("accessToken", accessToken, options) // cookie through ham ye dono token ko access kar sakege
   .cookie("refreshToken", refreshToken, options)
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

const logoutUser = asyncHandler( async (req, res) => {
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        },
        {
            new : true
        }
     )
     const options = {
         httpOnly : true,
         secure : true 
   }
   
   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged out"))
})
console.log(logoutUser);

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user =  await User.findById(decodedToken?._id)
    
       if (!user) {
         throw new ApiError(401, "Invalid Refresh token")   
       }
    
       if (incomingRefreshToken !== user?.refreshToken) {
           throw new ApiError(401, "Refresh token is expried aur used")
       }
    
       const options = {
        httpOnly : true,
        secure : true
       }
    
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
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

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    
    const{fullName, email} = req.body
    console.log(fullName);
    
    if(!fullName && !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200, user, "Account details updated successfully"
    ))
})

const updateUserAvatar = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
         throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    // delete old avatar

    

    return res
    .status(200)
    .json(
        new ApiResponse(
        200, user, "Avatar updated successfully"
    ))
})

const updateUserCoverImage = asyncHandler( async(req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
         throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image");
    }

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

const getUserChannleProfile = asyncHandler( async (req,res) => {
      const {username} = req.params

      if (!username?.trim()) {
          throw new ApiError(400, "username is missing")
      }

     const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
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

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

    console.log(channel);
    
})

const getWatchHistory =  asyncHandler( async (req, res) => {
    const user = User.aggregate([
        {
           $match : {
            _id : new mongoose.Types.ObjectId(req.user._id) 
           }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                      $lookup : {
                         from : "users",
                         localField : "owner",
                         foreignField : "_id",
                         as : "owner",
                         pipeline : [
                            {
                                $project : {
                                    fullName : 1,
                                    username : 1,
                                    avatar : 1
                                }
                            }
                         ]
                       }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully")
    )
})

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