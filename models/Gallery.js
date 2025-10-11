const mongoose = require("mongoose")

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["iot", "e-vehicles", "ai", "hardware", "software", "vlsi"],
    lowercase: true,
  },
  image: {
    type: String,
    required: [true, "Image URL is required"],
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Gallery item must have a creator"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Indexes for better query performance
gallerySchema.index({ category: 1, isActive: 1 })
gallerySchema.index({ createdAt: -1 })
gallerySchema.index({ isActive: 1, createdAt: -1 })

// Update the updatedAt field before saving
gallerySchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// Populate creator info when querying
gallerySchema.pre(/^find/, function (next) {
  this.populate({
    path: "createdBy",
    select: "name email",
  })
  next()
})

module.exports = mongoose.model("Gallery", gallerySchema)
