import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


// Database is another continate

const connectDB = async () => {
    try {
      const connectionInstance =   await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`) // databse connecting
      console.log(`\n Mongo db connected !! DB Host : ${connectionInstance.connection.host}`)
      

    } catch (error) { // error handling
        console.error("MONGODB connection failed : ", error);
        process.exit(1) 
    }
}  

export default connectDB