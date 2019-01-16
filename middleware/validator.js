const AJS = require('another-json-schema')

module.exports = function (schema) {
  const compiledSchema = AJS(schema)
  return function validatorMiddleware (ctx, next) {
    const result = compiledSchema.validate(ctx.request, { additionalProperties: true })
    if (result.valid) {
      return next()
    }
    const error = result.error.originError || result.error
    error.schema = ctx.path.slice(1)
    ctx.throw(result.error.status || result.error.statusCode || 400, error)
  }
}
