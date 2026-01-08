// outes (user.route.js) → routes define karta hai (e.g. /register, /login).
import { Router } from "express";
import { changeCurrentPassword,
         getCurrentUser, 
         getUserChannleProfile,
         getWatchHistory,
         loginUser,
         googleLogin, 
         logoutUser, 
         registerUser, 
         updateAccountDetails,
         updateUserAvatar, 
         updateUserCoverImage,
         verifyEmail,
         forgotPassword,
         verifyOTP,
         refreshAccessToken} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(
    upload.fields([   // upload file avatar and coverImage
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)
router.route("/verify-email/:token").get(verifyEmail)
router.route("/login").post(loginUser)    
router.route("/googleLogin").post(googleLogin)    
router.route("/forgot-password").post(forgotPassword)
router.route("/verify-otp/:email").post(verifyOTP)
router.route("/reset-password/:email").post(changeCurrentPassword)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannleProfile)
router.route("/history").get(verifyJWT, getWatchHistory)


export default router  