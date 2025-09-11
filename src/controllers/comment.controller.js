import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import {Comment} from "../models/comment.model"
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse";

const getVideoComment = asyncHandler( async (req, res) => {
     const {videoId} =  req.params
     const {page = 1, limit = 10} = req.query
     
     if (!videoId ) {
           throw new ApiError(400, "Video is required")
     }

    const pipeline =  [
        {
            $match : {
               video : new mongoose.Types.ObjectId(videoId)
          }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerDetails"
            }
        }
     ]

    const options = {
        page : parseInt(page,10) || 1,
        limit : parseInt(limit, 10) || 10
    }  

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline), options
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments)
    )
})

const addComment = asyncHandler( async (req, res) => {
      // add comment to a video
      const {videoId} =  req.params
      const {content} =  req.body
      const userId = req.user?._id

      if (!videoId) {
           throw new ApiError(400, "video ID is required")
      }

      
      if (!content || content.trim() === "") {
           throw new ApiError(400, "Comment content is required")
      }
      
      const newComment = await Comment.create({
        content,
        video : videoId,
        owner : userId
      })

      return res
      .status(200)
      .json(
        new ApiResponse(201, newComment, "Comment added successfully")
      )
})

const updateComment = asyncHandler( async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body
    const userId = req.user?._id


    if (!content || content.trim() === "") {
           throw new ApiError(400, "Comment content is required")
      }

    const comment = await Comment.findById(commentId)  
      
    if (!comment) {
        throw new ApiError(403, "comment not found")
    }
    
    // check ownership

    if(comment.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "You are not allowed to update this comment")
    }
 
    //Update
    comment.content = content
    await comment.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )   

})

const deleteComment = asyncHandler( async (req, res) => {
     const {commentId} = req.params
     const userId = req.user?._id

     const comment = await Comment.findById(commentId)  
      
    if (!comment) {
        throw new ApiError(403, "comment not found")
    }

    if(comment.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "You are not allowed to delete this comment")
    }

    await comment.deleteOne()

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment deleted Successfully")
    )
    
})

export {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}