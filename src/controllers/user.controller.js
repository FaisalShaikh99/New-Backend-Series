// controllers (user.controller.js) → business logic handle karta hai (Cloudinary me upload, DB me save, etc.).
import { asyncHandler } from "../utils/asyncHandler.js"; // ye controllers ko handle karta hai
import {ApiError} from "../utils/ApiError.js" // isse ham error handing karna aasan hoga jis code ApiError file me dekh sakte ho
import { User} from "../models/user.model.js" // User create karne ke liye user model ki need hogi
import {uploadOnCloudinary} from "../utils/cloudinary.js"  // kisi bhi file upload karne ke liye cloudinary ki need hai
import { ApiResponse } from "../utils/ApiResponse.js"; // response ke liye

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


export {
    registerUser,
}