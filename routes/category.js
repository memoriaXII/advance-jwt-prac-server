const express = require("express")

const router = express.Router()
//import controller
const { create, list, read, remove } = require("../controllers/category")

//import validators
const { runValidation } = require("../validators")
const { categoryCreateValidator } = require("../validators/category")
const { requireSignin, adminMiddleware } = require("../controllers/auth")

router.post(
  "/category",
  categoryCreateValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  create
)
router.get("/categories", list)
router.get("/category/:slug", read)
router.delete("/category/:slug", remove)

module.exports = router
