const express = require("express")
const {
  createProject,
  getAllProjects,
  getMyProjects,
  getProjectById,
  updateProjectStatus,
  deleteProject,
} = require("../controllers/projectController")
const { validateProject, validateProjectStatus } = require("../middleware/validation")
const { protect, restrictTo } = require("../middleware/auth")

const router = express.Router()

router.use(protect) // All routes require authentication

// User routes (authenticated users)
router.get("/my-projects", getMyProjects) // Get current user's projects
router.post("/submit", validateProject, createProject) // Submit new project
router.get("/:id", getProjectById) // Get specific project (own or admin)

// Admin only routes
router.get("/", restrictTo("admin"), getAllProjects) // Get all projects (admin only)
router.patch("/:id/status", restrictTo("admin"), validateProjectStatus, updateProjectStatus)
router.delete("/:id", restrictTo("admin"), deleteProject)

module.exports = router
