const Gallery = require("../models/Gallery")
const { errorResponse, successResponse, catchAsync } = require("../utils/helpers")

// Get all active gallery items (public access)
exports.getAllGalleryItems = catchAsync(async (req, res, next) => {
  const { category, page = 1, limit = 12, sortBy = "createdAt", sortOrder = "desc" } = req.query

  // Build filter object - only show active items for public access
  const filter = { isActive: true }
  if (category && category !== "all") {
    filter.category = category.toLowerCase()
  }

  // Build sort object
  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  // Calculate pagination
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const galleryItems = await Gallery.find(filter).sort(sort).skip(skip).limit(Number.parseInt(limit)).select("-__v")

  // Get total count for pagination
  const totalItems = await Gallery.countDocuments(filter)
  const totalPages = Math.ceil(totalItems / Number.parseInt(limit))

  successResponse(res, 200, "Gallery items retrieved successfully", {
    galleryItems,
    pagination: {
      currentPage: Number.parseInt(page),
      totalPages,
      totalItems,
      hasNextPage: Number.parseInt(page) < totalPages,
      hasPrevPage: Number.parseInt(page) > 1,
    },
  })
})

// Get all gallery items for admin (includes inactive items)
exports.getAllGalleryItemsAdmin = catchAsync(async (req, res, next) => {
  const { category, isActive, page = 1, limit = 12, sortBy = "createdAt", sortOrder = "desc" } = req.query

  // Build filter object
  const filter = {}
  if (category && category !== "all") {
    filter.category = category.toLowerCase()
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === "true"
  }

  // Build sort object
  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  // Calculate pagination
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const galleryItems = await Gallery.find(filter).sort(sort).skip(skip).limit(Number.parseInt(limit)).select("-__v")

  // Get total count for pagination
  const totalItems = await Gallery.countDocuments(filter)
  const totalPages = Math.ceil(totalItems / Number.parseInt(limit))

  successResponse(res, 200, "Gallery items retrieved successfully", {
    galleryItems,
    pagination: {
      currentPage: Number.parseInt(page),
      totalPages,
      totalItems,
      hasNextPage: Number.parseInt(page) < totalPages,
      hasPrevPage: Number.parseInt(page) > 1,
    },
  })
})

// Create a new gallery item (admin only)
exports.createGalleryItem = catchAsync(async (req, res, next) => {
  const { title, description, category, image } = req.body

  const galleryItem = new Gallery({
    title,
    description,
    category: category.toLowerCase(),
    image,
    createdBy: req.user._id,
  })

  await galleryItem.save()

  successResponse(res, 201, "Gallery item created successfully", {
    galleryItem: {
      id: galleryItem._id,
      title: galleryItem.title,
      description: galleryItem.description,
      category: galleryItem.category,
      image: galleryItem.image,
      isActive: galleryItem.isActive,
      createdAt: galleryItem.createdAt,
    },
  })
})

// Get a single gallery item by ID
exports.getGalleryItemById = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const galleryItem = await Gallery.findById(id).select("-__v")

  if (!galleryItem) {
    return next(errorResponse("Gallery item not found", 404))
  }

  // For public access, only show active items
  if (!req.user && !galleryItem.isActive) {
    return next(errorResponse("Gallery item not found", 404))
  }

  successResponse(res, 200, "Gallery item retrieved successfully", { galleryItem })
})

// Update a gallery item (admin only)
exports.updateGalleryItem = catchAsync(async (req, res, next) => {
  const { id } = req.params
  const { title, description, category, image, isActive } = req.body

  const updateData = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (category !== undefined) updateData.category = category.toLowerCase()
  if (image !== undefined) updateData.image = image
  if (isActive !== undefined) updateData.isActive = isActive
  updateData.updatedAt = Date.now()

  const galleryItem = await Gallery.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-__v")

  if (!galleryItem) {
    return next(errorResponse("Gallery item not found", 404))
  }

  successResponse(res, 200, "Gallery item updated successfully", { galleryItem })
})

// Delete a gallery item (admin only)
exports.deleteGalleryItem = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const galleryItem = await Gallery.findByIdAndDelete(id)

  if (!galleryItem) {
    return next(errorResponse("Gallery item not found", 404))
  }

  successResponse(res, 200, "Gallery item deleted successfully")
})

// Get gallery categories with counts
exports.getGalleryCategories = catchAsync(async (req, res, next) => {
  const categories = await Gallery.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])

  const totalCount = await Gallery.countDocuments({ isActive: true })

  const categoriesWithAll = [
    { id: "all", name: "All Projects", count: totalCount },
    ...categories.map((cat) => ({
      id: cat._id,
      name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
      count: cat.count,
    })),
  ]

  successResponse(res, 200, "Gallery categories retrieved successfully", {
    categories: categoriesWithAll,
  })
})
