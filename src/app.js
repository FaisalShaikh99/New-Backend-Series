// ========================================
// EXPRESS APP CONFIGURATION
// ========================================
// Ye file Express server ka main configuration handle karti hai
// Middlewares, routes, aur CORS setup yahan hota hai

// ========== CORE IMPORTS ==========
import express from "express"        // Express framework
import cors from "cors"              // Cross-Origin Resource Sharing
import cookieParser from "cookie-parser"  // Cookie parsing middleware

// ========== EXPRESS APP INITIALIZATION ==========
// Express ka main object create karo
const app = express(); 

// ========================================
// CORS CONFIGURATION
// ========================================
// Frontend aur backend alag ports pe chalte hain
// CORS allow karta hai ki frontend backend se data access kar sake
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Sirf specific origin allow karo
    credentials: true                // Cookies share karne ke liye true
}))

// ========================================
// SECURITY HEADERS FOR GOOGLE OAUTH
// ========================================
// Google OAuth ke liye COOP header set karo
app.use((req, res, next) => {
    // COOP: Google login ke liye postMessage ko allow karta hai.
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none'); 
    
    // COEP: Ise hata do jab tak aapko Cross-Origin Isolation ki specifically zarurat na ho.
    // res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); // Hata diya gaya
    next();
})

// ========================================
// MIDDLEWARES CONFIGURATION
// ========================================

// ========== JSON PARSING MIDDLEWARE ==========
// Request body mein JSON data parse karne ke liye
app.use(express.json({ 
    limit: "16kb"  // Maximum 16KB JSON data allow karo
}))

// ========== URL-ENCODED PARSING MIDDLEWARE ==========
// Form submissions aur URL-encoded data parse karne ke liye
app.use(express.urlencoded({ 
    extended: true,  // Nested objects ko parse karne dega
    limit: "16kb"    // Maximum 16KB data allow karo
}))

// ========== STATIC FILES MIDDLEWARE ==========
// Public folder se static files serve karne ke liye
// Images, CSS, JS files jo "public" folder mein hain
app.use(express.static("public"))

// ========== COOKIE PARSING MIDDLEWARE ==========
// Request cookies ko parse karne ke liye
// Ab hum req.cookies se cookies access kar sakte hain
app.use(cookieParser())

// ========================================
// ROUTE IMPORTS
// ========================================
// Sabhi route files import karo

// ========== USER ROUTES ==========
// User related operations (register, login, profile, etc.)
import userRouter from './routes/user.route.js'

// ========== CONTENT ROUTES ==========
// Video, comments, likes, tweets related operations
import commentRouter from './routes/comment.route.js'
import likeRouter from './routes/likes.route.js'
import tweetRouter from './routes/tweet.route.js'
import videoRouter from "./routes/video.route.js"

// ========== PLAYLIST ROUTES ==========
// Playlist management
import playlistRouter from './routes/playlist.route.js'

// ========== SUBSCRIPTION ROUTES ==========
// Channel subscription management
import subscriptionRouter from './routes/subscription.route.js'

// ========== DASHBOARD ROUTES ==========
// Analytics aur dashboard data
import dashboardRouter from "./routes/dashboard.route.js"

// ========== HEALTH CHECK ROUTES ==========
// Server health monitoring
import healthCheckRouter from "./routes/healthCheck.route.js"


app.use("/api/v1/users", userRouter)

// ========== VIDEO ROUTES ==========
// Video upload, fetch, update operations
app.use("/api/v1/video", videoRouter)

// ========== COMMENT ROUTES ==========
// Video comments management
app.use("/api/v1/comments", commentRouter)

// ========== LIKE ROUTES ==========
// Video likes/dislikes management
app.use("/api/v1/likes", likeRouter)

// ========== TWEET ROUTES ==========
// Tweet management (if implemented)
app.use("/api/v1/tweets", tweetRouter)

// ========== PLAYLIST ROUTES ==========
// User playlists management
app.use("/api/v1/playlist", playlistRouter)

// ========== SUBSCRIPTION ROUTES ==========
// Channel subscription management
app.use("/api/v1/subscription", subscriptionRouter)

// ========== DASHBOARD ROUTES ==========
// Analytics aur dashboard data
app.use("/api/v1/dashboard", dashboardRouter)

// ========== HEALTH CHECK ROUTES ==========
// Server health monitoring
app.use("/api/v1/healthCheck", healthCheckRouter)

// ========================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ========================================
// Ye middleware sabhi errors ko catch karega
// IMPORTANT: Isko sabse aakhir mein add karna hai!
import { errorHandler } from './middlewares/error.middleware.js'
app.use(errorHandler)

// ========================================
// EXPORT APP
// ========================================
// App object ko export karo taki index.js mein use kar sakein
export { app }