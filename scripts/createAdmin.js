const mongoose = require("mongoose")
const User = require("../models/User")
require("dotenv").config()

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...")
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB successfully")

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "kaviarasu@gmail.com" })

    if (existingAdmin) {
      console.log("Admin user already exists, updating...")
      existingAdmin.password = "kavi@123mustard"
      existingAdmin.role = "admin"
      existingAdmin.firstName = "Kaviarasu"
      existingAdmin.lastName = "Admin"
      await existingAdmin.save()
      console.log("Admin user updated successfully")
      console.log("Admin details:", {
        email: existingAdmin.email,
        role: existingAdmin.role,
        name: existingAdmin.name,
      })
    } else {
      // Create new admin user
      console.log("Creating new admin user...")
      const adminUser = await User.create({
        firstName: "Kaviarasu",
        lastName: "Admin",
        email: "kaviarasu@gmail.com",
        password: "kavi@123mustard",
        role: "admin",
      })

      console.log("Admin user created successfully")
      console.log("Admin details:", {
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
      })
    }

    const verifyAdmin = await User.findOne({ email: "Kaviarasu@gmail.com" }).select("+password")
    console.log("Verification - Admin user exists:", !!verifyAdmin)
    console.log("Verification - Admin role:", verifyAdmin?.role)
    console.log("Verification - Password hash exists:", !!verifyAdmin?.password)

    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
    process.exit(0)
  } catch (error) {
    console.error("Error creating admin user:", error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

createAdminUser()
