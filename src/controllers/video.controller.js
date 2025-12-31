import { Video } from "../models/video.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose"

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [];

  // ===== Search Query =====
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  // ===== Filter by Specific User =====
  if (userId) {
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  // ===== Only Published Videos =====
  pipeline.push({ $match: { isPublished: true } });

  // ===== Sort Stage =====
  if (sortBy && sortType) {
    const sort = {};
    sort[sortBy] = sortType === "desc" ? -1 : 1;
    pipeline.push({ $sort: sort });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  // ===== Lookup Owner Details =====
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerDetails",
    },
  });

  // ===== Unwind Owner =====
  pipeline.push({
    $unwind: {
      path: "$ownerDetails",
      preserveNullAndEmptyArrays: true,
    },
  });

  // ===== Project Required Fields =====
  pipeline.push({
    $project: {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      views: 1,
      isPublished: 1,
      createdAt: 1,
      updatedAt: 1,
      owner: {
        _id: "$ownerDetails._id",
        username: "$ownerDetails.username",
        avatar: "$ownerDetails.avatar",
        subscribersCount: "$ownerDetails.subscribersCount",
      },
    },
  });

  // ===== Pagination =====
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const aggregate = Video.aggregate(pipeline);
  const videos = await Video.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const searchVideos = asyncHandler(async (req, res) => {
  const { query = "", limit = 8 } = req.query;

  if (!query || String(query).trim().length === 0) {
      throw new ApiError(400, "No query provided")
  }

  // Simple regex search on title and description, case-insensitive
  const regex = { $regex: query, $options: "i" };

  const docs = await Video.find({
    isPublished: true,
    $or: [{ title: regex }, { description: regex }],
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .select("title thumbnail description duration views")
    .lean();  // .lean() (performance booster)

  // Return lightweight suggestion objects
  const suggestions = docs.map((d) => ({
    _id: d._id,
    title: d.title,
    thumbnail: d.thumbnail,
    description: d.description,
  }));

  return res.status(200).json(new ApiResponse(200, suggestions, "Search results"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, duration } = req.body;
  const userId = req.user?._id;

  // validation
  if ([title, description].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail files are required");
  }

  // upload to cloudinary
  const video = await uploadOnCloudinary(videoLocalPath, "video");
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image");

  if (!video || !thumbnail) {
    throw new ApiError(400, "Video and thumbnail upload failed");
  }

  // save in DB
  const newVideo = await Video.create({
    videoFile: video.secure_url,
    thumbnail: thumbnail.secure_url,
    title,
    description,
    duration,
    owner: userId,
  });

  if (!newVideo) {
    throw new ApiError(500, "Something went wrong while publishing the video");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler( async(req, res) => {
      const {videoId} = req.params

      if (!videoId) {
            throw new ApiError(400, "Video Id is required")
      }

      const video = await Video.findById(videoId)
      .populate({
        path: "owner",
        // Ye part MongoDB ko batata hai ki:
        // “User document me se sirf ye specific fields hi bhejna —
        // baaki sab (jaise password, email, etc.) mat bhejna.”
        select: "username views duration fullName avatar subscribersCount isSubscribed"
      });

      if (!video) {
        throw new ApiError(404, "Video not found");
      }  
      return res.status(201).json(new ApiResponse(201, video, "Got video successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  const { title, description, thumbnail } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== userId.toString()) {
    throw new ApiError(401, "You are not allowed to update this video");
  }

  if (title) video.title = title;
  if (description) video.description = description;
  if (thumbnail) video.thumbnail = thumbnail;

  await video.save();

  return res.status(201).json(
    new ApiResponse(201, video, "Video is updated successfully")
  );
});


const deleteVideo = asyncHandler(async (req, res) => {
       const {videoId} = req.params
           const userId = req.user?._id
      
           const video = await Video.findById(videoId)  
            
          if (!video) {
              throw new ApiError(403, "video not found")
          }
      
          if(video.owner.toString() !== userId.toString()) {
              throw new ApiError(401, "You are not allowed to delete this video")
          }
      
          await video.deleteOne()
      
          return res
          .status(200)
          .json(
              new ApiResponse(200, {}, "Video deleted Successfully")
          )
          
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Toggle publish status
  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      video,
      `Video ${video.isPublished ? "published" : "unpublished"} successfully`
    )
  );
});

export { 
        getAllVideos,
        searchVideos,
        publishAVideo,
        getVideoById,
        updateVideo,
        deleteVideo,
        togglePublishStatus
      };


  