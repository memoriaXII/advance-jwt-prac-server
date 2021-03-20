const express = require("express")

const router = express.Router()
//import controller
const { update } = require("../controllers/user")
const { read } = require("../controllers/auth")
//import validators

const {
  requireSignin,
  adminMiddleware,
  authMiddleware,
} = require("../controllers/auth")

router.get("/user-profile", requireSignin, authMiddleware, read)
router.get("/admin-profile", requireSignin, adminMiddleware, read)

// router.get("/user/:id", requireSignin, read)
// router.put("/user/update", requireSignin, update)
// router.put("/admin/update", requireSignin, adminMiddleware, update)

module.exports = router
