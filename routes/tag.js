const express = require("express")
const router = express.Router()

const { list, create, remove, read } = require("../controllers/tag")
const { runValidation } = require("../validators")
const { requireSignin, adminMiddleware } = require("../controllers/auth")
const { tagCreateValidator } = require("../validators/tag")

router.post(
  "/tag",
  tagCreateValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  create
)
router.get("/tags", list)
router.get("/tag/:slug", read)
router.delete("/tag/:slug", requireSignin, adminMiddleware, remove)

module.exports = router
