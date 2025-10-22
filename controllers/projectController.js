const Project = require("../models/Project")
const { errorResponse, successResponse, catchAsync } = require("../utils/helpers")
const nodemailer = require("nodemailer")

// Configure email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER , // Your website's email
    pass: process.env.EMAIL_PASS  // Your app password
  }
})

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

  // Send email notification FROM website TO admin
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // From your website email
      to: 'mustardworks25@gmail.com', // To admin
      subject: 'New Project Submission Notification',
      text: `A new project has been submitted on your website.

User Details:
Name: ${user.name}
Email: ${user.email}

Project Details:
Type: ${projectType}
Budget: $${budget}
Timeline: ${timeline} days
Description: ${description}

Submitted at: ${new Date().toLocaleString()}

Please check the admin panel for more details.`
    }

    await transporter.sendMail(mailOptions)
    console.log('Project submission notification sent to admin')
  } catch (emailError) {
    console.error('Failed to send notification email:', emailError)
  }

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

// ... rest of your existing controller methods remain exactly the same
exports.getAllProjects = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, projectType, sortBy = "submittedAt", sortOrder = "desc" } = req.query

  const filter = {}
  if (status) filter.status = status
  if (projectType) filter.projectType = projectType

  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const projects = await Project.find(filter).sort(sort).skip(skip).limit(Number.parseInt(limit)).select("-__v")

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

  const filter = { user: req.user._id }
  if (status) filter.status = status

  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const projects = await Project.find(filter).sort(sort).skip(skip).limit(Number.parseInt(limit)).select("-__v")

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

exports.deleteProject = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const project = await Project.findByIdAndDelete(id)

  if (!project) {
    return next(errorResponse("Project not found", 404))
  }

  successResponse(res, 200, "Project deleted successfully")
})