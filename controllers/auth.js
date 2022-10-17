const { validationResult } = require('express-validator');
const User = require('../model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.EMAIL_SENDGRID_KEY)


exports.signUp = async (req, res, next) => {
  let e = false
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error('Validation Error')
    err.statusCode = 400
    err.errors = errors.array()
    return next(err)
  }
  const isExisted = await User.findAll({ where: { email: req.body.email } }).catch(err => {
    e = true;
    next(err)
  })
  if (e) {
    return
  }

  if (isExisted.length !== 0) {
    const err = new Error('Existed User')
    err.statusCode = 409
    return next(err);
  }
  const salt = await bcrypt.genSalt(12)
  req.body.password = await bcrypt.hash(req.body.password, salt)
  const verifyCode = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  try {
    req.body.image = new URL(req.body.image);
  }
  catch (e) {
    req.body.image = null
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    image: req.body?.image.href,
    bio: req.body?.bio,
    verifyCode
  }).catch(err => {
    e = true;
    next(err)
  })
  if (e) {
    return
  }
  sgMail.send({
    to: req.body.email,
    from: 'oa1222001@gmail.com',
    subject: 'Welcome to my Social Media App! Confirm Your Email',
    html: `<!DOCTYPE html>
              <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title></title>
                <!--[if mso]>
                <noscript>
                  <xml>
                    <o:OfficeDocumentSettings>
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                  </xml>
                </noscript>
                <![endif]-->
                <style>
                  table, td, div, h1, p {font-family: Arial, sans-serif;}
                </style>
              </head>
              <body style="margin:0;padding:0;">
                <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;">
                  <tr>
                    <td align="center" style="padding:0;">
                      <table role="presentation" style="width:602px;border-collapse:collapse;border:1px solid #cccccc;border-spacing:0;text-align:left;">
                        <tr>
                          <td align="center" style="padding:40px 0 30px 0;background:#70bbd9;">
                            <img src="https://assets.codepen.io/210284/h1.png" alt="" width="300" style="height:auto;display:block;" />
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 30px 42px 30px;">
                            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
                              <tr>
                                <td style="padding:0 0 36px 0;color:#153643;">
                                  <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">Confirm your email</h1>
                                  <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">
              You're on your way!
              Let's confirm your email address.
              By clicking on the following link, you are confirming your email address.
        
              Confirm Email Address</p>
                                  <p style="margin:0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;"><a href="http://${process.env.DOMAIN + process.env.PORT + '/auth/verification/' + verifyCode}" style="color:#ee4c50;text-decoration:underline;">Confirm now</a></p>
                                </td>
                              </tr>
        
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:30px;background:#ee4c50;">
                            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;font-size:9px;font-family:Arial,sans-serif;">
                              <tr>
                                <td style="padding:0;width:50%;" align="left">
                                  <p style="margin:0;font-size:14px;line-height:16px;font-family:Arial,sans-serif;color:#ffffff;">
                                    &reg; Someone, Somewhere 2022<br/>
                                  </p>
                                </td>
                                <td style="padding:0;width:50%;" align="right">
        
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>`
  })
  const token = jwt.sign(
    { name: user.name, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  )
  res.status(201).json({ user: { name: user.name }, token })

}

exports.login = async (req, res, next) => {
  let e = false
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error('Validation Error')
    err.statusCode = 400
    err.errors = errors.array()
    return next(err)
  }

  const { email, password } = req.body

  const user = await User.findAll({ where: { email } }).catch(err => {
    e = true;
    next(err)
  })
  if (e) {
    return
  }
  if (user.length === 0) {
    const err = new Error('Invalid Credentials')
    err.statusCode = 401
    return next(err)
  }

  // console.log(password, user[0].password);
  const isPasswordCorrect = await bcrypt.compare(password, user[0].password)
  if (!isPasswordCorrect) {
    const err = new Error('Invalid Credentials')
    err.statusCode = 401
    return next(err)
  }

  if (!user[0].verified) {
    const err = new Error('You Must Verify Your Email first')
    err.statusCode = 401
    return next(err)
  }

  const token = jwt.sign(
    { name: user[0].name, email: user[0].email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  )
  res.status(200).json({ user: { name: user[0].name, email: user[0].email }, token })
}

exports.verifySignUp = async (req, res, next) => {
  let e = false
  const token = req.params.token;
  if (!token) {
    const err = new Error('Enter a token to verify your email')
    err.statusCode = 401
    return next(err)
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!payload.email) {
      const err = new Error('Bad Token.')
      err.statusCode = 401
      return next(err)
    }
    const user = await User.findOne({ where: { email: payload.email } }).catch(err => {
      e = true;
      next(err)
    })
    if (e) {
      return
    }
    user.verified = true;
    await user.save().catch(err => {
      e = true;
      next(err)
    })
    if (e) {
      return
    }
    res.status(201).json({ msg: 'Verified.' })

  } catch (error) {
    return next(error)
  }
}

exports.forgotPass = async (req, res, next) => {
  let e = false
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const err = new Error('Validation Error')
    err.statusCode = 400
    err.errors = errors.array()
    return next(err)
  }

  const user = await User.findAll({ where: { email: req.body.email } }).catch(err => {
    e = true;
    next(err)
  })
  if (e) {
    return
  }

  if (user.length === 0) {
    const err = new Error('Email not found')
    err.statusCode = 404
    return next(err)
  }

  const token = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET, { expiresIn: '2h' })

  sgMail.send({
    to: req.body.email,
    from: 'oa1222001@gmail.com',
    subject: 'Welcome to my Social Media App! Reset Your Password',
    html: `<!DOCTYPE html>
              <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <title></title>
                <!--[if mso]>
                <noscript>
                  <xml>
                    <o:OfficeDocumentSettings>
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                  </xml>
                </noscript>
                <![endif]-->
                <style>
                  table, td, div, h1, p {font-family: Arial, sans-serif;}
                </style>
              </head>
              <body style="margin:0;padding:0;">
                <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;">
                  <tr>
                    <td align="center" style="padding:0;">
                      <table role="presentation" style="width:602px;border-collapse:collapse;border:1px solid #cccccc;border-spacing:0;text-align:left;">
                        <tr>
                          <td align="center" style="padding:40px 0 30px 0;background:#70bbd9;">
                            <img src="https://assets.codepen.io/210284/h1.png" alt="" width="300" style="height:auto;display:block;" />
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 30px 42px 30px;">
                            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
                              <tr>
                                <td style="padding:0 0 36px 0;color:#153643;">
                                  <h1 style="font-size:24px;margin:0 0 20px 0;font-family:Arial,sans-serif;">Confirm your email</h1>
                                  <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;">
              You're on your way!
              Let's reset your password address.
              By clicking on the following link, you are resetting your password.
        
              Reset your Password</p>
                                  <p style="margin:0;font-size:16px;line-height:24px;font-family:Arial,sans-serif;"><a href="http://${process.env.DOMAIN + process.env.PORT + '/auth/resetpass/' + token}" style="color:#ee4c50;text-decoration:underline;">Confirm now</a></p>
                                </td>
                              </tr>
        
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:30px;background:#ee4c50;">
                            <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;font-size:9px;font-family:Arial,sans-serif;">
                              <tr>
                                <td style="padding:0;width:50%;" align="left">
                                  <p style="margin:0;font-size:14px;line-height:16px;font-family:Arial,sans-serif;color:#ffffff;">
                                    &reg; Someone, Somewhere 2022<br/>
                                  </p>
                                </td>
                                <td style="padding:0;width:50%;" align="right">
        
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>`
  })

  res.status(200).json({ msg: "Reset Token has been sent to your email." })

}

exports.verifyPassReset = async (req, res, next) => {
  let e = false
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error('Validation Error')
    err.statusCode = 400
    err.errors = errors.array()
    return next(err)
  }
  const token = req.params.token;
  if (!token) {
    const err = new Error('Enter a token to reset your password')
    err.statusCode = 401
    return next(err)
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    if (!payload.email) {
      const err = new Error('Bad Token.')
      err.statusCode = 401
      return next(err)
    }
    const user = await User.findAll({ where: { email: payload.email } }).catch(err => {
      e = true;
      next(err)
    })
    if (e) {
      return
    }
    const salt = await bcrypt.genSalt(12)
    user[0].password = await bcrypt.hash(req.body.password, salt)
    await user[0].save().catch(err => {
      e = true;
      next(err)
    })
    if (e) {
      return
    }
    res.status(201).json({ msg: 'Password resetted.' })
  } catch (error) {
    return next(error)
  }

}