const { DataTypes, Model } = require('sequelize')
const sequelize = require('../util/db')

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        notBlank(value) {
          if (!value || !value.trim()) {
            throw new Error('name cannot be empty')
          }
        }
      }
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        notBlank(value) {
          if (!value || !value.trim()) {
            throw new Error('username cannot be empty')
          }
        }
      }
    }
  },
  {
    sequelize,
    modelName: 'user',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
)

module.exports = User
