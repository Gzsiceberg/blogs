const { connectToDatabase, sequelize, User, Blog } = require('./models')

const seed = async () => {
  await connectToDatabase()

  const [user, userCreated] = await User.findOrCreate({
    where: { username: 'test_user' },
    defaults: {
      name: 'Test User',
      username: 'test_user'
    }
  })

  const blogSeeds = [
    {
      author: 'Dan Abramov',
      url: 'https://example.com/react-hooks-guide',
      title: 'Mastering React Hooks',
      likes: 12
    },
    {
      author: 'Kent C. Dodds',
      url: 'https://example.com/testing-react-apps',
      title: 'Testing React Applications',
      likes: 7
    },
    {
      author: 'Evan You',
      url: 'https://example.com/vue-essentials',
      title: 'Vue Essentials for Beginners',
      likes: 4
    }
  ]

  for (const blogData of blogSeeds) {
    await Blog.findOrCreate({
      where: { url: blogData.url },
      defaults: {
        ...blogData,
        userId: user.id
      }
    })
  }

  console.log(
    `Seeding complete. User ${userCreated ? 'created' : 'already existed'}: ${user.username}`
  )
}

seed()
  .catch((error) => {
    console.error('Seeding failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await sequelize.close()
  })
