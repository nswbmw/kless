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

    app.load(path.join(__dirname, 'service'))
    app.load(path.join(__dirname, 'service2/User2.js'))
    app.load(path.join(__dirname, 'controller'))
    app.load(path.join(__dirname, 'route'))

    assert.deepStrictEqual(typeof app.service.User, 'object')
    assert.deepStrictEqual(typeof app.service.User.getUserById, 'function')
    assert.deepStrictEqual(typeof app.service.User2.getUserById, 'function')
    assert.deepStrictEqual(app.service.User3, undefined)
    assert.deepStrictEqual(typeof app.controller.User, 'object')
    assert.deepStrictEqual(typeof app.controller.User.getUserById, 'function')
    assert.deepStrictEqual(typeof app.route['User.getUserById'], 'function')

    const res = await request(app.callback())
      .get('/User.getUserById?uid=123', {
        json: true
      })
      .expect(200)

    assert.deepStrictEqual(res.body, {
      id: 123,
      name: '123'
    })
  })

  describe('.route()', function () {
    it('index', async function () {
      const app = new Kless()
      app.route({
        name: 'index',
        controller: async (ctx, next) => {
          ctx.body = 'This is index page'
        }
      })
      let res = await request(app.callback())
        .get('/')
        .expect(200)
      assert.deepStrictEqual(res.text, 'This is index page')

      let res2 = await request(app.callback())
        .get('/index')
        .expect(200)
      assert.deepStrictEqual(res2.text, 'This is index page')
    })

    it('route is function', async function () {
      const app = new Kless()
      app.route({
        name: 'User.getUserById',
        controller: async (ctx, next) => {
          ctx.body = ctx.query.uid
        }
      })
      let res = await request(app.callback())
        .get('/User.getUserById?uid=123')
        .expect(200)
      assert.deepStrictEqual(res.text, '123')

      // 404
      res = await request(app.callback())
        .get('/User.getUserById2')
        .expect(404)
      assert.deepStrictEqual(res.text, 'Not Found')
    })

    it('route is an array of functions', async function () {
      const app = new Kless()
      app.route({
        name: 'User.getUserById',
        controller: [
          async (ctx, next) => {
            ctx.body = ctx.query.uid
            return next()
          },
          async (ctx, next) => {
            ctx.body += ctx.query.uid
          }
        ]
      })
      const res = await request(app.callback())
        .get('/User.getUserById?uid=123')
        .expect(200)

      assert.deepStrictEqual(res.text, '123123')
    })

    it('route with validator middleware', async function () {
      const app = new Kless()
      const bodyparser = require('koa-bodyparser')

      app.use(bodyparser())
      app.route({
        name: 'User.createUser',
        controller: [
          app.middleware.validator({
            body: {
              user: { type: 'string', required: true },
              age: { type: 'number' }
            }
          }),
          async (ctx, next) => {
            ctx.body = ctx.request.body
          }
        ]
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
      app.route({
        name: 'User.createUser',
        controller: [
          app.middleware.validator({
            body: {
              email: { type: email }
            }
          }),
          async (ctx, next) => {
            ctx.body = ctx.request.body
          }
        ]
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

  describe('.controller()', function () {
    it('controller is function', async function () {
      const app = new Kless()

      app.controller('User.getUserById', (ctx) => {
        ctx.body = ctx.query.uid
      })
      app.route({
        name: 'User.getUserById',
        controller: app.controller.User.getUserById
      })
      let res = await request(app.callback())
        .get('/User.getUserById?uid=123')
        .expect(200)
      assert.deepStrictEqual(res.text, '123')
    })

    it('controller is object', async function () {
      const app = new Kless()

      app.controller('User', {
        getUserById (ctx) {
          ctx.body = ctx.query.uid
        }
      })
      app.route({
        name: 'User.getUserById',
        controller: app.controller.User.getUserById
      })
      let res = await request(app.callback())
        .get('/User.getUserById?uid=123')
        .expect(200)
      assert.deepStrictEqual(res.text, '123')
    })
  })

  describe('.service()', function () {
    it('service is function', async function () {
      const app = new Kless()

      app.service('User.getUserById', async (uid) => {
        return uid
      })
      app.route({
        name: 'User.getUserById',
        controller: async (ctx, next) => {
          ctx.body = await app.service.User.getUserById(ctx.query.uid)
        }
      })
      let res = await request(app.callback())
        .get('/User.getUserById?uid=123')
        .expect(200)
      assert.deepStrictEqual(res.text, '123')
    })

    it('service is object', async function () {
      const app = new Kless()

      app.service('User', {
        async getUserById (uid) {
          return uid
        }
      })
      app.route({
        name: 'User.getUserById',
        controller: async (ctx, next) => {
          ctx.body = await app.service.User.getUserById(ctx.query.uid)
        }
      })
      let res = await request(app.callback())
        .get('/User.getUserById?uid=123')
        .expect(200)
      assert.deepStrictEqual(res.text, '123')
    })
  })

  describe('.middleware()', function () {
    it('middleware is function', async function () {
      const app = new Kless()

      app.middleware('checkLogin', async (ctx) => {
        ctx.throw(401, 'Please login')
      })
      app.route({
        name: 'User.getUserById',
        controller: [
          app.middleware.checkLogin,
          async (ctx, next) => {
            ctx.body = ctx.query.uid
          }
        ]
      })
      let res = await request(app.callback())
        .get('/User.getUserById?uid=123')
        .expect(401)
      assert.deepStrictEqual(res.text, 'Please login')
    })

    it('middleware is object', async function () {
      const app = new Kless()

      app.middleware('Auth', {
        async checkLogin (ctx) {
          ctx.throw(401, 'Please login')
        }
      })
      app.route({
        name: 'User.getUserById',
        controller: [
          app.middleware.Auth.checkLogin,
          async (ctx, next) => {
            ctx.body = ctx.query.uid
          }
        ]
      })
      let res = await request(app.callback())
        .get('/User.getUserById?uid=123')
        .expect(401)
      assert.deepStrictEqual(res.text, 'Please login')
    })
  })

  it('.Types', async function () {
    const app = new Kless()

    assert.deepStrictEqual(typeof Kless.Types.Number, 'function')
    assert.deepStrictEqual(typeof app.Types.Number, 'function')
  })

  it('404', async function () {
    const app = new Kless()

    const res = await request(app.callback())
      .post('/')
      .expect(404)
    assert.deepStrictEqual(res.text, 'Not Found')
  })
})
