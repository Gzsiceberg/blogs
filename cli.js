const { sequelize, Blog } = require('./models')

const main = async () => {
  try {
    const rows = await Blog.findAll({
      order: [['id', 'ASC']]
    })

    rows.forEach((blog) => {
      console.log(`${blog.author}: '${blog.title}', ${blog.likes} likes`)
    })
  } catch (error) {
    console.error('Error fetching blogs:', error.message)
    process.exitCode = 1
  } finally {
    await sequelize.close()
  }
}

main()
