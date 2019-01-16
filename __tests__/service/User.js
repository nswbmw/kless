app.service('User', {
  async getUserById (uid) {
    return this.randomUser(uid)
  },

  async randomUser (uid) {
    return {
      id: uid,
      name: String(uid)
    }
  }
})
