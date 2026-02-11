const readingListsRouter = require('express').Router()
const { UniqueConstraintError } = require('sequelize')
const { ReadingList, Blog, User } = require('../models')
const { requireAuth } = require('../util/middleware')

readingListsRouter.post('/', requireAuth, async (req, res, next) => {
  const { blogId, userId } = req.body

  if (!Number.isInteger(blogId) || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'blogId and userId must be integers' })
  }

  try {
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'forbidden' })
    }

    const [user, blog] = await Promise.all([
      User.findByPk(userId),
      Blog.findByPk(blogId)
    ])

    if (!user || !blog) {
      return res.status(404).json({ error: 'user or blog not found' })
    }

    const createdEntry = await ReadingList.create({
      blogId,
      userId
    })

    return res.status(201).json(createdEntry)
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'blog already in reading list' })
    }

    return next(error)
  }
})

readingListsRouter.put('/:id', requireAuth, async (req, res, next) => {
  const id = Number(req.params.id)
  const { read } = req.body

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' })
  }

  if (typeof read !== 'boolean') {
    return res.status(400).json({ error: 'read must be a boolean' })
  }

  try {
    const readingListEntry = await ReadingList.findByPk(id)

    if (!readingListEntry) {
      return res.status(404).json({ error: 'reading list entry not found' })
    }

    if (readingListEntry.userId !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' })
    }

    readingListEntry.read = read
    await readingListEntry.save()

    return res.json(readingListEntry)
  } catch (error) {
    return next(error)
  }
})

module.exports = readingListsRouter
