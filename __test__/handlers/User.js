app.register({
  name: 'User.getUserById',
  handler: async (ctx, next) => {
    ctx.body = ctx.query.id
  }
})
