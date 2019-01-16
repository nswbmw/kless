app.controller('User.getUserById', async function getUserById (ctx, next) {
  ctx.body = await app.service.User.getUserById(ctx.query.uid)
})
