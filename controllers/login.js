const jwt = require('jsonwebtoken')
const loginRouter = require('express').Router()
const { User } = require('../models')
const { SECRET } = require('../util/config')

loginRouter.post('/', async (req, res, next) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' })
  }

  try {
    const user = await User.findOne({
      where: { username }
    })

    if (!user || password !== 'secret') {
      return res.status(401).json({ error: 'invalid username or password' })
    }

    const userForToken = {
      id: user.id,
      username: user.username
    }

    const token = jwt.sign(userForToken, SECRET)

    return res.status(200).json({
      token,
      username: user.username,
      name: user.name
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = loginRouter
