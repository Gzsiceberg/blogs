const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../index')
const { connectToDatabase, sequelize, Blog, User, ReadingList } = require('../models')

const createUserAndLogin = async (username, name) => {
  const user = await User.create({ username, name })
  const loginResponse = await request(app)
    .post('/api/login')
    .send({ username, password: 'secret' })

  assert.equal(loginResponse.status, 200)
  assert.equal(typeof loginResponse.body.token, 'string')
  assert.ok(loginResponse.body.token.length > 0)

  return { user, token: loginResponse.body.token }
}

test.before(async () => {
  await connectToDatabase()
})

test.after(async () => {
  await sequelize.close()
})

test('POST /api/readinglists creates unread entry for token owner', async () => {
  const unique = Date.now()
  const { user, token } = await createUserAndLogin(`rl_create_${unique}`, 'Read List User')
  const blog = await Blog.create({
    author: 'Reading List',
    url: `https://example.com/reading-list-${unique}`,
    title: 'Reading List Post',
    likes: 0
  })

  try {
    const response = await request(app)
      .post('/api/readinglists')
      .set('Authorization', `Bearer ${token}`)
      .send({ blogId: blog.id, userId: user.id })

    assert.equal(response.status, 201)
    assert.equal(response.body.blogId, blog.id)
    assert.equal(response.body.userId, user.id)
    assert.equal(response.body.read, false)
  } finally {
    await ReadingList.destroy({ where: { blogId: blog.id, userId: user.id } })
    await Blog.destroy({ where: { id: blog.id } })
    await User.destroy({ where: { id: user.id } })
  }
})

test('POST /api/readinglists rejects creating entry for another user', async () => {
  const unique = Date.now()
  const { user: owner } = await createUserAndLogin(`rl_owner_${unique}`, 'Owner User')
  const { user: other, token: otherToken } = await createUserAndLogin(
    `rl_other_${unique}`,
    'Other User'
  )
  const blog = await Blog.create({
    author: 'Reading List',
    url: `https://example.com/reading-list-forbidden-${unique}`,
    title: 'Reading List Forbidden',
    likes: 0
  })

  try {
    const response = await request(app)
      .post('/api/readinglists')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ blogId: blog.id, userId: owner.id })

    assert.equal(response.status, 403)
  } finally {
    await ReadingList.destroy({ where: { blogId: blog.id, userId: owner.id } })
    await Blog.destroy({ where: { id: blog.id } })
    await User.destroy({ where: { id: owner.id } })
    await User.destroy({ where: { id: other.id } })
  }
})

test('POST /api/readinglists rejects duplicate user-blog pair', async () => {
  const unique = Date.now()
  const { user, token } = await createUserAndLogin(
    `rl_duplicate_${unique}`,
    'Duplicate User'
  )
  const blog = await Blog.create({
    author: 'Reading List',
    url: `https://example.com/reading-list-duplicate-${unique}`,
    title: 'Reading List Duplicate',
    likes: 0
  })

  const entry = await ReadingList.create({ blogId: blog.id, userId: user.id })

  try {
    const response = await request(app)
      .post('/api/readinglists')
      .set('Authorization', `Bearer ${token}`)
      .send({ blogId: blog.id, userId: user.id })

    assert.equal(response.status, 409)
    assert.match(response.body.error, /already in reading list/i)
  } finally {
    await ReadingList.destroy({ where: { id: entry.id } })
    await Blog.destroy({ where: { id: blog.id } })
    await User.destroy({ where: { id: user.id } })
  }
})

test('PUT /api/readinglists/:id marks entry as read for owner only', async () => {
  const unique = Date.now()
  const { user: owner, token: ownerToken } = await createUserAndLogin(
    `rl_put_owner_${unique}`,
    'Put Owner'
  )
  const { user: other, token: otherToken } = await createUserAndLogin(
    `rl_put_other_${unique}`,
    'Put Other'
  )
  const blog = await Blog.create({
    author: 'Reading List',
    url: `https://example.com/reading-list-put-${unique}`,
    title: 'Reading List Put',
    likes: 0
  })
  const entry = await ReadingList.create({ blogId: blog.id, userId: owner.id })

  try {
    const forbiddenResponse = await request(app)
      .put(`/api/readinglists/${entry.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ read: true })

    assert.equal(forbiddenResponse.status, 403)

    const successResponse = await request(app)
      .put(`/api/readinglists/${entry.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ read: true })

    assert.equal(successResponse.status, 200)
    assert.equal(successResponse.body.id, entry.id)
    assert.equal(successResponse.body.read, true)
  } finally {
    await ReadingList.destroy({ where: { id: entry.id } })
    await Blog.destroy({ where: { id: blog.id } })
    await User.destroy({ where: { id: owner.id } })
    await User.destroy({ where: { id: other.id } })
  }
})
