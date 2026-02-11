const express = require('express')
const { PORT } = require('./util/config')
const { connectToDatabase } = require('./models')
const blogsRouter = require('./controllers/blogs')

const app = express()
app.use(express.json())
app.use('/api/blogs', blogsRouter)

const start = async () => {
  try {
    await connectToDatabase()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to connect to database:', error.message)
    process.exit(1)
  }
}

start()
