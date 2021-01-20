require("dotenv").config()
const _ = require("lodash")
const User = require("../models/user")
const jwt = require("jsonwebtoken")
const expressJwt = require("express-jwt")
const createError = require("http-errors")
const { OAuth2Client } = require("google-auth-library")
//sendgrid
const sgMail = require("@sendgrid/mail")
const fetch = require("node-fetch")
const axios = require("axios")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const { sendEmailWithNodemailer } = require("../helpers/email")

exports.signup = (req, res) => {
  const { name, email, password } = req.body
  User.findOne({ email }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Email is taken",
      })
    }
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    )
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Account activation link`,
      html: `<h1>Please use the following link to activate your account</h1>
            <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>${process.env.CLIENT_URL}</p>`,
    }

    // sgMail.send(emailData).then((sent) => {
    //   console.log("SIGNUP EMAIL SENT", sent)
    //   return res.json({
    //     message: `Email has been sent to ${email}. Follow the instruction`,
    //   })
    // })
    sendEmailWithNodemailer(req, res, emailData, email)
  })
}

exports.accountActivation = (req, res) => {
  const { token } = req.body
  if (token) {
    jwt.verify(
      token,
      process.env.JWT_ACCOUNT_ACTIVATION,
      function (err, decoded) {
        if (err) {
          console.log("JWT VERIFY IN ACCOUNT ACTIVATION ERROR", err)
          return res.status(401).json({
            error: "Expired link Signup again",
          })
        }
        const { name, email, password } = jwt.decode(token)
        const user = new User({ name, email, password })
        user.save((err, user) => {
          if (err) {
            console.log("SAVE USER IN ACCOUNT ACTIVATION ERROR", err)
            return res.status(401).json({
              error: "Error saving user in database. Try signup again",
            })
          }
          return res.status(200).json({
            message: "Signup success. Please signin",
          })
        })
      }
    )
  } else {
    return res.status(403).json({
      message: "Something went wrong. Try again",
    })
  }
}

exports.signin = (req, res) => {
  const { email, password } = req.body
  //check if user exist
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist. Please signup",
      })
    }
    //authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Email and password do not match",
      })
    }
    //generate a token and send to client
    const authToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })
    const refreshToken = signRefresToken(user._id)
    const { _id, name, email, role } = user

    return res.json({
      authToken,
      refreshToken,
      user: { _id, name, email, role },
    })
  })
  //exec is provide by mongoose
}

exports.verifyToken = (req, res, next) => {
  if (!req.headers["authorization"]) return next(createError.Unauthorized())
  const authHeader = req.headers["authorization"]
  const bearerToken = authHeader.split(" ")
  const token = bearerToken[1]
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      if (err.name === "JsonWebTokenError") {
        return res.status(403).json({
          error: createError.Unauthorized(),
        })
      } else {
        return res.status(403).json({
          error: createError.Unauthorized(err.message),
        })
      }
    }
    res.json({
      message: "valid token",
    })
  })
}

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw createError.BadRequest()
    const userId = await verifyRefreshToken(refreshToken)
    const accessToken = jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })
    const refToken = signRefresToken(userId)
    res.send({
      accessToken: accessToken,
      refreshToken: refToken,
    })
  } catch (error) {
    next(error)
  }
}

const verifyRefreshToken = (refreshToken) => {
  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_TOKEN_SECRET,
    (err, payload) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          return res.status(403).json({
            error: createError.Unauthorized(),
          })
        } else {
          return res.status(403).json({
            error: createError.Unauthorized(err.message),
          })
        }
      }
      const userId = payload.aud
      return userId
    }
  )
}

const signRefresToken = (userId) => {
  const token = jwt.sign(
    { _id: userId },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1y",
    }
  )
  return token
}

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET, // req.user
  algorithms: ["sha1", "RS256", "HS256"],
})

exports.adminMiddleware = (req, res, next) => {
  User.findById({ _id: req.user._id }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      })
    }
    if (user.role !== "admin") {
      return res.status(400).json({
        error: "Admin resource. Access denied",
      })
    }
    req.profile = user
    next()
  })
}
exports.forgotPassword = (req, res) => {
  const { email } = req.body
  console.log(email, "email")
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res
        .status(400)
        .json({ error: "User with that email does not exist" })
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "10m",
    })
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Password Reset link`,
      html: `<h1>Please use the following link to reset your account</h1>
            <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>${process.env.CLIENT_URL}</p>`,
    }
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        console.log("reset password link error", error)
        return res.status(400).json({
          error: "Database connection error on user password forgot request",
        })
      } else {
        sendEmailWithNodemailer(req, res, emailData, email)
      }
    })
  })
}

exports.resetPassword = (req, res, next) => {
  const { resetPasswordLink, newPassword } = req.body
  //resetpasswordlink basically a token
  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      function (err, decoded) {
        if (err) {
          return res.status(400).json({
            error: "Expired link. Try again",
          })
        }
        console.log(resetPasswordLink, "resetPasswordLink")
        User.findOne({ resetPasswordLink }, (err, user) => {
          if (err || !user) {
            return res.status(400).json({
              error: "Something went wrong.Try later",
            })
          }
          const updatedFields = {
            password: newPassword,
            resetPasswordLink: "",
          }
          const newUser = Object.assign(user, updatedFields)
          // user = _.extend(user, updatedFields)
          newUser.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: "Error resetting user password",
              })
            }
            res.json({
              message: "Great",
            })
          })
        })
      }
    )
  }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

exports.googleLogin = (req, res) => {
  const { idToken } = req.body
  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then((response) => {
      const { email_verified, name, email } = response.payload
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "7d",
            })
            const { _id, email, name, role } = user
            return res.json({
              token,
              user: { _id, email, name, role },
            })
          } else {
            let password = email + process.env.JWT_SECRET
            console.log(password, "password")
            user = new User({ name, email, password })
            user.save((err, data) => {
              if (err) {
                console.log(err, "err")
                return res.status(400).json({
                  error: "user signup failed",
                })
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                {
                  expiresIn: "7d",
                }
              )
              const { _id, email, name, role } = data
              return res.json({
                token,
                user: { _id, email, name, role },
              })
            })
          }
        })
      } else {
        return res.status(400).json({
          error: "google logiin failed",
        })
      }
    })
}

exports.facebookLogin = (req, res) => {
  const { userID, accessToken } = req.body
  const url = `https://graph.facebook.com/v2.11/${userID}?fields=id,name,email&access_token=${accessToken}`
  return fetch(url, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((response) => {
      console.log(response, "response")
      const { email, name } = response
      User.findOne({ email }).exec((err, user) => {
        if (user) {
          const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
          })
          const { _id, email, name, role } = user
          return res.json({
            token,
            user: { _id, email, name, role },
          })
        } else {
          let password = email + process.env.JWT_SECRET
          user = new User({ name, email, password })
          user.save((err, data) => {
            if (err) {
              console.log(err, "err")
              return res.status(400).json({
                error: "user signup failed",
              })
            }
            const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, {
              expiresIn: "7d",
            })
            const { _id, email, name, role } = data
            return res.json({
              token,
              user: { _id, email, name, role },
            })
          })
        }
      })
    })
    .catch((error) => {
      res.json({
        error: "Facebook login failed",
      })
    })
}

// LINKEDIN

exports.linkedinLogin = (req, res) => {
  // Get code and state needed to get access token
  //console.log("req.query.code ", req.query.code); // code
  //console.log("req.query.state ", req.query.state); // state

  const code = req.query.code
  const user = {
    firstName: "",
    lastName: "",
    email: "",
  }

  const requestUserData = async () => {
    console.log(code, "code")
    const getAccessToken = await axios({
      method: "POST",
      url: `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&client_id=${process.env.LINKEDIN_CLIENT_ID}&client_secret=${process.env.LINKEDIN_CLIENT_SECRET}`,
    })
      .then((response) => {
        console.log("LINKEDIN ACCESS TOKEN SUCCESS", response.status)
        return response.data.access_token
        // return res.json({ access_token: response.data.access_token });
      })
      .catch((error) => {
        // console.log("LINKEDIN ACCESS TOKEN ERROR", error)
        return res.json(error)
      })

    const access_token = getAccessToken

    const getNames = await axios({
      method: "GET",
      url: "https://api.linkedin.com/v2/me",
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then((response) => {
        console.log(
          "LINKEDIN PROFILE SUCCESS",
          response.status,
          response.statusText
        )
        // console.log(response.data);
        return {
          firstName: response.data.localizedFirstName,
          lastName: response.data.localizedLastName,
        }
      })
      .catch((error) => {
        console.log("LINKEDIN PROFILE ERROR", error)

        return res.json({
          error: error.response.status + error.response.statusText,
        })
      })

    const names = getNames
    //console.log("names ", names);
    user.firstName = names.firstName
    user.lastName = names.lastName
    const name = user.firstName + " " + user.lastName

    const getEmail = await axios({
      method: "GET",
      url: `https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))&oauth2_access_token=${access_token}`,
    })
      .then((response) => {
        console.log("LINKEDIN ACCESS EMAIL SUCCESS", response.status)
        // console.log(
        //   "response.data.elements[0] ",
        //   response.data.elements[0]["handle~"].emailAddress
        // );
        const emailAddress = response.data.elements[0]["handle~"].emailAddress
        //console.log(emailAddress);
        return emailAddress
      })
      .catch((error) => {
        console.log("LINKEDIN ACCESS EMAIL ERROR", error)

        return res.json(error)
      })

    const email = getEmail
    //console.log("email ", email);
    user.email = email

    User.findOne({ email }).exec((err, user) => {
      if (user) {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        })
        const { _id, email, name, role } = user
        return res.json({
          token,
          user: { _id, email, name, role },
        })
      } else {
        let password = email + process.env.JWT_SECRET
        user = new User({ name, email, password })
        user.save((err, data) => {
          if (err) {
            console.log(err, "err")
            return res.status(400).json({
              error: "user signup failed",
            })
          }
          const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
          })
          const { _id, email, name, role } = data
          return res.json({
            token,
            user: { _id, email, name, role },
          })
        })
      }
    })
  }

  requestUserData()
}

// const token = jwt.sign(
//   { name, email, password },
//   process.env.JWT_ACCOUNT_ACTIVATION,
//   { expiresIn: "10m" }
// )

// const emailData = {
//   from: "masterjupiter2015@gmail.com", // MAKE SURE THIS EMAIL IS YOUR GMAIL FOR WHICH YOU GENERATED APP PASSWORD
//   to: email, // WHO SHOULD BE RECEIVING THIS EMAIL? IT SHOULD BE THE USER EMAIL (VALID EMAIL ADDRESS) WHO IS TRYING TO SIGNUP
//   subject: "ACCOUNT ACTIVATION LINK",
//   html: `
//             <h1>Please use the following link to activate your account</h1>
//             <p>http://localhost:3000/auth/activate/${token}</p>
//             <hr />
//             <p>This email may contain sensitive information</p>
//             <p>http://localhost:3000</p>
//         `,
// }

// sendEmailWithNodemailer(req, res, emailData)

// const emailData = {
//   from: process.env.EMAIL_FROM,
//   to: email,
//   subject: `Account activation link`,
//   html: `
//             <h1>Please use the following link to activate your account</h1>
//             <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
//             <hr />
//             <p>This email may contain sensetive information</p>
//             <p>${process.env.CLIENT_URL}</p>
//         `,
// };

// sgMail
//   .send(emailData)
//   .then((sent) => {
//     // console.log('SIGNUP EMAIL SENT', sent)
//     return res.json({
//       message: `Email has been sent to ${email}. Follow the instruction to activate your account`,
//     });
//   })
//   .catch((err) => {
//     // console.log('SIGNUP EMAIL SENT ERROR', err)
//     return res.json({
//       message: err.message,
//     });
//   });

//previous basic code
// exports.signup = (req, res) => {
//   //console.log("REQ BODY ON SIGNUP", req.body)
//   const { name, email, password } = req.body
//   User.findOne({ email }).exec((err, user) => {
//     if (user) {
//       return res.status(400).json({
//         error: "Email is taken",
//       })
//     }
//   })

//   let newUser = new User({ name, email, password })
//   newUser.save((err, success) => {
//     if (err) {
//       console.log("SIGNUP ERROR", err)
//       return res.status(400).json({
//         error: err,
//       })
//     }
//     res.json({
//       message: "Signup success! Please signin",
//     })
//   })
// }
