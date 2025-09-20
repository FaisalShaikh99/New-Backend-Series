import mongoose from "mongoose";
import { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId, // ye vo user hai jo subscriber karta hai
        ref : "User"
    },
    channel : {
        type : Schema.Types.ObjectId, // ye vo user hai jise subscribe kiya ja raha hai
        ref : "User"
    }
}, {timestamps : true})

export const Subscription = new mongoose.model("Subscription", subscriptionSchema);