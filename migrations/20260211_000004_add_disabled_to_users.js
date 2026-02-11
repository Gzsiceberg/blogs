const { DataTypes } = require('sequelize')

const hasColumn = async (queryInterface, tableName, columnName) => {
  const definition = await queryInterface.describeTable(tableName)
  return Boolean(definition[columnName])
}

module.exports = {
  up: async ({ context: queryInterface }) => {
    if (!(await hasColumn(queryInterface, 'users', 'disabled'))) {
      await queryInterface.addColumn('users', 'disabled', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      })
    }
  },

  down: async ({ context: queryInterface }) => {
    if (await hasColumn(queryInterface, 'users', 'disabled')) {
      await queryInterface.removeColumn('users', 'disabled')
    }
  }
}
