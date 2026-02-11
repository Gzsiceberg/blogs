const { DataTypes, Sequelize } = require('sequelize')

const normalizeTableName = (table) => {
  if (typeof table === 'string') {
    return table
  }

  if (table && typeof table === 'object') {
    if (typeof table.tableName === 'string') {
      return table.tableName
    }
    if (typeof table.name === 'string') {
      return table.name
    }
  }

  return ''
}

const hasTable = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables()
  return tables.map(normalizeTableName).includes(tableName)
}

module.exports = {
  up: async ({ context: queryInterface }) => {
    if (!(await hasTable(queryInterface, 'sessions'))) {
      await queryInterface.createTable('sessions', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        token: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        }
      })
      await queryInterface.addIndex('sessions', ['user_id'])
    }
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('sessions')
  }
}
