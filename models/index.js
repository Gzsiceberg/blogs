const sequelize = require('../util/db')
const Blog = require('./blog')
const User = require('./user')

const connectToDatabase = async () => {
  await sequelize.authenticate()
  await sequelize.sync()
}

module.exports = {
  connectToDatabase,
  sequelize,
  Blog,
  User
}
