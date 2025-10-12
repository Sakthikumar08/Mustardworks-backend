const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const dotenv = require("dotenv")

// Load env vars
dotenv.config()

// Connect to database
const connectDB = require("./config/database")
connectDB()

// Route files
const auth = require("./routes/auth")
const projects = require("./routes/projects")
const gallery = require("./routes/gallery")

const app = express()

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
})
app.use("/api/", limiter)

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// Body parser middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Cookie parser middleware
app.use(cookieParser())

// CORS configuration - FIXED
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://www.mustardworks.in",
  "https://mustardworks.in"
]

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200
}

// Apply CORS middleware
app.use(cors(corsOptions))

// Handle preflight requests
app.options("*", cors(corsOptions))

// Mount routers
app.use("/api/auth", auth)
app.use("/api/projects", projects)
app.use("/api/gallery", gallery)

// Basic route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "MustardWorks API is running",
  })
})

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    timestamp: new Date().toISOString()
  })
})

// Handle undefined routes
app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`)
  err.statusCode = 404
  next(err)
})

// Global error handler
const globalErrorHandler = require("./middleware/errorHandler")
app.use(globalErrorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`)
  console.log(`Stack: ${err.stack}`)
  // Close server & exit process
  server.close(() => {
    process.exit(1)
  })
})