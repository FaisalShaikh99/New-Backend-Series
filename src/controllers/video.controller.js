import { Video } from "../models/video.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler( async (req ,res) => {
      const {page=1, limit=10, query, sortBy, sortType, userId} =  req.query

      const match = {}
// jab user froontend search input jo query karega vo database videos me match hogi
      if (query) { 
            match.$or = [
               {title : {$regex : query, $options : "i"}}, // yaha title se match kari hai
               {description : {$regex : query, $options : "i"}} // aur description se match kari hai
            ]
      }

      if (!userId) {
            throw new ApiError(404, "User not found")
      }

      // jab kisi user ki query karta hai to user se match karta hai

      if(userId){
            match.owner = userId // filter by user
      }

      //sorting 

      const sort = {}
      sort[sortBy] = sortType === "desc" ? -1 : 1
      
      const aggregate = Video.aggregate([
           { $match : match},
           { $sort : sort},

      ])
      const options = {
            page : parseInt(page, 10),
            limit : parseInt(limit, 10)
      }

      const videos = await Video.aggregatePaginate(aggregate, options)

      return res.status(200).json(
            new ApiResponse(200, videos, "Got all videos successfully")
      )
})

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
      if (!video) {
        throw new ApiError(404, "Video not found");
      }  
      return res.status(201).json(new ApiResponse(201, video, "Got video successfully"))
})

const updateVideo = asyncHandler( async (req, res) => {
      const {videoId} = req.params
      const userId = req.user?._id

      if (!videoId) {
            throw new ApiError(400, "Video Id is required")
      }

      const video = await Video.findById(videoId)

      if (!video) {
        throw new ApiError(404, "Video not found");
      }  

      if(video.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "You are not allowed to update this video")
      }

      video.video = video
      await video.save()

      return res
      .status(201)
      .json(
            new ApiResponse(201, video, "Video is updated successfullly")
      )

})

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
         publishAVideo,
         getVideoById,
         updateVideo,
         deleteVideo,
         togglePublishStatus
      };


  