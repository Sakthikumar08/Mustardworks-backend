const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Project must belong to a user"],
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
  },
  userName: {
    type: String,
    required: [true, "User name is required"],
    trim: true,
  },
  projectType: {
    type: String,
    required: [true, "Project type is required"],
    enum: ["hardware", "embedded", "iot", "ev", "ai", "vlsi", "app", "web", "laptop", "other"],
  },
  budget: {
    type: String,
    enum: ["<1000", "1000-5000", "5000-10000", "10000-25000", ">25000", ""],
  },
  timeline: {
    type: String,
    enum: ["<1month", "1-3months", "3-6months", "6-12months", ">12months", ""],
  },
  description: {
    type: String,
    required: [true, "Project description is required"],
    trim: true,
    maxlength: [2000, "Description cannot exceed 2000 characters"],
  },
  status: {
    type: String,
    enum: ["pending", "in-review", "approved", "rejected", "in-progress", "completed"],
    default: "pending",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

projectSchema.index({ user: 1, submittedAt: -1 })
projectSchema.index({ status: 1, submittedAt: -1 })

// Update the updatedAt field before saving
projectSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

projectSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name email",
  })
  next()
})

module.exports = mongoose.model("Project", projectSchema)
