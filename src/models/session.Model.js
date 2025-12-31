import mongoose, { Schema } from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId : {
        type : Schema.Types.ObjectId,
        ref : "User"
     }
})

export const Session = mongoose.model("Session", sessionSchema)