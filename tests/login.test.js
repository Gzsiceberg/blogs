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

test('POST /api/login returns a token with valid credentials', async () => {
  const username = `login_ok_${Date.now()}`
  await User.create({
    name: 'Login User',
    username
  })

  try {
    const response = await request(app)
      .post('/api/login')
      .send({
        username,
        password: 'secret'
      })

    assert.equal(response.status, 200)
    assert.equal(response.body.username, username)
    assert.equal(typeof response.body.token, 'string')
    assert.ok(response.body.token.length > 0)
  } finally {
    await User.destroy({ where: { username } })
  }
})

test('POST /api/login fails with invalid password', async () => {
  const username = `login_bad_${Date.now()}`
  await User.create({
    name: 'Login User',
    username
  })

  try {
    const response = await request(app)
      .post('/api/login')
      .send({
        username,
        password: 'wrong'
      })

    assert.equal(response.status, 401)
    assert.match(response.body.error, /invalid username or password/i)
  } finally {
    await User.destroy({ where: { username } })
  }
})

test('POST /api/blogs links new blog to logged-in user', async () => {
  const username = `blog_auth_${Date.now()}`
  await User.create({
    name: 'Blog Auth User',
    username
  })

  let createdBlogId
  try {
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        username,
        password: 'secret'
      })

    const token = loginResponse.body.token
    const createResponse = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        author: 'Test Author',
        url: 'https://example.com/auth-blog',
        title: 'Auth blog',
        likes: 0
      })

    assert.equal(createResponse.status, 201)
    assert.ok(createResponse.body.userId)

    createdBlogId = createResponse.body.id

    const listResponse = await request(app).get('/api/blogs')
    const createdBlog = listResponse.body.find((blog) => blog.id === createdBlogId)

    assert.ok(createdBlog)
    assert.equal(createdBlog.user.username, username)
  } finally {
    if (createdBlogId) {
      await Blog.destroy({ where: { id: createdBlogId } })
    }
    await User.destroy({ where: { username } })
  }
})

test('POST /api/blogs fails without token', async () => {
  const response = await request(app)
    .post('/api/blogs')
    .send({
      author: 'No Token',
      url: 'https://example.com/no-token',
      title: 'No token',
      likes: 0
    })

  assert.equal(response.status, 401)
  assert.match(response.body.error, /token missing/i)
})

test('DELETE /api/blogs/:id allows only the creator to delete', async () => {
  const ownerUsername = `owner_${Date.now()}`
  const otherUsername = `other_${Date.now()}`

  await User.create({
    name: 'Owner User',
    username: ownerUsername
  })
  await User.create({
    name: 'Other User',
    username: otherUsername
  })

  let createdBlogId
  try {
    const ownerLogin = await request(app)
      .post('/api/login')
      .send({ username: ownerUsername, password: 'secret' })
    const otherLogin = await request(app)
      .post('/api/login')
      .send({ username: otherUsername, password: 'secret' })

    const createResponse = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${ownerLogin.body.token}`)
      .send({
        author: 'Owner',
        url: 'https://example.com/owned-blog',
        title: 'Owned blog',
        likes: 0
      })

    createdBlogId = createResponse.body.id

    const forbiddenDelete = await request(app)
      .delete(`/api/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${otherLogin.body.token}`)

    assert.equal(forbiddenDelete.status, 403)

    const ownerDelete = await request(app)
      .delete(`/api/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${ownerLogin.body.token}`)

    assert.equal(ownerDelete.status, 204)
    createdBlogId = null
  } finally {
    if (createdBlogId) {
      await Blog.destroy({ where: { id: createdBlogId } })
    }
    await User.destroy({ where: { username: ownerUsername } })
    await User.destroy({ where: { username: otherUsername } })
  }
})
