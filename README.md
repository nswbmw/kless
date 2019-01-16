## Kless

A MVC framework inspired by FaaS, based on `koa`.

### Installation

```sh
$ npm i @nswbmw/kless --save
```

### Scaffold

see [create-kless-app](https://github.com/nswbmw/create-kless-app).

### Example

**simple**

```js
const Kless = require('@nswbmw/kless')
const app = new Kless()

app.route({
  name: 'User.getUserById',
  controller: async (ctx, next) => {
    ctx.body = ctx.query.id
  }
})

app.listen(3000)

/*
$ curl localhost:3000/User.getUserById?id=123
123
*/
```

**complex**

```js
const Kless = require('@nswbmw/kless')
const app = new Kless()

app.service('User', {
  async getUserById (uid) {
    return this.randomUser(uid)
  },

  async randomUser (uid) {
    return {
      uid,
      name: Date.now(),
      age: Math.floor(Math.random() * 100)
    }
  }
})

app.controller('User.getUserById', async function getUserById (ctx, next) {
  ctx.body = await app.service.User.getUserById(ctx.query.id)
})

app.route({
  name: 'User.getUserById',
  controller: app.controller.User.getUserById
})

app.listen(3000)

/*
$ curl localhost:3000/User.getUserById?id=123
{"uid":"123","name":1547619443338,"age":18}
*/
```

**Validator**

```js
const Kless = require('@nswbmw/kless')
const app = new Kless()

app.route({
  name: 'User.getUserById',
  controller: [
    app.middleware.validator({
      query: {
        id: { type: Kless.Types.Number, required: true }
      }
    }),
    async (ctx, next) => {
      ctx.body = ctx.query.id
    }
  ]
})

app.listen(3000)

/*
$ curl localhost:3000/User.getUserById
($.query.id: undefined) ✖ (required: true)
$ curl localhost:3000/User.getUserById?id=test
($.query.id: "test") ✖ (type: Number)
$ curl localhost:3000/User.getUserById?id=123
123
*/
```

More validators usage see [another-json-schema](https://github.com/nswbmw/another-json-schema).

**Array controllers**

```js
const bodyParser = require('koa-bodyparser')
const Kless = require('@nswbmw/kless')
const app = new Kless()

app.route({
  name: 'User.createUser',
  controller: [
    bodyParser(),
    async (ctx, next) => {
      ctx.body = ctx.request.body
    }
  ]
})

app.listen(3000)
```

### API

**app.middleware(name, fn)**
**app.middleware(name, obj)**

- name(String): middleware name.
- fn(Function)|obj(Object): middleware function or object.

**app.route(obj)**

- name(String): route name, mapping to a router, eg: User.createUser -> /User.createUser.
- controller(Function|AsyncFunction|[Function|AsyncFunction]): router controller.

**app.controller(name, fn)**
**app.controller(name, obj)**

- name(String): controller name.
- fn(Function)|obj(Object): controller function or object.

**app.service(name, fn)**
**app.service(name, obj)**

- name(String): service name.
- fn(Function)|obj(Object): service function or object.

**NB**: When use object as service's second parameter, you can use `this` in function that reference to `obj`.

### Test

```sh
$ npm test (coverage 100%)
```

### License

MIT
