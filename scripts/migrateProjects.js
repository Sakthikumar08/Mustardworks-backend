const mongoose = require("mongoose")
const dotenv = require("dotenv")

// Load env vars
dotenv.config()

// Connect to database
const connectDB = require("../config/database")

// Models
const Project = require("../models/Project")
const User = require("../models/User")

const migrateProjects = async () => {
  try {
    await connectDB()
    console.log("Connected to database")

    // Find all projects that don't have a user field
    const projectsWithoutUser = await Project.find({ user: { $exists: false } })

    console.log(`Found ${projectsWithoutUser.length} projects without user association`)

    if (projectsWithoutUser.length === 0) {
      console.log("No projects need migration")
      process.exit(0)
    }

    // Create a default admin user if none exists
    let adminUser = await User.findOne({ role: "admin" })

    if (!adminUser) {
      console.log("Creating default admin user for migration...")
      adminUser = await User.create({
        firstName: "System",
        lastName: "Admin",
        email: "admin@mustardworks.com",
        password: "admin123",
        role: "admin",
      })
      console.log("Default admin user created")
    }

    // Update projects without user association
    for (const project of projectsWithoutUser) {
      // Try to find user by email first
      let user = await User.findOne({ email: project.email })

      if (!user) {
        // Create user from project data
        const [firstName, ...lastNameParts] = project.name.split(" ")
        const lastName = lastNameParts.join(" ") || "User"

        user = await User.create({
          firstName: firstName || "Unknown",
          lastName: lastName,
          email: project.email,
          password: "tempPassword123", // User will need to reset
          role: "user",
        })
        console.log(`Created user for ${project.email}`)
      }

      // Update project with user association
      await Project.findByIdAndUpdate(project._id, {
        user: user._id,
        userName: user.name,
      })

      console.log(`Updated project ${project._id} with user ${user.email}`)
    }

    console.log("Migration completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

// Run migration
migrateProjects()
