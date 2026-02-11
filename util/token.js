const jwt = require('jsonwebtoken')
const { randomUUID } = require('node:crypto')
const { SECRET } = require('./config')

const TOKEN_EXPIRATION = '1h'

const signToken = (payload) =>
  jwt.sign(payload, SECRET, {
    expiresIn: TOKEN_EXPIRATION,
    jwtid: randomUUID()
  })
const verifyToken = (token) => jwt.verify(token, SECRET)

module.exports = {
  signToken,
  TOKEN_EXPIRATION,
  verifyToken
}
