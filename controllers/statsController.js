const Project = require("../models/Project")
const User = require("../models/User")
const { successResponse, catchAsync } = require("../utils/helpers")

// Get dashboard statistics (admin only)
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  // Get project statistics
  const totalProjects = await Project.countDocuments()
  const pendingProjects = await Project.countDocuments({ status: "pending" })
  const approvedProjects = await Project.countDocuments({ status: "approved" })
  const rejectedProjects = await Project.countDocuments({ status: "rejected" })
  const inProgressProjects = await Project.countDocuments({ status: "in-progress" })
  const completedProjects = await Project.countDocuments({ status: "completed" })

  // Get user statistics
  const totalUsers = await User.countDocuments({ role: "user" })
  const totalAdmins = await User.countDocuments({ role: "admin" })

  // Get project type distribution
  const projectTypeStats = await Project.aggregate([
    {
      $group: {
        _id: "$projectType",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ])

  // Get recent projects (last 10)
  const recentProjects = await Project.find()
    .sort({ submittedAt: -1 })
    .limit(10)
    .select("userName email projectType status submittedAt")

  successResponse(res, 200, "Dashboard statistics retrieved successfully", {
    stats: {
      projects: {
        total: totalProjects,
        pending: pendingProjects,
        approved: approvedProjects,
        rejected: rejectedProjects,
        inProgress: inProgressProjects,
        completed: completedProjects,
      },
      users: {
        total: totalUsers,
        admins: totalAdmins,
      },
      projectTypes: projectTypeStats,
      recentProjects,
    },
  })
})
