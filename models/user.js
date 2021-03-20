const mongoose = require("mongoose")
const crypto = require("crypto")

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
      unique: true,
      index: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    profile: {
      type: String,
      required: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    salt: String,
    //how strong to hash the password
    about: {
      type: String,
    },
    role: {
      type: Number,
      default: 0,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    resetPasswordLink: {
      data: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
)

userSchema
  .virtual("password")
  .set(function (password) {
    //create a temporarity variable called _password
    this._password = password
    //generate salt
    this.salt = this.makeSalt()
    //encrypt password
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function () {
    return this._password
  })

userSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) == this.hashed_password
  },
  encryptPassword: function (password) {
    if (!password) {
      return ""
    }
    try {
      //crypto come from default with nodejs
      return crypto.createHmac("sha1", this.salt).update(password).digest("hex")
      //hashing algorithm is sha1
      //after hashing then update the password
      //通过引入的模块可以知道，digest() 是 crypto加密模块中的一个方法，
      //为计算传入的所有数据的摘要值，其参数是编码方式，可以有 'hex'、'binary'或者'base64'
    } catch (err) {
      return ""
    }
  },
  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + ""
  },
}

module.exports = mongoose.model("User", userSchema)
