import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const toggleVideoLike = asyncHandler( async (req, res) => {
     const {videoId} =  req.params
     const userId = req.user._id
    //   let isLiked = false;

     // check if valid ObjectId
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video Id");
        }
      if (!videoId) {
         throw new ApiError(401, "video Id is required");
      }
    
      const existingLike = await Like.findOne(
        {
            video : videoId,
            likedBy : userId
        }
      )

      if (existingLike) { // if like is
           // unlike
           await Like.deleteOne({ _id: existingLike._id })
           return res.status(200).json(
            new ApiResponse(200, null, "Video unliked successfully ")
           )
      }
    //   const likes = await Like.apply(
    //     isLiked = !isLiked,
    //     isLiked = !isLiked
    //   )

       // new like
      const newLike = await Like.create(
         {
            video : videoId,
            likedBy : userId
        }
      )
      
      return res.status(200).json(
            new ApiResponse(200, newLike, "Video liked successfully ")
           )
})

const toggleCommentike = asyncHandler( async (req, res) => {
      const {commentId} =  req.params
      const userId = req.user._id
    //   let isLiked = false;

     // check if valid ObjectId
    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment Id");
     }
      if (!commentId) {
         throw new ApiError(401, "comment Id is required");
      }
    
      const existingLike = await Like.findOne(
        {
            comment : commentId,
            likedBy : userId
        }
      )

      if (existingLike) { // if like is
           // unlike
           await Like.deleteOne({ _id: existingLike._id })
           return res.status(200).json(
            new ApiResponse(200, null, "comment unliked successfully ")
           )
      }
    //   const likes = await Like.apply(
    //     isLiked = !isLiked,
    //     isLiked = !isLiked
    //   )

       // new like
      const newLike = await Like.create(
         {
            comment : commentId,
            likedBy : userId
        }
      )
      
      return res.status(200).json(
            new ApiResponse(200, newLike, "comment liked successfully ")
           )
})

const toggleTweetLike = asyncHandler( async (req, res) => {
      const {tweetId} =  req.params
      const userId = req.user._id
    //   let isLiked = false;
     // check if valid ObjectId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }
      if (!tweetId) {
         throw new ApiError(401, "Tweet Id is required");
      }
    
      // check like is exist or not

      const existingLike = await Like.findOne(
        {
            tweet : tweetId,
            likedBy : userId
        }
      )

      if (existingLike) { // if like is
           // unlike
           await Like.deleteOne({ _id: existingLike._id })
           return res.status(200).json(
            new ApiResponse(200, null, "Tweet unliked successfully ")
           )
      }
    //   const likes = await Like.apply(  // this is my logic but apply method is not working in mongoose
    //     isLiked = !isLiked,
    //     isLiked = !isLiked
    //   )

      // new like
      const newLike = await Like.create(
         {
            tweet : tweetId,
            likedBy : userId
        }
      )
      
      return res.status(200).json(
            new ApiResponse(200, newLike, "Tweet liked successfully ")
           )
})

const getLikedVideo = asyncHandler ( async (req, res) => {
    const  userId =  req.user._id
  // check if valid ObjectId
     if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user Id");
     }
    const likedVideos = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(userId) 
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videoDetails"
            }
        }
    ])

    return res.status(200).json(likedVideos)
})

export {
    toggleVideoLike,
    toggleCommentike,
    toggleTweetLike,
    getLikedVideo
}