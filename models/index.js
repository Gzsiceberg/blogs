const sequelize = require('../util/db')
const Blog = require('./blog')

const connectToDatabase = async () => {
  await sequelize.authenticate()
  await sequelize.sync()
}

module.exports = {
  connectToDatabase,
  sequelize,
  Blog
}
