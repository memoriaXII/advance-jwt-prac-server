const express = require("express")
const { mongoose } = require("mongoose")
const router = express.Router()
const {
  create,
  list,
  read,
  update,
  remove,
  listAllBlogsCategoriesTags,
  photo,
} = require("../controllers/blog")
const { adminMiddleware, requireSignin } = require("../controllers/auth")

router.post("/blog", requireSignin, adminMiddleware, create)
router.get("/blogs", list)
router.post("/blogs-categories-tags", listAllBlogsCategoriesTags)
router.get("/blog/photo/:slug", photo)
// router.post("/upload/blog/photo", uploadPhoto)
router.get("/blog/:slug", read)
// router.delete("/blog/:slug", requireSignin, adminMiddleware, remove)
// router.put("/blog/:slug", requireSignin, adminMiddleware, update)

module.exports = router
