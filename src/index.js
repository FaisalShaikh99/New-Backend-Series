
//  ES Module (import/export) use kar rahe ho isliye 'dotenv' import kar rahe ho
import dotenv from 'dotenv'

// DB connection function 
import connectDB from "./db/db.js";

import { app } from './app.js';

// --------------------------- ENV CONFIG ---------------------------
// dotenv.config() ka kaam hai .env file ke variables ko process.env me load karna
dotenv.config({
    path: './.env'   // explicitly path diya, warna by default root folder se .env uthata hai
})

// --------------------------- CONNECT DB + START SERVER ---------------------------
// pehle database se connect karenge
connectDB()
.then(() => {
                                                          
    // express app ko listen karaya (server start kar diya)
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`) 
    })

    // agar app me koi error aata hai (like server crash, port busy, etc.)
    app.on("error", (error) => {
        console.error("ERR: ", error)
        throw error
    })

})
.catch((error) => {
    // agar DB connection fail ho jaye to ye chalega
    console.log("Mongo db connection failed !!!", error);  
})


// --------------------------- OLD FIRST APPROACH (commented) ---------------------------
/*
import express from 'express'
const app = express()

( async () => {
    try {
       // directly mongoose connect karwaya
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

       app.on("error", (error) => {
        console.error("ERR: ", error)
        throw error
       })

       app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`);
       })

    } catch (error) {
        console.log("Error : ", error);
        throw error
    }
})()
*/
