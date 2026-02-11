const { DataTypes } = require('sequelize')
const { Umzug, SequelizeStorage } = require('umzug')
const sequelize = require('./db')

const rollbackMigration = async () => {
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

  const reverted = await migrator.down({ step: 1 })
  console.log('Rolled back migrations', {
    files: reverted.map((migration) => migration.name)
  })
}

const main = async () => {
  try {
    await sequelize.authenticate()
    await rollbackMigration()
    console.log('migration rollback complete')
  } catch (error) {
    console.log('migration rollback failed')
    console.log(error)
    process.exitCode = 1
  } finally {
    await sequelize.close()
  }
}

main()
