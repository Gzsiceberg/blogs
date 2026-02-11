const sequelize = require('../util/db')
const Blog = require('./blog')
const User = require('./user')

User.hasMany(Blog, { foreignKey: 'userId' })
Blog.belongsTo(User, { foreignKey: 'userId' })

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
