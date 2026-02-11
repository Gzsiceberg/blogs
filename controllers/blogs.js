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

blogsRouter.post('/', async (req, res) => {
  const { author = null, url, title, likes = 0 } = req.body

  if (!url || !String(url).trim()) {
    return res.status(400).json({ error: 'url is required' })
  }

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'title is required' })
  }

  if (!Number.isInteger(likes) || likes < 0) {
    return res.status(400).json({ error: 'likes must be a non-negative integer' })
  }

  try {
    const createdBlog = await Blog.create({
      author,
      url: String(url).trim(),
      title: String(title).trim(),
      likes
    })

    res.status(201).json(createdBlog)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

blogsRouter.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { likes } = req.body

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' })
  }

  if (!Number.isInteger(likes) || likes < 0) {
    return res.status(400).json({ error: 'likes must be a non-negative integer' })
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
    res.status(500).json({ error: error.message })
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
