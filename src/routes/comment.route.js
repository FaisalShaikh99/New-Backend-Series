import { Router } from "express";
import { getVideoComment,
         addComment,
         updateComment,
         deleteComment
       } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/video-comment/:videoId").get(verifyJWT, getVideoComment)
router.route("/add-comment/:videoId").post(verifyJWT, addComment)
router.route("/update-comment/:commentId").patch(verifyJWT, updateComment)
router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment)

export default router