
// express import kiya (server banane ke liye use hota hai)
import express from "express"

// → frontend aur backend alag domain/port par ho to bhi request allow karne ke liye
import cors from "cors" 

// → cookies ko easily access karne ke liye (login/auth ke time JWT token ya session store karne ke liye use hota hai)
import cookieParser from "cookie-parser"  

// express ka object banaya (ye app pura server represent karega)
const app = express(); 

// --------------------------- CORS CONFIG ---------------------------
// frontend (React, Angular, Vue) alag port/domain pe chalega aur backend alag port pe 
// uske liye backend ko explicitly allow karna padta hai
app.use(cors({
    origin: process.env.CORS_ORIGIN, // only yahi origin allowed hoga ("http://localhost:8000")
    credentials: true                // frontend ke saath cookies share karne ke liye true
}))

// --------------------------- MIDDLEWARES ---------------------------

// JSON body parse karne ke liye (limit = 16kb set kiya)
app.use(express.json({ limit: "16kb" }))

// URL-encoded data parse karne ke liye (form submissions, etc.)
// extended: true → nested objects ko parse karne dega
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// static files serve karne ke liye (e.g. images, css, js jo "public" folder me hai)
app.use(express.static("public"))

// cookie-parser ko use kiya → ab hum req.cookies se cookies access kar sakte hain
app.use(cookieParser())


// user related routes import kiya (login, signup, profile wagaira isi me honge)
import userRouter from './routes/user.route.js'

// jab bhi request "/api/v1/users" se start hogi, wo userRouter ke andar jayegi
// example: POST /api/v1/users/register → user.route.js me handle hoga
app.use("/api/v1/users", userRouter)

// app ko export kiya taki index.js (ya server.js) file me use kar sakein
export { app }
