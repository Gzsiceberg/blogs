const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../index')
const { connectToDatabase, sequelize, Blog, User } = require('../models')

const createUserAndLogin = async (username, name) => {
  await User.create({ username, name })
  const loginResponse = await request(app)
    .post('/api/login')
    .send({ username, password: 'secret' })

  assert.equal(loginResponse.status, 200)
  assert.equal(typeof loginResponse.body.token, 'string')
  assert.ok(loginResponse.body.token.length > 0)

  return loginResponse.body.token
}

test.before(async () => {
  await connectToDatabase()
})

test.after(async () => {
  await sequelize.close()
})

test('POST /api/blogs returns 400 via error middleware for invalid url', async () => {
  const username = `blog_error_user_${Date.now()}`
  const token = await createUserAndLogin(username, 'Blog Error User')

  try {
    const response = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        author: 'Test Author',
        url: '   ',
        title: 'Valid title',
        likes: 0
      })

    assert.equal(response.status, 400)
    assert.match(response.body.error, /url/i)
  } finally {
    await User.destroy({ where: { username } })
  }
})

test('POST /api/blogs returns 400 with clear message for invalid year', async () => {
  const username = `blog_year_user_${Date.now()}`
  const token = await createUserAndLogin(username, 'Blog Year User')
  const invalidYear = new Date().getFullYear() + 1

  try {
    const response = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        author: 'Test Author',
        url: 'https://example.com/invalid-year',
        title: 'Invalid year blog',
        likes: 0,
        year: invalidYear
      })

    assert.equal(response.status, 400)
    assert.match(response.body.error, /year must be between 1991 and/i)
  } finally {
    await User.destroy({ where: { username } })
  }
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
      .send({ likes: -1 })

    assert.equal(response.status, 400)
    assert.match(response.body.error, /likes/i)
  } finally {
    await blog.destroy()
  }
})

test('POST /api/blogs links new blog to logged-in user', async () => {
  const username = `blog_auth_${Date.now()}`
  const token = await createUserAndLogin(username, 'Blog Auth User')

  let createdBlogId
  try {
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

test('GET /api/blogs filters by title or author with case-insensitive search', async () => {
  const titleMatchBlog = await Blog.create({
    author: 'Search Author',
    url: `https://example.com/jami-title-${Date.now()}`,
    title: 'Learning Jami Patterns',
    likes: 2
  })

  const authorMatchBlog = await Blog.create({
    author: 'Jami Dev',
    url: `https://example.com/jami-author-${Date.now()}`,
    title: 'Frontend Testing Notes',
    likes: 3
  })

  const nonMatchingBlog = await Blog.create({
    author: 'Another Author',
    url: `https://example.com/non-jami-${Date.now()}`,
    title: 'Vue Basics',
    likes: 1
  })

  try {
    const response = await request(app).get('/api/blogs?search=jami')

    assert.equal(response.status, 200)
    const returnedIds = response.body.map((blog) => blog.id)
    assert.ok(returnedIds.includes(titleMatchBlog.id))
    assert.ok(returnedIds.includes(authorMatchBlog.id))
    assert.ok(!returnedIds.includes(nonMatchingBlog.id))
  } finally {
    await Blog.destroy({ where: { id: titleMatchBlog.id } })
    await Blog.destroy({ where: { id: authorMatchBlog.id } })
    await Blog.destroy({ where: { id: nonMatchingBlog.id } })
  }
})

test('GET /api/authors returns aggregated author stats ordered by likes', async () => {
  const unique = Date.now()
  const topAuthor = `author_top_${unique}`
  const secondAuthor = `author_second_${unique}`

  const topBlogA = await Blog.create({
    author: topAuthor,
    url: `https://example.com/${unique}-top-a`,
    title: 'Top author first article',
    likes: 700000
  })

  const topBlogB = await Blog.create({
    author: topAuthor,
    url: `https://example.com/${unique}-top-b`,
    title: 'Top author second article',
    likes: 600000
  })

  const secondBlog = await Blog.create({
    author: secondAuthor,
    url: `https://example.com/${unique}-second`,
    title: 'Second author article',
    likes: 400000
  })

  try {
    const response = await request(app).get('/api/authors')

    assert.equal(response.status, 200)
    assert.ok(Array.isArray(response.body))

    const topAuthorStats = response.body.find((entry) => entry.author === topAuthor)
    const secondAuthorStats = response.body.find((entry) => entry.author === secondAuthor)

    assert.ok(topAuthorStats)
    assert.ok(secondAuthorStats)
    assert.equal(Number(topAuthorStats.articles), 2)
    assert.equal(Number(topAuthorStats.likes), 1300000)
    assert.equal(Number(secondAuthorStats.articles), 1)
    assert.equal(Number(secondAuthorStats.likes), 400000)

    const topIndex = response.body.findIndex((entry) => entry.author === topAuthor)
    const secondIndex = response.body.findIndex((entry) => entry.author === secondAuthor)
    assert.ok(topIndex >= 0)
    assert.ok(secondIndex >= 0)
    assert.ok(topIndex < secondIndex)
  } finally {
    await Blog.destroy({ where: { id: topBlogA.id } })
    await Blog.destroy({ where: { id: topBlogB.id } })
    await Blog.destroy({ where: { id: secondBlog.id } })
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

  const ownerToken = await createUserAndLogin(ownerUsername, 'Owner User')
  const otherToken = await createUserAndLogin(otherUsername, 'Other User')

  let createdBlogId
  try {
    const createResponse = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        author: 'Owner',
        url: 'https://example.com/owned-blog',
        title: 'Owned blog',
        likes: 0
      })

    createdBlogId = createResponse.body.id

    const forbiddenDelete = await request(app)
      .delete(`/api/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${otherToken}`)

    assert.equal(forbiddenDelete.status, 403)

    const ownerDelete = await request(app)
      .delete(`/api/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${ownerToken}`)

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
