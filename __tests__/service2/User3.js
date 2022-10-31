app.service('User3', {
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
