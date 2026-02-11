const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const app = require('../index')
const { connectToDatabase, sequelize, User, Session, Blog } = require('../models')

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

const createBlogWithToken = async (token, suffix) =>
  request(app)
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send({
      author: 'Session Author',
      url: `https://example.com/${suffix}`,
      title: `Session title ${suffix}`,
      likes: 0
    })

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

test('POST /api/login fails for disabled user', async () => {
  const username = `login_disabled_${Date.now()}`
  await User.create({
    name: 'Disabled Login User',
    username,
    disabled: true
  })

  try {
    const response = await request(app)
      .post('/api/login')
      .send({
        username,
        password: 'secret'
      })

    assert.equal(response.status, 401)
    assert.match(response.body.error, /invalid username or password/i)
  } finally {
    await User.destroy({ where: { username } })
  }
})

test('DELETE /api/logout invalidates the current token', async () => {
  const unique = Date.now()
  const { user, token } = await createUserAndLogin(`logout_one_${unique}`, 'Logout User')

  try {
    const logoutResponse = await request(app)
      .delete('/api/logout')
      .set('Authorization', `Bearer ${token}`)

    assert.equal(logoutResponse.status, 204)

    const postLogoutResponse = await createBlogWithToken(token, `logout-one-${unique}`)
    assert.equal(postLogoutResponse.status, 401)
    assert.match(postLogoutResponse.body.error, /token invalid/i)
  } finally {
    await Blog.destroy({
      where: {
        url: `https://example.com/logout-one-${unique}`
      }
    })
    await User.destroy({ where: { id: user.id } })
  }
})

test('DELETE /api/logout invalidates only the provided session token', async () => {
  const unique = Date.now()
  const username = `logout_scope_${unique}`
  await User.create({ username, name: 'Logout Scope User' })

  try {
    const loginA = await request(app)
      .post('/api/login')
      .send({ username, password: 'secret' })
    const loginB = await request(app)
      .post('/api/login')
      .send({ username, password: 'secret' })

    assert.equal(loginA.status, 200)
    assert.equal(loginB.status, 200)

    const tokenA = loginA.body.token
    const tokenB = loginB.body.token

    const logoutResponse = await request(app)
      .delete('/api/logout')
      .set('Authorization', `Bearer ${tokenA}`)

    assert.equal(logoutResponse.status, 204)

    const invalidatedResponse = await createBlogWithToken(tokenA, `logout-scope-a-${unique}`)
    assert.equal(invalidatedResponse.status, 401)

    const stillValidResponse = await createBlogWithToken(tokenB, `logout-scope-b-${unique}`)
    assert.equal(stillValidResponse.status, 201)
  } finally {
    await Blog.destroy({ where: { url: `https://example.com/logout-scope-a-${unique}` } })
    await Blog.destroy({ where: { url: `https://example.com/logout-scope-b-${unique}` } })
    await User.destroy({ where: { username } })
  }
})

test('valid JWT without active session is rejected for protected routes', async () => {
  const unique = Date.now()
  const { user, token } = await createUserAndLogin(`session_missing_${unique}`, 'Session Missing User')

  try {
    await Session.destroy({ where: { token } })
    const response = await createBlogWithToken(token, `session-missing-${unique}`)

    assert.equal(response.status, 401)
    assert.match(response.body.error, /token invalid/i)
  } finally {
    await Blog.destroy({
      where: {
        url: `https://example.com/session-missing-${unique}`
      }
    })
    await User.destroy({ where: { id: user.id } })
  }
})

test('disabled user token is rejected immediately on protected routes', async () => {
  const unique = Date.now()
  const { user, token } = await createUserAndLogin(`disabled_token_${unique}`, 'Disabled Token User')

  try {
    await User.update({ disabled: true }, { where: { id: user.id } })
    const response = await createBlogWithToken(token, `disabled-token-${unique}`)

    assert.equal(response.status, 401)
    assert.match(response.body.error, /token invalid/i)
  } finally {
    await Blog.destroy({
      where: {
        url: `https://example.com/disabled-token-${unique}`
      }
    })
    await User.destroy({ where: { id: user.id } })
  }
})
