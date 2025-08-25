class ApiResponse {
  constructor(statusCode, data, message = "Success") { // (1) teen cheezein: code, data, message
    this.statusCode = statusCode;                      // (2) e.g., 200, 201
    this.data = data;                                  // (3) actual payload
    this.message = message;                            // (4) human-readable message
    this.success = statusCode < 400;                   // (5) <400 to success = true
  }
}

export { ApiResponse };
