app.service('User2', {
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
