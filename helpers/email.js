const nodeMailer = require("nodemailer")

exports.sendEmailWithNodemailer = (req, res, emailData, email) => {
  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    requireTLS: true,
    auth: {
      user: "chenglei.chou@gmail.com", // MAKE SURE THIS EMAIL IS YOUR GMAIL FOR WHICH YOU GENERATED APP PASSWORD
      pass: "yephccaiaedoyayf", // MAKE SURE THIS PASSWORD IS YOUR GMAIL APP PASSWORD WHICH YOU GENERATED EARLIER
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: "SSLv3",
    },
    connectionTimeout: 5 * 60 * 1000,
  })

  return transporter
    .sendMail(emailData)
    .then((info) => {
      return res.status(200).json({
        message: `Email has been sent to ${email}. Follow the instruction to activate your account`,
      })
    })
    .catch((err) => console.log(`Problem sending email: ${err}`))
}
