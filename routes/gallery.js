const express = require("express")
const {
  getAllGalleryItems,
  getAllGalleryItemsAdmin,
  createGalleryItem,
  getGalleryItemById,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryCategories,
} = require("../controllers/galleryController")

const { protect, adminOnly } = require("../middleware/auth")
const { validateGalleryItem, validateGalleryUpdate } = require("../middleware/validation")

const router = express.Router()

// Public routes (no authentication required)
router.get("/", getAllGalleryItems)
router.get("/categories", getGalleryCategories)
router.get("/:id", getGalleryItemById)

// Admin routes (authentication + admin role required)
router.use(protect) // All routes after this middleware require authentication

router.get("/admin/all", adminOnly, getAllGalleryItemsAdmin)
router.post("/", adminOnly, validateGalleryItem, createGalleryItem)
router.patch("/:id", adminOnly, validateGalleryUpdate, updateGalleryItem)
router.delete("/:id", adminOnly, deleteGalleryItem)

module.exports = router