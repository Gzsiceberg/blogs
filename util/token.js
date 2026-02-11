const jwt = require('jsonwebtoken')
const { SECRET } = require('./config')

const verifyToken = (token) => jwt.verify(token, SECRET)

module.exports = {
  verifyToken
}
