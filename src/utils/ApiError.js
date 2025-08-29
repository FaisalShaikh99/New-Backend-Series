// utils (cloudinary.js, ApiError.js, ApiResponse.js) → helper functions, error handling, Cloudinary integration.
class ApiError extends Error {
    constructor(
        statusCode, // eg : 101 to 501
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}