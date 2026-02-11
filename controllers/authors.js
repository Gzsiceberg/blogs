const authorsRouter = require('express').Router()
const { fn, col, Op } = require('sequelize')
const { Blog } = require('../models')

authorsRouter.get('/', async (_req, res, next) => {
  try {
    const authors = await Blog.findAll({
      attributes: [
        'author',
        [fn('COUNT', col('id')), 'articles'],
        [fn('SUM', col('likes')), 'likes']
      ],
      where: {
        author: {
          [Op.not]: null
        }
      },
      group: ['author'],
      order: [
        [fn('SUM', col('likes')), 'DESC'],
        ['author', 'ASC']
      ]
    })

    res.json(authors)
  } catch (error) {
    next(error)
  }
})

module.exports = authorsRouter
