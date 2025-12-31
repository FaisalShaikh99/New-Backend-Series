import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────
// Get Comments for a Video (Paginated)
// ─────────────────────────────────────────────
const getVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const pipeline = [
  {
    $match: { video: new mongoose.Types.ObjectId(videoId) }
  },
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        { $project: { username: 1, avatar: 1, _id: 1 } }
      ]
    }
  },
  { $unwind: "$owner" }, // ✅ This makes owner a single object
  { $sort: { createdAt: -1 } }
];


  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

 const aggregation = Comment.aggregate(pipeline);
 const comments = await Comment.aggregatePaginate(aggregation, options);


  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// ─────────────────────────────────────────────
// Add Comment
// ─────────────────────────────────────────────
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!videoId) throw new ApiError(400, "Video ID is required");
  if (!content || !content.trim())
    throw new ApiError(400, "Comment content is required");

  const createdComment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: userId,
  });

  if (!createdComment) throw new ApiError(500, "Failed to create comment");

  const newComment = await Comment.findById(createdComment._id).populate(
    "owner",
    "username avatar"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment added successfully"));
});

// ─────────────────────────────────────────────
// Update Comment
// ─────────────────────────────────────────────
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!content || !content.trim())
    throw new ApiError(400, "Comment content is required");

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  comment.content = content.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

// ─────────────────────────────────────────────
// Delete Comment
// ─────────────────────────────────────────────
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  await comment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComment, addComment, updateComment, deleteComment };
