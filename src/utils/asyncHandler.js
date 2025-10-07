// ========================================
// ASYNC HANDLER WRAPPER
// ========================================
// Ye wrapper function async operations ke liye error handling provide karta hai
// Try-catch blocks avoid karne ke liye use hota hai

// ========== PROMISE-BASED APPROACH ==========
// Higher-order function jo async handler ko wrap karta hai
const asyncHandler = (handler) => {                    
    // ========== WRAPPER FUNCTION ==========
    // Express middleware function return karo
    return (req, res, next) => {                         
        // ========== PROMISE RESOLUTION ==========
        // Handler function ko Promise mein wrap karo
        Promise
            .resolve(handler(req, res, next))                
            // ========== ERROR CATCHING ==========
            // Agar error aaye to Express error middleware ko pass kar do
            .catch((err) => next(err));                      
    };
};

// ========================================
// EXPORT FUNCTION
// ========================================
export {asyncHandler}

// ========================================
// ALTERNATIVE TRY-CATCH APPROACH (COMMENTED)
// ========================================
// Ye approach bhi use kar sakte hain, lekin Promise approach zyada clean hai
/*
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        // ========== ASYNC FUNCTION EXECUTION ==========
        await fn(req, res, next)
    } catch (error) {
        // ========== ERROR RESPONSE ==========
        res.status(error.code || 500).json({
            success : false,
            message : error.message
        })  
    }
}
*/