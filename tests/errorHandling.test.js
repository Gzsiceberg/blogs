const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../index')
const { connectToDatabase, sequelize, Blog, User } = require('../models')
let testUserUsername
let authToken

test.before(async () => {
  await connectToDatabase()

  testUserUsername = `blog_error_user_${Date.now()}`
  await User.create({
    name: 'Blog Error User',
    username: testUserUsername
  })

  const loginResponse = await request(app)
    .post('/api/login')
    .send({
      username: testUserUsername,
      password: 'secret'
    })

  authToken = loginResponse.body.token
})

test.after(async () => {
  await User.destroy({ where: { username: testUserUsername } })
  await sequelize.close()
})

test('POST /api/blogs returns 400 via error middleware for invalid url', async () => {
  const response = await request(app)
    .post('/api/blogs')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      author: 'Test Author',
      url: '   ',
      title: 'Valid title',
      likes: 0
    })

  assert.equal(response.status, 400)
  assert.match(response.body.error, /url/i)
})

test('PUT /api/blogs/:id returns 400 via error middleware for invalid likes', async () => {
  const blog = await Blog.create({
    author: 'Test Author',
    url: 'https://example.com/test-blog',
    title: 'Blog for invalid likes update',
    likes: 0
  })

  try {
    const response = await request(app)
      .put(`/api/blogs/${blog.id}`)
      .send({
        likes: -1
      })

    assert.equal(response.status, 400)
    assert.match(response.body.error, /likes/i)
  } finally {
    await blog.destroy()
  }
})
