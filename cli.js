require('dotenv').config()
const { Sequelize, DataTypes, Model } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL)

class Blog extends Model {}

Blog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    author: {
      type: DataTypes.TEXT
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
    }
  },
  {
    sequelize,
    modelName: 'blog',
    tableName: 'blogs',
    timestamps: false
  }
)

const main = async () => {
  try {
    const rows = await Blog.findAll({
      order: [['id', 'ASC']]
    })

    rows.forEach((blog) => {
      console.log(`${blog.author}: '${blog.title}', ${blog.likes} likes`)
    })
  } catch (error) {
    console.error('Error fetching blogs:', error.message)
    process.exitCode = 1
  } finally {
    await sequelize.close()
  }
}

main()
