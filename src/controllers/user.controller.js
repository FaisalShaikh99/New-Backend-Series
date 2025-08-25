import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js';
import {User} from "../models/user.model.js"
import { uploadCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler( async (req, res) => {
   // get user details from frontend
   // validation - not empty
   // check if user already exist by user and email
   // check for images, check for avtar
   // upload them to cloudinary
   // create user object - creart entry to db
   // remove password and refresh token field from response
   // check for user creation
   // return response


   const {username, email, fullName, password} = req.body
   
   if (
    [ username, email, password , fullName].some((field) => 
    field?.trim() === "")
)   {
  throw new ApiError(400, "All fields are required")  
   }
   if (!email.includes("@" || !email.includes("."))) {
    throw new ApiError(400, "Invalid email format")
 }

 const existedUser = User.findOne({
    $or : [{username}, {email}]
 })

  if (existedUser) {
    throw new ApiError(409, "User with email or username alreadt exists") 
  }
 
  const avatarLocalPath = req.files?.avatar[0]?.path 
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }

 const avatar = await uploadCloudinary(avatarLocalPath)
 const coverImage = await uploadCloudinary(coverImageLocalPath)
 
 if (!avatar) {
      throw new ApiError(400, "Avatar file is required")  
 }

 const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    username: username.toLowerCase()
 })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong While registering a user")
    
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully")
  )


})

 


export {registerUser};