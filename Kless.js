const assert = require('assert')
const path = require('path')

const Koa = require('koa')
const requireDirectory = require('require-directory')
const AJS = require('another-json-schema')
const compose = require('koa-compose')
const objectPath = require('object-path')

module.exports = class Kless extends Koa {
  constructor () {
    super()

    this._handlers = Object.create(null)
  }

  load (dir) {
    if (path.isAbsolute(dir)) {
      requireDirectory(module, dir)
    } else {
      requireDirectory(module, path.join(path.dirname(module.parent.filename), dir))
    }
  }

  register (obj) {
    assert(typeof obj === 'object', 'register option should be an object')
    assert(typeof obj.name === 'string', '`name` required')
    assert(!obj.validate || typeof obj.validate === 'object', '`validate` should be an object')
    assert(typeof obj.handler === 'function' || Array.isArray(obj.handler), '`handler` should be a function or an array of functions')

    const handlerFnArr = Array.isArray(obj.handler) ? obj.handler : [obj.handler]
    if (obj.validate) {
      handlerFnArr.unshift(validatorMiddleware(obj.validate, obj.name))
    }

    this.use((ctx, next) => {
      const fn = objectPath.get(this._handlers, ctx.path.slice(1))
      if (fn && typeof fn === 'function') {
        return fn(ctx, next)
      }
      return next()
    })
    objectPath.set(this._handlers, obj.name, compose(handlerFnArr))
  }
}

function validatorMiddleware (schema, path) {
  const compiledSchema = AJS(path, schema)
  return (ctx, next) => {
    const result = compiledSchema.validate(ctx.request, { additionalProperties: true })
    if (result.valid) {
      return next()
    }
    ctx.throw(result.error.status || result.error.statusCode || 400, result.error.originError || result.error)
  }
}

module.exports.Types = AJS.Types
