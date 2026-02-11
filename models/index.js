const sequelize = require('../util/db')
const Blog = require('./blog')
const User = require('./user')

User.hasMany(Blog)
Blog.belongsTo(User)

const connectToDatabase = async () => {
  await sequelize.authenticate()
  User.sync({ alter: true })
  Blog.sync({ alter: true })  
}

module.exports = {
  connectToDatabase,
  sequelize,
  Blog,
  User
}
