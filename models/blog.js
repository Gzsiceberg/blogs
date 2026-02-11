const { DataTypes, Model } = require('sequelize')
const sequelize = require('../util/db')

class Blog extends Model {}

Blog.init(
  {
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
      allowNull: false,
      validate: {
        notEmpty: true,
        notBlank(value) {
          if (!value || !value.trim()) {
            throw new Error('url cannot be empty')
          }
        }
      }
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        notBlank(value) {
          if (!value || !value.trim()) {
            throw new Error('title cannot be empty')
          }
        }
      }
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: () => new Date().getFullYear(),
      validate: {
        isInt: {
          msg: 'year must be an integer'
        },
        isValidYear(value) {
          const currentYear = new Date().getFullYear()
          if (value < 1991 || value > currentYear) {
            throw new Error(`year must be between 1991 and ${currentYear}`)
          }
        }
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    }
  },
  {
    sequelize,
    modelName: 'blog',
    tableName: 'blogs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
)

module.exports = Blog
