const Photo = require("../models/photo")
const formidable = require("formidable")
const slugify = require("slugify")
const { stripHtml } = require("string-strip-html")
const _ = require("lodash")
const { errorHandler } = require("../helpers/dbErrorHandler")
const fs = require("fs")

exports.uploadPhoto = (req, res) => {
  let form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "image could not upload",
      })
    }

    let Uploadphoto = new Photo()

    if (files.file) {
      if (files.file.size > 10000000) {
        return res.status(400).json({
          error: "Image could not upload",
        })
      } else {
        // console.log(files.photo.path, "files.photo.path")
        // return res.status(200).send(fs.readFileSync(files.file.path))
        Uploadphoto.photo.data = fs.readFileSync(files.file.path)
        Uploadphoto.photo.contentType = files.file.type
      }
    }

    // blog.photo.data = fs.readFileSync(files.photo.path)
    // blog.photo.contentType = files.photo.type

    Uploadphoto.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        })
      }
      res.json({ id: result._id })
    })
  })
}

exports.readPhoto = (req, res) => {
  const id = req.params.id.toLowerCase()

  Photo.findOne({ _id: id }).exec((err, data) => {
    if (err || !data) {
      return res.json({
        error: errorHandler(err),
      })
    }
    res.set("Content-type", data.photo.contentType)
    return res.send(data.photo.data)
  })
}
