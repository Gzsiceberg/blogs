const express = require('express')
const { PORT } = require('./util/config')
const { connectToDatabase } = require('./models')
const blogsRouter = require('./controllers/blogs')
const loginRouter = require('./controllers/login')
const usersRouter = require('./controllers/users')
const authorsRouter = require('./controllers/authors')
const { tokenExtractor, errorHandler } = require('./util/middleware')

const app = express()
app.use(express.json())
app.use(tokenExtractor)
app.use('/api/login', loginRouter)
app.use('/api/blogs', blogsRouter)
app.use('/api/authors', authorsRouter)
app.use('/api/users', usersRouter)
app.use(errorHandler)

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

if (require.main === module) {
  start()
}

module.exports = app
