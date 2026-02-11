const { DataTypes } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('readinglists', {
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
      blog_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'blogs',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    })

    await queryInterface.addConstraint('readinglists', {
      fields: ['user_id', 'blog_id'],
      type: 'unique',
      name: 'readinglists_user_id_blog_id_unique'
    })
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('readinglists')
  }
}
