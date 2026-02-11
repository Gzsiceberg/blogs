const { ValidationError, DatabaseError } = require('sequelize')
const { verifyToken } = require('./token')
const { Session, User } = require('../models')

const tokenExtractor = (req, _res, next) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    req.token = authorization.substring(7)
  } else {
    req.token = null
  }
  next()
}

const requireAuth = async (req, res, next) => {
  if (!req.token) {
    return res.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = verifyToken(req.token)
    const session = await Session.findOne({
      where: { token: req.token }
    })

    if (!session) {
      return res.status(401).json({ error: 'token invalid' })
    }

    if (session.userId !== decodedToken.id || session.expiresAt <= new Date()) {
      await session.destroy()
      return res.status(401).json({ error: 'token invalid' })
    }

    const user = await User.findByPk(decodedToken.id)

    if (!user || user.disabled) {
      return res.status(401).json({ error: 'token invalid' })
    }

    req.decodedToken = decodedToken
    req.session = session
    req.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}

const errorHandler = (error, _req, res, _next) => {
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'token invalid' })
  }

  if (error instanceof ValidationError) {
    const message = error.errors.map((e) => e.message).join(', ')
    return res.status(400).json({ error: message })
  }

  if (error instanceof DatabaseError) {
    return res.status(400).json({ error: 'invalid data' })
  }

  console.error(error.message)
  return res.status(500).json({ error: 'internal server error' })
}

module.exports = {
  tokenExtractor,
  requireAuth,
  errorHandler
}
