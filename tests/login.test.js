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
