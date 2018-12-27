## Kless

A framework inspired by FaaS, based on `koa`.

### Installation

```sh
$ npm i @nswbmw/kless --save
```

### Scaffold

see [create-kless-app](https://github.com/nswbmw/create-kless-app).

### Example

```js
const Kless = require('@nswbmw/kless')
const app = new Kless()

app.register({
  name: 'User.getUserById',
  handler: async (ctx, next) => {
    ctx.body = ctx.query.id
  }
})

app.listen(3000)

/*
$ curl localhost:3000/User.getUserById?id=123
123
*/
```

**Validator**

```js
const Kless = require('@nswbmw/kless')
const app = new Kless()

app.register({
  name: 'User.getUserById',
  validate: {
    query: {
      id: { type: Kless.Types.Number, required: true }
    }
  },
  handler: async (ctx, next) => {
    ctx.body = ctx.query.id
  }
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

**Array handlers**

```js
const bodyParser = require('koa-bodyparser')
const Kless = require('@nswbmw/kless')
const app = new Kless()

app.register({
  name: 'User.createUser',
  handler: [
    bodyParser(),
    async (ctx, next) => {
      ctx.body = ctx.request.body
    }
  ]
})

app.listen(3000)
```

### Test

```sh
$ npm test (coverage 100%)
```

### License

MIT
