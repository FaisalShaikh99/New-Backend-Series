import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from 'mongoose';
import { Subscription } from '../models/subscription.model.js';

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!channelId) {
    throw new ApiError(404, "Channel id is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel id is not valid");
  }

  const existingSub = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });

  let action = "subscribed";

  if (existingSub) {
    await Subscription.deleteOne({ _id: existingSub._id });
    action = "unsubscribed";
  } else {
    await Subscription.create({
      channel: channelId,
      subscriber: userId,
    });
  }

  const subscribersCount = await Subscription.countDocuments({ channel: channelId });

  return res.status(200).json(
    new ApiResponse(200, { channelId, subscribersCount, action },
      `Channel ${action} successfully`
    )
  );
});


// controller to return subscriber list of a channel(vo user get karo jisne channle ko subscribe kiya hai)
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(404, "Channel id is required");
    }

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel id is not valid");
    }

    const userChannelSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",            // subscriber details lane ke liye
                localField: "subscriber", 
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $project: {
                _id: 0,
                subscriber: 1,
                subscriberDetails: {
                    fullName: 1,
                    email: 1,
                    avatar: 1
                }
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, userChannelSubscribers, "Got subscribers of channel successfully")
        );
});

// ✅ Get channels a user has subscribed to
 const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, "Subscriber ID is required");
  }

  if (!mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  const subcribedChannels = await Subscription.aggregate([
    { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    { $unwind: "$channelDetails" },
    {
      $project: {
        _id: 1,
        "channelDetails._id": 1,
        "channelDetails.fullName": 1,
        "channelDetails.username": 1,
        "channelDetails.avatar": 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subcribedChannels, "Fetched subscribed channels successfully"));
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}