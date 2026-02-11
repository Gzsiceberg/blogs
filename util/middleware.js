const { ValidationError, DatabaseError } = require('sequelize')

const tokenExtractor = (req, _res, next) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    req.token = authorization.substring(7)
  } else {
    req.token = null
  }
  next()
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
  errorHandler
}
