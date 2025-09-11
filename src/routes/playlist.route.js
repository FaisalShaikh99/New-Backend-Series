import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { addVideoToPlaylist, createPlaylist, deletePlaylist,
     getPlaylistById, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller";

const router = Router()
router.route("/create-playlist").post(verifyJWT, createPlaylist)
router.route("/user-playlist").get(verifyJWT, getUserPlaylist)
router.route("/playlist/playlistId").get(verifyJWT, getPlaylistById)
router.route("/playlist/video/add").get(verifyJWT, addVideoToPlaylist)
router.route("/playlist/video/remove").get(verifyJWT, removeVideoFromPlaylist)
router.route("/update-playlist").patch(verifyJWT, updatePlaylist)
router.route("/delete-playlist").delete(verifyJWT, deletePlaylist)

export default router 