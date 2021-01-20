const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const errorHandler = require("./middleware/error-handler")
const app = express()
const { verifyToken } = require("./controllers/auth")

require("dotenv").config()

//connct to db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
    useCreateIndex: true,
  })
  .then(() => console.log("db connected"))
  .catch((err) => console.log("DB CONNECTION ERROR", err))

//import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/user")
//app middlewares
app.use(morgan("dev"))
app.use(bodyParser.json())
app.use(cors()) //allow all origins
// if (process.env.NODE_ENV == "development") {
//   app.use(cors({ origin: `http://localhost:3000` }))
// }

app.get("/", verifyToken)

//middleware
app.use("/api", authRoutes)

app.use("/api", userRoutes)

app.use(errorHandler)

app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  })
})

const port = process.env.port || 8000

app.listen(port, () => {
  console.log(`API is running on port ${port}`)
})
