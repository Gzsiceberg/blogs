const logoutRouter = require('express').Router()
const { requireAuth } = require('../util/middleware')

logoutRouter.delete('/', requireAuth, async (req, res, next) => {
  try {
    await req.session.destroy()
    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
})

module.exports = logoutRouter
