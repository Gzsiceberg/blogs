const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../index')
const { connectToDatabase, sequelize, User, Blog, ReadingList } = require('../models')

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

test('GET /api/users/:id returns readings with join table metadata', async () => {
  const unique = Date.now()
  const user = await User.create({
    name: 'Reader User',
    username: `reader_user_${unique}`
  })

  const authoredBlog = await Blog.create({
    author: 'Reader User',
    url: `https://example.com/authored-${unique}`,
    title: 'Authored blog',
    likes: 2,
    userId: user.id
  })

  const readingBlog = await Blog.create({
    author: 'Another Author',
    url: `https://example.com/reading-${unique}`,
    title: 'Reading list blog',
    likes: 10
  })

  const readingEntry = await ReadingList.create({
    userId: user.id,
    blogId: readingBlog.id
  })

  try {
    const response = await request(app).get(`/api/users/${user.id}`)

    assert.equal(response.status, 200)
    assert.equal(response.body.id, user.id)

    assert.ok(Array.isArray(response.body.blogs))
    assert.ok(response.body.blogs.find((blog) => blog.id === authoredBlog.id))

    assert.ok(Array.isArray(response.body.readings))
    const reading = response.body.readings.find((entry) => entry.id === readingBlog.id)
    assert.ok(reading)
    assert.equal(reading.readinglist.id, readingEntry.id)
    assert.equal(reading.readinglist.read, false)
  } finally {
    await ReadingList.destroy({ where: { id: readingEntry.id } })
    await Blog.destroy({ where: { id: authoredBlog.id } })
    await Blog.destroy({ where: { id: readingBlog.id } })
    await User.destroy({ where: { id: user.id } })
  }
})

test('GET /api/users/:id filters readings by read query parameter', async () => {
  const unique = Date.now()
  const user = await User.create({
    name: 'Reader Filter User',
    username: `reader_filter_${unique}`
  })

  const unreadBlog = await Blog.create({
    author: 'Unread Author',
    url: `https://example.com/unread-${unique}`,
    title: 'Unread blog',
    likes: 0
  })

  const readBlog = await Blog.create({
    author: 'Read Author',
    url: `https://example.com/read-${unique}`,
    title: 'Read blog',
    likes: 0
  })

  const unreadEntry = await ReadingList.create({
    userId: user.id,
    blogId: unreadBlog.id,
    read: false
  })

  const readEntry = await ReadingList.create({
    userId: user.id,
    blogId: readBlog.id,
    read: true
  })

  try {
    const readResponse = await request(app).get(`/api/users/${user.id}?read=true`)
    assert.equal(readResponse.status, 200)
    assert.equal(readResponse.body.readings.length, 1)
    assert.equal(readResponse.body.readings[0].id, readBlog.id)
    assert.equal(readResponse.body.readings[0].readinglist.id, readEntry.id)

    const unreadResponse = await request(app).get(`/api/users/${user.id}?read=false`)
    assert.equal(unreadResponse.status, 200)
    assert.equal(unreadResponse.body.readings.length, 1)
    assert.equal(unreadResponse.body.readings[0].id, unreadBlog.id)
    assert.equal(unreadResponse.body.readings[0].readinglist.id, unreadEntry.id)
  } finally {
    await ReadingList.destroy({ where: { id: unreadEntry.id } })
    await ReadingList.destroy({ where: { id: readEntry.id } })
    await Blog.destroy({ where: { id: unreadBlog.id } })
    await Blog.destroy({ where: { id: readBlog.id } })
    await User.destroy({ where: { id: user.id } })
  }
})

test('GET /api/users/:id returns 400 for invalid read query', async () => {
  const unique = Date.now()
  const user = await User.create({
    name: 'Reader Invalid Query',
    username: `reader_invalid_${unique}`
  })

  try {
    const response = await request(app).get(`/api/users/${user.id}?read=maybe`)
    assert.equal(response.status, 400)
    assert.match(response.body.error, /read query must be true or false/i)
  } finally {
    await User.destroy({ where: { id: user.id } })
  }
})
