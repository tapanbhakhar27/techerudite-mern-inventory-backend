class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

/**
 * Centralized error handler utility
 * Usage in catch blocks: ErrorHandler.handle(error, 'ServiceName', 'methodName')
 */
class AppErrorHandler {
  /**
   * Main error handling method
   * @param {Error} error - The error object
   * @param {string} serviceName - Name of the service/controller where error occurred
   * @param {string} methodName - Optional method name for logging
   * @returns {Object} - Formatted error response
   */
  static handle(error, serviceName, methodName = "") {
    const context = methodName ? `${serviceName}.${methodName}` : serviceName;

    console.error(`❌ Error in ${context}:`, error.message);
    console.error("Stack:", error.stack);

    // ==================== Custom Errors ====================
    if (error instanceof ErrorHandler) {
      return {
        success: false,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    // ==================== Mongoose Validation Error ====================
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return {
        success: false,
        statusCode: 400,
        message: `Validation Error: ${messages}`,
      };
    }

    // ==================== MongoDB Cast Error (Invalid ObjectId) ====================
    if (error.name === "CastError") {
      return {
        success: false,
        statusCode: 400,
        message: `Invalid ${error.kind} for field '${error.path}': ${error.value}`,
      };
    }

    // ==================== MongoDB Duplicate Key Error (E11000) ====================
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return {
        success: false,
        statusCode: 409,
        message: `Duplicate Entry: ${field} '${value}' already exists`,
      };
    }

    // ==================== Document Not Found Error ====================
    if (error.name === "DocumentNotFoundError") {
      return {
        success: false,
        statusCode: 404,
        message: "Requested document not found",
      };
    }

    // ==================== Mongoose Version Error (Optimistic Concurrency) ====================
    if (error.name === "VersionError") {
      return {
        success: false,
        statusCode: 409,
        message: "Document was modified by another process. Please try again.",
      };
    }

    // ==================== MongoDB Network/Connection Errors ====================
    if (
      error.name === "MongoNetworkError" ||
      error.name === "MongooseServerSelectionError"
    ) {
      console.error("MongoDB Network Error:", error.stack);
      return {
        success: false,
        statusCode: 503,
        message: "Database connection failed. Please try again later.",
      };
    }

    // ==================== MongoDB Timeout Error ====================
    if (error.name === "MongoTimeoutError") {
      console.error("MongoDB Timeout Error:", error.stack);
      return {
        success: false,
        statusCode: 408,
        message: "Database operation timed out. Please try again.",
      };
    }

    // ==================== MongoDB Server Error ====================
    if (error.name === "MongoServerError" || error.name === "MongoError") {
      console.error(`MongoDB Server Error: ${error.message}`, error.stack);
      return {
        success: false,
        statusCode: 500,
        message: "A database error occurred while processing your request",
      };
    }

    // ==================== JSON Parse Errors ====================
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return {
        success: false,
        statusCode: 400,
        message: "Invalid JSON format in request body",
      };
    }

    // ==================== Type Errors ====================
    if (error instanceof TypeError) {
      console.error("Type Error:", error.stack);
      return {
        success: false,
        statusCode: 400,
        message: `Invalid data type: ${error.message}`,
      };
    }

    // ==================== Range Errors ====================
    if (error instanceof RangeError) {
      return {
        success: false,
        statusCode: 400,
        message: `Value out of range: ${error.message}`,
      };
    }

    // ==================== Network Connection Errors ====================
    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      return {
        success: false,
        statusCode: 408,
        message: "Request timeout. Please try again.",
      };
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      console.error("Network Connection Error:", error.stack);
      return {
        success: false,
        statusCode: 503,
        message: "Unable to connect to external service",
      };
    }

    // ==================== File System Errors ====================
    if (error.code === "ENOENT") {
      return {
        success: false,
        statusCode: 404,
        message: "File or directory not found",
      };
    }

    if (error.code === "EACCES" || error.code === "EPERM") {
      console.error("File Permission Error:", error.stack);
      return {
        success: false,
        statusCode: 403,
        message: "Permission denied",
      };
    }

    if (error.code === "ENOSPC") {
      console.error("Disk Space Error:", error.stack);
      return {
        success: false,
        statusCode: 500,
        message: "Insufficient storage space",
      };
    }

    // ==================== Axios/HTTP Errors ====================
    if (error.isAxiosError || error.response) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 400) {
        return {
          success: false,
          statusCode: 400,
          message: `External API error: ${message}`,
        };
      } else if (status === 401) {
        return {
          success: false,
          statusCode: 401,
          message: `External API authentication failed: ${message}`,
        };
      } else if (status === 403) {
        return {
          success: false,
          statusCode: 403,
          message: `External API access denied: ${message}`,
        };
      } else if (status === 404) {
        return {
          success: false,
          statusCode: 404,
          message: `External API resource not found: ${message}`,
        };
      } else if (status === 408 || status === 504) {
        return {
          success: false,
          statusCode: 408,
          message: `External API timeout: ${message}`,
        };
      } else if (status >= 500) {
        return {
          success: false,
          statusCode: 503,
          message: `External API unavailable: ${message}`,
        };
      }
    }

    // ==================== Generic/Unexpected Errors ====================
    console.error(
      `Unexpected error in ${context}:`,
      JSON.stringify(
        {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack,
        },
        null,
        2
      )
    );

    return {
      success: false,
      statusCode: 500,
      message: "An unexpected error occurred while processing your request",
    };
  }

  /**
   * Throw a formatted error with custom message
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  static throw(message, statusCode = 500) {
    throw new ErrorHandler(message, statusCode);
  }

  /**
   * Throw a 400 Bad Request error
   */
  static badRequest(message) {
    throw new ErrorHandler(message, 400);
  }

  /**
   * Throw a 401 Unauthorized error
   */
  static unauthorized(message = "Unauthorized") {
    throw new ErrorHandler(message, 401);
  }

  /**
   * Throw a 403 Forbidden error
   */
  static forbidden(message = "Forbidden") {
    throw new ErrorHandler(message, 403);
  }

  /**
   * Throw a 404 Not Found error
   */
  static notFound(message = "Resource not found") {
    throw new ErrorHandler(message, 404);
  }

  /**
   * Throw a 409 Conflict error
   */
  static conflict(message) {
    throw new ErrorHandler(message, 409);
  }

  /**
   * Throw a 500 Internal Server Error
   */
  static internalError(message = "Internal Server Error") {
    throw new ErrorHandler(message, 500);
  }

  /**
   * Throw a 503 Service Unavailable error
   */
  static serviceUnavailable(message = "Service Unavailable") {
    throw new ErrorHandler(message, 503);
  }
}

module.exports = { AppErrorHandler, ErrorHandler };
