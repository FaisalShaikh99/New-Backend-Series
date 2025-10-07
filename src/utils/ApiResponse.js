// ========================================
// API RESPONSE UTILITY CLASS
// ========================================
// Ye class standardized API responses banane ke liye use hoti hai
// Har response mein consistent format maintain karne ke liye

class ApiResponse {
  constructor(statusCode, data, message = "Success") { 
    // ========== CONSTRUCTOR PARAMETERS ==========
    // statusCode: HTTP status code (200, 201, 400, etc.)
    // data: Actual response data (object, array, etc.)
    // message: Human-readable success/error message
    
    this.statusCode = statusCode;    // HTTP status code store karo
    this.data = data;                // Response data store karo
    this.message = message;          // Success/error message store karo
    this.success = statusCode < 400; // 400 se kam = success, 400+ = error
  }
}

// ========================================
// EXPORT CLASS
// ========================================
export { ApiResponse };