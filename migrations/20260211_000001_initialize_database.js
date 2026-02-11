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

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  const definitionMap = await queryInterface.describeTable(tableName)
  if (!definitionMap[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition)
  }
}

module.exports = {
  up: async ({ context: queryInterface }) => {
    if (!(await hasTable(queryInterface, 'users'))) {
      await queryInterface.createTable('users', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        username: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        }
      })
    } else {
      await addColumnIfMissing(queryInterface, 'users', 'created_at', {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      })
      await addColumnIfMissing(queryInterface, 'users', 'updated_at', {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      })
    }

    if (!(await hasTable(queryInterface, 'blogs'))) {
      await queryInterface.createTable('blogs', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        author: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        url: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        title: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        likes: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL'
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        }
      })
    } else {
      await addColumnIfMissing(queryInterface, 'blogs', 'user_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      })
      await addColumnIfMissing(queryInterface, 'blogs', 'created_at', {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      })
      await addColumnIfMissing(queryInterface, 'blogs', 'updated_at', {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      })
    }
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('blogs')
    await queryInterface.dropTable('users')
  }
}
