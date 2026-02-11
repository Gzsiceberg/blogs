const blogsRouter = require('express').Router()
const { Blog } = require('../models')

blogsRouter.get('/', async (_req, res) => {
  try {
    const blogs = await Blog.findAll({
      order: [['id', 'ASC']]
    })
    res.json(blogs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

blogsRouter.post('/', async (req, res, next) => {
  const { author = null, url, title, likes = 0 } = req.body

  try {
    const createdBlog = await Blog.create({
      author: author || null,
      url,
      title,
      likes
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

blogsRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' })
  }

  try {
    const deletedCount = await Blog.destroy({
      where: { id }
    })

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'blog not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = blogsRouter
