const loginRouter = require('express').Router()
const { Op } = require('sequelize')
const { User, Session } = require('../models')
const { signToken, verifyToken } = require('../util/token')

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

    if (user.disabled) {
      return res.status(401).json({ error: 'invalid username or password' })
    }

    const userForToken = {
      id: user.id,
      username: user.username
    }

    const token = signToken(userForToken)
    const decodedToken = verifyToken(token)

    await Session.destroy({
      where: {
        userId: user.id,
        expiresAt: {
          [Op.lte]: new Date()
        }
      }
    })

    await Session.create({
      userId: user.id,
      token,
      expiresAt: new Date(decodedToken.exp * 1000)
    })

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
