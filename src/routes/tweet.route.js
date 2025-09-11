import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createTweet,
         getUserTweet,
         updateTweet,
         deleteTweet
 } from "../controllers/tweet.controller";

 const router = Router()

 router.route("/create-tweet").post(verifyJWT, createTweet)
 router.route("/user-tweet").get(verifyJWT, getUserTweet)
 router.route("/update-tweet").patch(verifyJWT, updateTweet)
 router.route("/delete-tweet").delete(verifyJWT, deleteTweet)

 export default router