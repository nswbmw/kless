const AJS = require('another-json-schema')

module.exports = function (schema) {
  const compiledSchema = AJS(schema)
  return function validatorMiddleware (ctx, next) {
    const result = compiledSchema.validate(ctx.request, { additionalProperties: true })
    if (result.valid) {
      return next()
    }
    ctx.throw(result.error.status || result.error.statusCode || 400, result.error.originError || result.error)
  }
}
