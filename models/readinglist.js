const { DataTypes, Model } = require('sequelize')
const sequelize = require('../util/db')

class ReadingList extends Model {}

ReadingList.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    blogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'blog_id'
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'readinglist',
    tableName: 'readinglists',
    timestamps: false
  }
)

module.exports = ReadingList
