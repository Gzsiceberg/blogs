const usersRouter = require('express').Router()
const { User, Blog } = require('../models')

usersRouter.post('/', async (req, res, next) => {
  const { name, username } = req.body

  try {
    const createdUser = await User.create({
      name,
      username
    })

    res.status(201).json(createdUser)
  } catch (error) {
    next(error)
  }
})

usersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await User.findAll({
      include: {
        model: Blog,
        attributes: ['id', 'author', 'url', 'title', 'likes']
      },
      order: [['id', 'ASC']]
    })
    res.json(users)
  } catch (error) {
    next(error)
  }
})

usersRouter.put('/:username', async (req, res, next) => {
  const currentUsername = req.params.username
  const { username } = req.body

  if (typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'username cannot be empty' })
  }

  try {
    const user = await User.findOne({
      where: { username: currentUsername }
    })

    if (!user) {
      return res.status(404).json({ error: 'user not found' })
    }

    user.username = username
    await user.save()

    res.json(user)
  } catch (error) {
    next(error)
  }
})

module.exports = usersRouter
