import mongoose from "mongoose";
import { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
    content : {
        type : String,
        requried : true
    },
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    owenr : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
  },
  {
    timestamps : true
  }
)

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)