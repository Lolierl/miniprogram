Component({
  data: {
    selected: 0,
    color: "#7A7E83",
    selectedColor: "#3cc51f",
    "list": [
      {
        "pagePath": "friends/friends",
        "iconPath": "image/friends_no.png",
        "selectedIconPath": "image/friends_yes.png",
        "text": "friends"
      },
      {
        "pagePath": "me/me",
        "iconPath": "image/me_no.png",
        "selectedIconPath": "image/me_yes.png",
        "text": "me"
      }
    ]
  },
  attached() {
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({url})
      this.setData({
        selected: data.index
      })
    }
  }
})