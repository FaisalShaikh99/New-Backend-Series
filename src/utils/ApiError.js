class ApiError extends Error {                       // (1) Error class ko extend kar rahe hain
  constructor(
    statusCode,                                      // (2) e.g., 400, 404, 500
    message = "Something went wrong",                // (3) default message
    errors = [],                                     // (4) extra details (validation errors etc.)
    stack = ""                                       // (5) optional custom stack (useful in tests)
  ) {
    super(message);                                  // (6) parent Error ka constructor (sets this.message)
    this.name = "ApiError";                          // (7) error ka naam identify karne ke liye
    this.statusCode = statusCode;                    // (8) HTTP status code
    this.data = null;                                // (9) success case me data hota hai; error me null
    this.success = false;                            // (10) error hone par hamesha false
    this.errors = errors;                            // (11) array/object of field errors, etc.

    if (stack) {                                     // (12) agar custom stack diya hai to use hi lagao
      this.stack = stack;
    } else {
      // (13) V8 feature: stack trace cleanly capture hoti hai (line/file dikhata hai)
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
