const path = require('path')
const assert = require('assert')

const Koa = require('@nswbmw/koa')
const compose = require('koa-compose')
const objectPath = require('object-path')
const AJS = require('another-json-schema')
const requireDirectory = require('require-directory')

const validatorMiddleware = require('./middleware/validator')

module.exports = class Kless extends Koa {
  constructor () {
    super()

    this.middleware('validator', validatorMiddleware)
  }

  load (fileOrDirPath) {
    if (fileOrDirPath.match(/\.js$/)) {
      // file
      if (path.isAbsolute(fileOrDirPath)) {
        require(fileOrDirPath)
      } else {
        require(path.join(path.dirname(module.parent.filename), fileOrDirPath))
      }
    } else {
      // dir
      if (path.isAbsolute(fileOrDirPath)) {
        requireDirectory(module, fileOrDirPath)
      } else {
        requireDirectory(module, path.join(path.dirname(module.parent.filename), fileOrDirPath))
      }
    }
  }

  middleware (name, fn) {
    assert(name && typeof name === 'string', 'middleware `name` required')
    assert(fn && (['object', 'function'].includes(typeof fn)), 'middleware second parameter should be a function or an object')

    objectPath.set(this.middleware, name, fn)
  }

  route (obj) {
    assert(typeof obj === 'object', 'route option should be an object')
    assert(typeof obj.name === 'string', 'route `name` required')
    assert(typeof obj.controller === 'function' || (Array.isArray(obj.controller) && obj.controller.every(ctr => typeof ctr === 'function')), 'route `controller` should be a function or an array of functions')

    const controllerFnArr = Array.isArray(obj.controller) ? obj.controller : [obj.controller]

    this.use((ctx, next) => {
      ctx.routeName = obj.name
      const fn = this.route[ctx.path.slice(1) || 'index']
      if (fn && typeof fn === 'function') {
        return fn(ctx, next)
      }
      return next()
    })
    this.route[obj.name] = compose(controllerFnArr)
  }

  controller (name, obj) {
    assert(name && typeof name === 'string', 'controller `name` required')
    assert(obj && (['object', 'function'].includes(typeof obj)), 'controller second parameter should be a function or an object')

    objectPath.set(this.controller, name, obj)
  }

  service (name, obj) {
    assert(name && typeof name === 'string', 'service `name` required')
    assert(obj && (['object', 'function'].includes(typeof obj)), 'service second parameter should be a function or an object')

    objectPath.set(this.service, name, obj)
  }

  get Types () {
    return AJS.Types
  }
}

module.exports.Types = AJS.Types
