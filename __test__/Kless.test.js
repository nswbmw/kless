const path = require('path')
const assert = require('assert')

const Kless = require('../Kless')
const request = require('supertest')

describe('Kless', function () {
  it('.load()', async function () {
    const app = global.app = new Kless()
    try {
      app.load('abc')
    } catch (e) {
      assert.deepStrictEqual(e.code, 'ENOENT')
    }

    app.load(path.join(__dirname, 'handlers'))

    const res = await request(app.callback())
      .get('/User.getUserById?id=123')
      .expect(200)

    assert.deepStrictEqual(res.text, '123')
  })

  describe('.register()', function () {
    it('handler is function', async function () {
      const app = new Kless()
      app.register({
        name: 'User.getUserById',
        handler: async (ctx, next) => {
          ctx.body = ctx.query.id
        }
      })
      let res = await request(app.callback())
        .get('/User.getUserById?id=123')
        .expect(200)
      assert.deepStrictEqual(res.text, '123')

      // 404
      res = await request(app.callback())
        .get('/User.getUserById2')
        .expect(404)
      assert.deepStrictEqual(res.text, 'Not Found')
    })

    it('handler is array of function', async function () {
      const app = new Kless()
      app.register({
        name: 'User.getUserById',
        handler: [
          async (ctx, next) => {
            ctx.body = ctx.query.id
            return next()
          },
          async (ctx, next) => {
            ctx.body += ctx.query.id
          }
        ]
      })
      const res = await request(app.callback())
        .get('/User.getUserById?id=123')
        .expect(200)

      assert.deepStrictEqual(res.text, '123123')
    })

    it('validate', async function () {
      const app = new Kless()
      const bodyparser = require('koa-bodyparser')

      app.use(bodyparser())
      app.register({
        name: 'User.createUser',
        validate: {
          body: {
            user: { type: 'string', required: true },
            age: { type: 'number' }
          }
        },
        handler: async (ctx, next) => {
          ctx.body = ctx.request.body
        }
      })

      let res = await request(app.callback())
        .post('/User.createUser')
        .expect(400)
      assert.deepStrictEqual(res.text, '($.body.user: undefined) ✖ (required: true)')

      res = await request(app.callback())
        .post('/User.createUser')
        .send({ user: 'nswbmw', age: 18 })
        .expect(200)
      assert.deepStrictEqual(res.body, { user: 'nswbmw', age: 18 })

      res = await request(app.callback())
        .post('/User.createUser')
        .send({ user: 'nswbmw', age: '18' })
        .expect(400)
      assert.deepStrictEqual(res.text, '($.body.age: "18") ✖ (type: number)')
    })

    it('validate with customize error', async function () {
      const app = new Kless()
      const bodyparser = require('koa-bodyparser')

      const email = (actual, key, parent) => {
        if (/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(actual)) {
          return true
        }
        throw new Error('E-mail format is incorrect!')
      }

      app.use(bodyparser())
      app.register({
        name: 'User.createUser',
        validate: {
          body: {
            email: { type: email }
          }
        },
        handler: async (ctx, next) => {
          ctx.body = ctx.request.body
        }
      })

      let res = await request(app.callback())
        .post('/User.createUser')
        .send({ email: '123' })
        .expect(400)
      assert.deepStrictEqual(res.text, 'E-mail format is incorrect!')

      res = await request(app.callback())
        .post('/User.createUser')
        .send({ email: '123@aa.bb' })
        .expect(200)
      assert.deepStrictEqual(res.body, { email: '123@aa.bb' })
    })
  })

  it('404', async function () {
    const app = new Kless()

    const res = await request(app.callback())
      .post('/')
      .expect(404)
    assert.deepStrictEqual(res.text, 'Not Found')
  })
})
