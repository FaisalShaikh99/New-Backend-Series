// ========================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ========================================
// Ye middleware backend ke sabhi errors ko catch karega
// Aur user ko JSON format mein proper response bhejega

import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    // ========== ERROR OBJECT HANDLING ==========
    // Agar error ApiError class ka instance hai
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            statusCode: err.statusCode
        });
    }

    // ========== GENERIC ERROR HANDLING ==========
    // Kisi aur type ki error ho
    console.error("Unexpected error:", err);
    
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: [],
        statusCode: 500
    });
};

export { errorHandler };
