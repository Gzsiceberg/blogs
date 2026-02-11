const { DataTypes } = require('sequelize')
const { Umzug, SequelizeStorage } = require('umzug')
const sequelize = require('../util/db')
const Blog = require('./blog')
const User = require('./user')

User.hasMany(Blog, { foreignKey: 'userId' })
Blog.belongsTo(User, { foreignKey: 'userId' })

const runMigrations = async () => {
  const migrator = new Umzug({
    migrations: {
      glob: 'migrations/*.js'
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({
      sequelize,
      modelName: 'migration',
      tableName: 'migrations',
      columnType: DataTypes.STRING
    }),
    logger: console
  })

  const migrations = await migrator.up()
  console.log('Migrations up to date', {
    files: migrations.map((migration) => migration.name)
  })
}

const connectToDatabase = async () => {
  try {
    await sequelize.authenticate()
    await runMigrations()
    console.log('connected to the database')
  } catch (error) {
    console.log('failed to connect to the database')
    console.log(error)
    process.exit(1)
  }
}

module.exports = {
  connectToDatabase,
  sequelize,
  Blog,
  User
}
