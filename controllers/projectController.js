const Project = require("../models/Project")
const { errorResponse, successResponse, catchAsync } = require("../utils/helpers")

// Create a new project submission (requires authentication)
exports.createProject = catchAsync(async (req, res, next) => {
  const { projectType, budget, timeline, description } = req.body

  const user = req.user

  // Create new project with user association
  const project = new Project({
    user: user._id,
    name: user.name,
    email: user.email,
    userName: user.name,
    projectType,
    budget,
    timeline,
    description,
  })

  await project.save()

  successResponse(res, 201, "Project submitted successfully", {
    project: {
      id: project._id,
      userName: project.userName,
      email: project.email,
      projectType: project.projectType,
      budget: project.budget,
      timeline: project.timeline,
      description: project.description,
      status: project.status,
      submittedAt: project.submittedAt,
    },
  })
})

// Get all project submissions (admin only)
exports.getAllProjects = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, projectType, sortBy = "submittedAt", sortOrder = "desc" } = req.query

  // Build filter object
  const filter = {}
  if (status) filter.status = status
  if (projectType) filter.projectType = projectType

  // Build sort object
  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  // Calculate pagination
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const projects = await Project.find(filter).sort(sort).skip(skip).limit(Number.parseInt(limit)).select("-__v")

  // Get total count for pagination
  const totalProjects = await Project.countDocuments(filter)
  const totalPages = Math.ceil(totalProjects / Number.parseInt(limit))

  successResponse(res, 200, "Projects retrieved successfully", {
    projects,
    pagination: {
      currentPage: Number.parseInt(page),
      totalPages,
      totalProjects,
      hasNextPage: Number.parseInt(page) < totalPages,
      hasPrevPage: Number.parseInt(page) > 1,
    },
  })
})

exports.getMyProjects = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, sortBy = "submittedAt", sortOrder = "desc" } = req.query

  // Build filter object for current user's projects
  const filter = { user: req.user._id }
  if (status) filter.status = status

  // Build sort object
  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  // Calculate pagination
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  // Get user's projects with pagination
  const projects = await Project.find(filter).sort(sort).skip(skip).limit(Number.parseInt(limit)).select("-__v")

  // Get total count for pagination
  const totalProjects = await Project.countDocuments(filter)
  const totalPages = Math.ceil(totalProjects / Number.parseInt(limit))

  successResponse(res, 200, "Your projects retrieved successfully", {
    projects,
    pagination: {
      currentPage: Number.parseInt(page),
      totalPages,
      totalProjects,
      hasNextPage: Number.parseInt(page) < totalPages,
      hasPrevPage: Number.parseInt(page) > 1,
    },
  })
})

// Get a single project by ID
exports.getProjectById = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const project = await Project.findById(id).select("-__v")

  if (!project) {
    return next(errorResponse("Project not found", 404))
  }

  if (req.user.role !== "admin" && project.user._id.toString() !== req.user._id.toString()) {
    return next(errorResponse("You don't have permission to access this project", 403))
  }

  successResponse(res, 200, "Project retrieved successfully", { project })
})

// Update project status (admin only)
exports.updateProjectStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ["pending", "in-review", "approved", "rejected", "in-progress", "completed"]

  if (!validStatuses.includes(status)) {
    return next(errorResponse("Invalid status value", 400))
  }

  const project = await Project.findByIdAndUpdate(
    id,
    { status, updatedAt: Date.now() },
    { new: true, runValidators: true },
  ).select("-__v")

  if (!project) {
    return next(errorResponse("Project not found", 404))
  }

  successResponse(res, 200, "Project status updated successfully", { project })
})

// Delete a project (admin only)
exports.deleteProject = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const project = await Project.findByIdAndDelete(id)

  if (!project) {
    return next(errorResponse("Project not found", 404))
  }

  successResponse(res, 200, "Project deleted successfully")
})
