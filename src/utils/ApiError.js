// ========================================
// API ERROR UTILITY CLASS
// ========================================
// Ye class custom errors handle karne ke liye use hoti hai
// Standardized error responses banane ke liye

class ApiError extends Error {
    constructor(
        statusCode,                                    // HTTP status code (400, 401, 404, 500, etc.)
        message = "Something went wrong",             // Error message
        errors = [],                                  // Additional error details (array)
        stack = ""                                    // Error stack trace
    ){
        // ========== PARENT CLASS INITIALIZATION ==========
        // Error class ko initialize karo
        super(message)
        
        // ========== ERROR PROPERTIES ==========
        this.statusCode = statusCode    // HTTP status code
        this.data = null                // Error data (usually null)
        this.message = message          // Error message
        this.success = false;           // Always false for errors
        this.errors = errors            // Additional error details

        // ========== STACK TRACE HANDLING ==========
        if (stack) {
            // Agar custom stack trace diya hai to use karo
            this.stack = stack
        } else {
            // Nahi to automatic stack trace capture karo
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

// ========================================
// EXPORT CLASS
// ========================================
export {ApiError}