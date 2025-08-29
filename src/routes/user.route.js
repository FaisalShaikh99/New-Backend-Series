// outes (user.route.js) → routes define karta hai (e.g. /register, /login).
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"


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
    registerUser
    )

export default router