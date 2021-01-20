const express = require("express")
const router = express.Router()
//import controller
const {
  signup,
  signin,
  accountActivation,
  refreshToken,
  resetPassword,
  forgotPassword,
  googleLogin,
  facebookLogin,
  linkedinLogin,
} = require("../controllers/auth")

//import validators
const {
  userSigninValidator,
  userSignupValidator,
  resetPasswordValidator,
  forgotPasswordValidator,
} = require("../validators/auth")
const { runValidation } = require("../validators")

router.post("/signup", userSignupValidator, runValidation, signup)
router.post("/account-activation", accountActivation)
router.post("/signin", userSigninValidator, runValidation, signin)
router.post("/refresh-token", refreshToken)
//forogot reset password
router.put(
  "/forgot-password",
  forgotPasswordValidator,
  runValidation,
  forgotPassword
)
router.put(
  "/reset-password",
  resetPasswordValidator,
  runValidation,
  resetPassword
)

//google and facebook
router.post("/google-login", googleLogin)
router.post("/facebook-login", facebookLogin)
router.get("/linkedin-login", linkedinLogin)

module.exports = router
