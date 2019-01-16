/**
 * @api {get} /User.getUserById 获取用户基本信息
 * @apiVersion 1.0.0
 * @apiName getUserById
 * @apiGroup User
 *
 * @apiParam (query) {String} uid 用户 id
 *
 * @apiSuccessExample Success:
 * {
 *   "ok": true,
 *   "data": { ... },
 *   "version": "1.0.0",
 *   "now": "2018-03-12T07:14:10.214Z"
 * }
 */
app.route({
  name: 'User.getUserById',
  controller: [
    app.middleware.validator({
      query: {
        uid: { type: app.Types.Number, required: true }
      }
    }),
    app.controller.User.getUserById
  ]
})
