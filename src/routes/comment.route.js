import { Router } from "express";
import { getVideoComment,
         addComment,
         updateComment,
         deleteComment
       } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/video-comment").get(verifyJWT, getVideoComment)
router.route("/add-comment").post(verifyJWT, addComment)
router.route("/update-comment").patch(verifyJWT, updateComment)
router.route("/delete-comment").delete(verifyJWT, deleteComment)

export default router