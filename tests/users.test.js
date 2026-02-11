const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../index')
const { connectToDatabase, sequelize, User } = require('../models')

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
    assert.ok(afterUpdatedAt >= beforeUpdatedAt)
  } finally {
    await User.destroy({ where: { username: originalUsername } })
    await User.destroy({ where: { username: newUsername } })
  }
})
