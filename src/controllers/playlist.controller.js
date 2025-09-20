import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler( async (req, res) => {
      const {name, description} = req.body
      const userId =  req.user._id
      const {videoId} = req.params

        if (!videoId) {
            throw new ApiError(404, "Video id is required")
        }
        if (!name?.trim() || !description?.trim()) {
            throw new ApiError(400, "Name and description are required");
        }

      const newPlaylist = await Playlist.create(
            {
                name,
                description,
                video : [videoId],
                owner : userId 
            }    
      )

      return res
      .status(200)
      .json(
        new ApiResponse(200, newPlaylist, "Created new Playlist successfully")
      )
})

const getUserPlaylists = asyncHandler( async (req, res) => {
    const {userId} = req.params

    if (!userId) {
        throw new ApiError(404, "User id is not found")
    }

    const userPlaylist = await Playlist.aggregate(
        [
            {
                $match : {
                    owner : new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as:"ownerDetails"
                }
            }
        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylist, "Got user playlist successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!playlistId) {
        throw new ApiError(404, "Playlist id is not found")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Got playlist successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {videoId, playlistId} = req.params
    const userId = req.user._id
    if (!playlistId || !videoId) {
        throw new ApiError(404, "Playlist and video are required")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not allowed to modify this playlist")
    }
    
    
    // check video is already exist or not in playlist
    if (playlist.video.includes(videoId)) {
        throw new ApiError(400, "This video is already exist in playlist")
    }


    playlist.video.push(videoId)
    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
        const {playlistId, videoId} = req.params
        const userId = req.user._id
        if (!playlistId || !videoId) {
            throw new ApiError(404, "Playlist and video are required")
        }

        const playlist = await Playlist.findOneAndUpdate(
            {
                _id : playlistId,
                owner : userId
            },
            {
                $pull : {
                    video : videoId
                }
            },
            {
                new : true
            }
        )

        if (!playlist) {
            throw new ApiError(400, "Playlist not found or you are not the owner");
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video removed from playlist successfully")
        )
    })

const updatePlaylist = asyncHandler(async (req, res) => {
        const {playlistId} = req.params
        const {name, description} = req.body
        const userId = req.user?._id
    
     if (!name?.trim() || !description?.trim()) {
            throw new ApiError(400, "Name and description are required");
        }
    
        const playlist = await Playlist.findById(playlistId)  
          
        if (!playlist) {
            throw new ApiError(403, "playlist not found")
        }
        
        // check ownership
    
        if(playlist.owner.toString() !== userId.toString()) {
            throw new ApiError(401, "You are not allowed to update this playlist")
        }
     
        //Update
        playlist.name = name
        playlist.description = description
        await playlist.save()
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist updated successfully")
        )   
    
}) 

const deletePlaylist = asyncHandler(async (req, res) => {
     const {playlistId} = req.params
         const userId = req.user?._id
    
         const playlist = await Playlist.findById(playlistId)  
          
        if (!playlist) {
            throw new ApiError(403, "playlist not found")
        }
    
        if(playlist.owner.toString() !== userId.toString()) {
            throw new ApiError(401, "You are not allowed to delete this playlist")
        }
    
        await playlist.deleteOne()
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Playlist deleted Successfully")
        )
        
})



export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist
}