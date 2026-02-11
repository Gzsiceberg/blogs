const blogsRouter = require('express').Router()
const { Blog, User } = require('../models')
const { Op } = require('sequelize')
const { verifyToken } = require('../util/token')

blogsRouter.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const where = search ? { title: { [Op.iLike]: `%${search}%` } } : undefined

  try {
    const blogs = await Blog.findAll({
      where,
      include: {
        model: User,
        attributes: ['id', 'username', 'name']
      },
      order: [['id', 'ASC']]
    })
    res.json(blogs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

blogsRouter.post('/', async (req, res, next) => {
  const { author = null, url, title, likes = 0 } = req.body

  if (!req.token) {
    return res.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = verifyToken(req.token)
    const user = await User.findByPk(decodedToken.id)

    if (!user) {
      return res.status(401).json({ error: 'user not found' })
    }

    const createdBlog = await Blog.create({
      author: author || null,
      url,
      title,
      likes,
      userId: user.id
    })

    res.status(201).json(createdBlog)
  } catch (error) {
    next(error)
  }
})

blogsRouter.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id)
  const { likes } = req.body

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' })
  }

  try {
    const blog = await Blog.findByPk(id)

    if (!blog) {
      return res.status(404).json({ error: 'blog not found' })
    }

    blog.likes = likes
    await blog.save()

    res.json(blog)
  } catch (error) {
    next(error)
  }
})

blogsRouter.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' })
  }

  if (!req.token) {
    return res.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = verifyToken(req.token)
    const blog = await Blog.findByPk(id)

    if (!blog) {
      return res.status(404).json({ error: 'blog not found' })
    }

    if (blog.userId !== decodedToken.id) {
      return res.status(403).json({ error: 'only the creator can delete a blog' })
    }

    await blog.destroy()

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

module.exports = blogsRouter
