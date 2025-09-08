import mongoose from "mongoose";
import { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name : {
            type : String,
            required : true
        },
        dscription : {
            type : String,
            required : true
        },
        video : [
            {
            type : Schema.Types.ObjectId,
            ref : "Video"
         }
        ],
        owner : {
            type : Schema.Types.ObjectId,
            ref : "USer"
        }
    },
    {
        timestamps : true
    }
)

export const Playlist = mongoose.model("Playlist", playlistSchema)