import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { toggleVideoLike,
         toggleCommentike,
         toggleTweetLike,
         getLikedVideo
 } from "../controllers/like.controller";

const router = Router();

router.route("/videos/:videoId/like").post(verifyJWT, toggleVideoLike)
router.route("/comments/:commentId/like").post(verifyJWT, toggleCommentike)
router.route("/tweets/:tweetId/like").post(verifyJWT, toggleTweetLike)
router.route("/liked-videos").get(verifyJWT, getLikedVideo)

export default router