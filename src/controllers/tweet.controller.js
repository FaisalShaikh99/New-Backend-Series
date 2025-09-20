import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler( async (req, res) => {
    const {content} =  req.body
    const userId = req.user._id
    if (!content || content?.trim() === "") {
        throw new ApiError(400, "content is required")
    }

   const newTweet = await Tweet.create({
    content,
    owner : userId
   })

   return res
      .status(201)
      .json(
        new ApiResponse(201, newTweet, "New Tweet created successfully")
      )
})


const getUserTweets = asyncHandler( async (req, res) => {
    const userId = req.user._id

    if (!userId) {
        throw new ApiError(404, "User is not found")
    }
    const userTweet =  await Tweet.aggregate([
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
                as : "ownerDetails"
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "ownerDetails.fullName": 1,
                "ownerDetails.email": 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweet, "Got user tweets Successfully" )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user._id;
    const { tweetId } = req.params;

    if (!userId) {
        throw new ApiError(404, "User is not found");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    if (!tweetId) {
        throw new ApiError(400, "Tweet id is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "You're not allowed to update this tweet");
    }

    tweet.content = content;
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});


const deleteTweet = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "Tweet id is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "You're not allowed to delete this tweet");
    }

    await tweet.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}