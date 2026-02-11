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
        attributes: ['id', 'author', 'url', 'title', 'likes', 'year']
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

usersRouter.get('/:id', async (req, res, next) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' })
  }

  const readQuery = req.query.read
  let readFilter

  if (readQuery !== undefined) {
    if (readQuery === 'true') {
      readFilter = true
    } else if (readQuery === 'false') {
      readFilter = false
    } else {
      return res.status(400).json({ error: 'read query must be true or false' })
    }
  }

  try {
    const user = await User.findByPk(id, {
      include: [
        {
          model: Blog,
          attributes: ['id', 'author', 'url', 'title', 'likes', 'year']
        },
        {
          model: Blog,
          as: 'readings',
          attributes: ['id', 'url', 'title', 'author', 'likes', 'year'],
          through: {
            attributes: ['id', 'read'],
            ...(readFilter !== undefined ? { where: { read: readFilter } } : {})
          }
        }
      ]
    })

    if (!user) {
      return res.status(404).json({ error: 'user not found' })
    }

    const userJson = user.toJSON()
    return res.json(userJson)
  } catch (error) {
    return next(error)
  }
})

module.exports = usersRouter
