import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

// verify tokens
export const verifyJWT = asyncHandler( async (req, _, next) => {
  try {
    // yaha per accesstoken ka refrence user controller me se mila hai jo hamne cookies ke through kara tha
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")
  
      if (!token) { // agar token nahi mila to error
          throw new ApiError(401, "Unauthorized request")
      }
      // validation for token
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
      if (!user) {
          throw new ApiError(401, "Invalid accessToken")
      }
  
      req.user =  user; // yaha se hame req karne se user mil jata hai db se
      next(); // abb middleware next kar deta hai fir compliler logout per jata hai
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid access token")
  }
})
