const express = require("express")
const { mongoose } = require("mongoose")
const router = express.Router()
const { uploadPhoto, readPhoto } = require("../controllers/photo")
// const { adminMiddleware, requireSignin } = require("../controllers/auth")

// router.post("/blog", requireSignin, adminMiddleware, create)
// router.get("/blogs", list)
// router.post("/blogs-categories-tags", listAllBlogsCategoriesTags)
// router.get("/blog/photo/:slug", photo)
router.post("/upload/blog/photo", uploadPhoto)
router.get("/upload/blog/photo/:id", readPhoto)
// router.get("/blog/:slug", read)
// router.delete("/blog/:slug", requireSignin, adminMiddleware, remove)
// router.put("/blog/:slug", requireSignin, adminMiddleware, update)

module.exports = router
