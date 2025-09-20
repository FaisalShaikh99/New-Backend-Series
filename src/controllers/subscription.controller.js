import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from 'mongoose';
import { Subscription } from '../models/subscription.model.js';

const toggleSubscription =  asyncHandler( async (req, res) => {
      const {channelId} = req.params
      const userId = req.user?._id

      if (!isValidObjectId(channelId)) {
          throw new ApiError(400, "Channel id is not valid")
      }
      if (!channelId) {
         throw new ApiError(404, "Channel id is required")
      }

      const existSubscribed = await Subscription.findOne(
        {
            subscriber : userId,
            channel : channelId
        }
      )

      if (existSubscribed) {
        /*ye mongoose ko bol raha hai ki Subscription collection me 
          vo document delete kardo jiske id existSubscribed._id ho */
         await Subscription.deleteOne({_id : existSubscribed._id}) 
         return res.status(200).json(
            new ApiResponse(200, null, "Channel unSubscribed successfully ")
           )
      }

      const newSubscribe = await Subscription.create({
          subscriber : userId,
          channel : channelId
      })
    
      return res
      .status(201)
      .json(
        new ApiResponse(201, newSubscribe, "Channel Subscribed successfully ")
      )

})

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

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params 
    
    if (!subscriberId) {
        throw new ApiError(404, "Subscriber id is required");
    }

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Subscriber id is not valid");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",            // subscriber details lane ke liye
                localField: "channel", 
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $project: {
                _id: 0,
                channel: 1,
                channelDetails: {
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
            new ApiResponse(200, subscribedChannels, "Got subscribed channels successfully")
        );

})
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}