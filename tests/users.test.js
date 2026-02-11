const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../index')
const { connectToDatabase, sequelize, User, Blog } = require('../models')

test.before(async () => {
  await connectToDatabase()
})

test.after(async () => {
  await sequelize.close()
})

test('POST /api/users creates user with Sequelize timestamps', async () => {
  const unique = Date.now()
  const username = `user_${unique}`
  const name = `Name ${unique}`

  try {
    const response = await request(app)
      .post('/api/users')
      .send({ name, username })

    assert.equal(response.status, 201)
    assert.equal(response.body.name, name)
    assert.equal(response.body.username, username)
    assert.ok(response.body.created_at)
    assert.ok(response.body.updated_at)
    assert.equal(response.body.passwordHash, undefined)
    assert.equal(response.body.password_hash, undefined)
  } finally {
    await User.destroy({ where: { username } })
  }
})

test('PUT /api/users/:username updates username and updated_at', async () => {
  const unique = Date.now()
  const originalUsername = `before_${unique}`
  const newUsername = `after_${unique}`
  const user = await User.create({
    name: 'Timestamp Test',
    username: originalUsername
  })

  const beforeUpdatedAt = new Date(user.updated_at).getTime()

  try {
    await new Promise((resolve) => setTimeout(resolve, 10))

    const response = await request(app)
      .put(`/api/users/${originalUsername}`)
      .send({ username: newUsername })

    assert.equal(response.status, 200)
    assert.equal(response.body.username, newUsername)
    assert.ok(response.body.created_at)
    assert.ok(response.body.updated_at)
    assert.equal(response.body.passwordHash, undefined)
    assert.equal(response.body.password_hash, undefined)

    const afterUpdatedAt = new Date(response.body.updated_at).getTime()
    assert.ok(afterUpdatedAt > beforeUpdatedAt)
  } finally {
    await User.destroy({ where: { username: originalUsername } })
    await User.destroy({ where: { username: newUsername } })
  }
})

test('GET /api/users includes blogs added by each user', async () => {
  const unique = Date.now()
  const username = `with_blog_${unique}`
  const user = await User.create({
    name: 'User With Blog',
    username
  })

  const blog = await Blog.create({
    author: 'User With Blog',
    url: `https://example.com/${unique}`,
    title: 'Blog from user listing test',
    likes: 1,
    userId: user.id
  })

  try {
    const response = await request(app).get('/api/users')
    assert.equal(response.status, 200)

    const fetchedUser = response.body.find((u) => u.id === user.id)
    assert.ok(fetchedUser)
    assert.ok(Array.isArray(fetchedUser.blogs))

    const fetchedBlog = fetchedUser.blogs.find((b) => b.id === blog.id)
    assert.ok(fetchedBlog)
    assert.equal(fetchedBlog.title, 'Blog from user listing test')
  } finally {
    await Blog.destroy({ where: { id: blog.id } })
    await User.destroy({ where: { id: user.id } })
  }
})
