const { ValidationError, DatabaseError } = require('sequelize')

const errorHandler = (error, _req, res, _next) => {
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
  errorHandler
}
