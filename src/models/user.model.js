import { Schema } from "mongoose";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
     email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
     fullname : {
        type : String,
        required : true,
        trim : true,
        index : true
    },
    avatar : {
       type : String, // cloundinary url
       required : true
    },
    coverImage : {
        type : String, // cloundinary url
    },
    watchHistory :[
        {
         type : Schema.Types.ObjectId,
         ref : "video"
       }
     ],
     password : {
        type : String,
        requried : [true, "Password is required"]
     },
     refreshToken : {
        type : String,
        
     }
}, {timestamps : true})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); // agar password modified nahi hua to next kardo
    
    this.password = await bcrypt.hash(this.password, 10) // jab user password create ya change karta hai to ye code se pass secure hota hai
    next() 
})


userSchema.methods.isPasswordCorrect = async function(password) {
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken =  function() {
   return   jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
       )
}

userSchema.methods.generateRefreshToken =  function() {
   return   jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
       )
}
export const User = mongoose.model("User", userSchema)