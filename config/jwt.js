const jwt = require("jsonwebtoken")

// Add validation for JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

// Validate that JWT_SECRET exists
if (!JWT_SECRET) {
  console.error("❌ [JWT] CRITICAL: JWT_SECRET environment variable is not set!")
  console.error("❌ [JWT] Current NODE_ENV:", process.env.NODE_ENV)
  
  // In production, we should throw an error
  if (process.env.NODE_ENV === 'production') {
    throw new Error("JWT_SECRET environment variable is required in production")
  }
}

console.log(`✅ [JWT] Config loaded - Environment: ${process.env.NODE_ENV}, Secret exists: ${!!JWT_SECRET}`)

const generateToken = (id) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured")
  }
  
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured")
  }
  
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error("[JWT] Token verification failed:", error.message)
    throw error // Re-throw to let the caller handle it
  }
}

module.exports = {
  generateToken,
  verifyToken,
}