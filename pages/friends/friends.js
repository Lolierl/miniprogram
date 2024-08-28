// pages/friends/friends.js
Page({
  data: {
    friends:[]
  },

  onLoad(options) {
    this.getUsers()
  }, 
  getUsers(){
    var self = this;
    const friendsList = [
      { num: 1, faceImg: '/image/friends_no.png', nickName: 'Alice', admin: true, password: '1234' },
      { num: 2, faceImg: '/image/friends_yes.png', nickName: 'Bob', admin: false, password: '5678' },
      { num: 3, faceImg: '/image/me_no.png', nickName: 'Charlie', admin: true, password: 'abcd' }
    ]
    wx.cloud.database().collection('chat_users').get({
      
      success(res) {
        console.log(res)
        self.setData({
          //friends: res.data
          friends:friendsList
        });
      },
      fail: function (err) {
        console.error('获取通讯录失败', err);
        wx.showToast({
          title: '获取通讯录失败',
          icon: 'none'
        });
      }
    });
  },

  onReady() {

  },

  onShow() {

  },

  onHide() {

  },

  onUnload() {

  },

  onPullDownRefresh() {

  },

  onReachBottom() {

  },
  onShareAppMessage() {

  }
})