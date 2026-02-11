require('dotenv').config()
const express = require('express')
const { Sequelize, DataTypes, Model } = require('sequelize')

const app = express()
app.use(express.json())

const sequelize = new Sequelize(process.env.DATABASE_URL)

class Blog extends Model {}

Blog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    author: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'blog',
    tableName: 'blogs',
    timestamps: false
  }
)

app.get('/api/blogs', async (_req, res) => {
  try {
    const blogs = await Blog.findAll({
      order: [['id', 'ASC']]
    })
    res.json(blogs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/blogs', async (req, res) => {
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

app.delete('/api/blogs/:id', async (req, res) => {
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

const PORT = process.env.PORT || 3001
const start = async () => {
  try {
    await sequelize.authenticate()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to connect to database:', error.message)
    process.exit(1)
  }
}

start()
