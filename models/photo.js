const mongoose = require("mongoose")

const photoSchema = new mongoose.Schema(
  {
    photo: {
      data: Buffer,
      contentType: String,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Photo", photoSchema)
