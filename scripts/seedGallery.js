const mongoose = require("mongoose")
const dotenv = require("dotenv")
const Gallery = require("../models/Gallery")
const User = require("../models/User")

// Load env vars
dotenv.config()

// Sample gallery items
const sampleGalleryItems = [
  {
    title: "Smart IoT Home Automation",
    description: "Revolutionary home automation system with AI-powered energy optimization and voice control integration.",
    category: "iot",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop",
  },
  {
    title: "Electric Vehicle Charging Station",
    description: "Next-gen EV charging infrastructure with solar integration and smart grid connectivity.",
    category: "e-vehicles",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&h=600&fit=crop",
  },
  {
    title: "AI-Powered Healthcare Diagnostics",
    description: "Machine learning system for early disease detection using medical imaging and patient data analysis.",
    category: "ai",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
  },
  {
    title: "Arduino-Based Weather Station",
    description: "Custom weather monitoring system with real-time data logging and cloud synchronization.",
    category: "hardware",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
  },
  {
    title: "Cloud-Native Microservices Platform",
    description: "Scalable containerized application platform with automated deployment and monitoring.",
    category: "software",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop",
  },
  {
    title: "FPGA-Based Signal Processor",
    description: "High-performance digital signal processing unit using advanced VLSI design techniques.",
    category: "vlsi",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop",
  },
  {
    title: "Smart Agriculture IoT System",
    description: "Precision farming solution with soil monitoring, automated irrigation, and crop health analysis.",
    category: "iot",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop",
  },
  {
    title: "Autonomous Delivery Robot",
    description: "Self-navigating electric delivery vehicle with obstacle detection and route optimization.",
    category: "e-vehicles",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop",
  },
  {
    title: "Computer Vision Quality Inspection",
    description: "AI-driven automated quality control system for manufacturing with defect detection.",
    category: "ai",
    image: "https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=800&h=600&fit=crop",
  },
  {
    title: "Custom PCB Design for Wearables",
    description: "Miniaturized circuit board design for next-generation health monitoring wearable devices.",
    category: "hardware",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop",
  },
  {
    title: "Real-Time Collaboration Tool",
    description: "WebRTC-based application for seamless team collaboration with video, chat, and screen sharing.",
    category: "software",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
  },
  {
    title: "Low-Power Memory Controller",
    description: "Energy-efficient DDR4 memory controller design optimized for mobile and embedded systems.",
    category: "vlsi",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=600&fit=crop",
  },
]

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ MongoDB connected successfully")
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)
    process.exit(1)
  }
}

// Seed gallery items
const seedGallery = async () => {
  try {
    console.log("\n🌱 Starting gallery seeding...\n")

    // Check if admin user exists
    let adminUser = await User.findOne({ role: "admin" })
    
    if (!adminUser) {
      console.log("⚠️  No admin user found. Creating default admin...")
      adminUser = await User.create({
        firstName: "Admin",
        lastName: "User",
        email: "admin@mustardworks.com",
        password: "Admin@1234",
        role: "admin",
      })
      console.log("✅ Admin user created:", adminUser.email)
    } else {
      console.log("✅ Using existing admin user:", adminUser.email)
    }

    // Clear existing gallery items
    const existingCount = await Gallery.countDocuments()
    if (existingCount > 0) {
      console.log(`\n🗑️  Removing ${existingCount} existing gallery items...`)
      await Gallery.deleteMany({})
      console.log("✅ Existing gallery items cleared")
    }

    // Create gallery items
    console.log(`\n📸 Creating ${sampleGalleryItems.length} gallery items...\n`)
    
    const galleryPromises = sampleGalleryItems.map((item, index) => {
      return Gallery.create({
        ...item,
        createdBy: adminUser._id,
        isActive: true,
      }).then(created => {
        console.log(`  ✓ [${index + 1}/${sampleGalleryItems.length}] ${created.category.toUpperCase()}: ${created.title}`)
        return created
      })
    })

    const createdItems = await Promise.all(galleryPromises)

    // Display summary
    console.log("\n" + "=".repeat(60))
    console.log("🎉 Gallery seeding completed successfully!")
    console.log("=".repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   Total items created: ${createdItems.length}`)
    
    // Count by category
    const categoryCounts = {}
    createdItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    })
    
    console.log(`\n📁 Items by category:`)
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category.toUpperCase()}: ${count} items`)
    })

    console.log("\n✅ You can now view the gallery at: http://localhost:5173/gallery")
    console.log("")

  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the seeder
const run = async () => {
  await connectDB()
  await seedGallery()
  
  console.log("🔌 Closing database connection...")
  await mongoose.connection.close()
  console.log("✅ Database connection closed")
  console.log("\n👋 Done!\n")
  process.exit(0)
}

run()
