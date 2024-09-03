// pages/friends/friends.js
const db = wx.cloud.database();
Page({
  data: {
    friends:[],
    myphone1:""
  },

  toAddfriends(){
    wx.navigateTo({
      url: '/pages/addfriends/addfriends',
    })
  },

  toNewfriends(){
    wx.navigateTo({
      url: '/pages/newfriends/newfriends',
    }); 
  },
  navigateToMessage: function(e) {
    const otherUserNum = e.currentTarget.dataset.otherusernum;
    wx.navigateTo({
      url: `/pages/message/message?otherUserNum=${otherUserNum}`
    })
  }, 

  onLoad(options) {
    this.getfriends()
    const myphone1 = wx.getStorageSync('userInfo').phone;
    this.setData({
      myphone0:myphone1
    })
  }, 
  onShow(options) {
    this.getfriends()
    const myphone1 = wx.getStorageSync('userInfo').phone;
    this.setData({
      myphone0:myphone1
    })
  }, 
  

  //获取已添加好友
  getfriends(){
    let _ = db.command
    let acount = wx.getStorageSync('userinfo').num
    db.collection("chat_users").where(
      _.or([
        {
          Auser: acount
        },
        {
          Buser: acount
        }
      ])
    ).where({
      status:1
    }).get().then(res=>{
      console.log(res)
      console.log(res)
      this.setData({
        friends:res.data
      })
    })
  },

  // 跳转聊天页面
  navigateToMessage: function(e) {
    const otherUserNum = e.currentTarget.dataset.otherusernum;
    wx.navigateTo({
      url: `/pages/message/message?otherUserNum=${otherUserNum}`
    });
  },
  






    // var self = this;
    // const friendsList = [
    //   { num: 1, faceImg: '/image/friends_no.png', nickName: 'Alice', admin: true, password: '1234' },
    //   { num: 2, faceImg: '/image/friends_yes.png', nickName: 'Bob', admin: false, password: '5678' },
    //   { num: 3, faceImg: '/image/me_no.png', nickName: 'Charlie', admin: true, password: 'abcd' }
    // ]
    // wx.cloud.database().collection('chat_users').get({
      
    //   success(res) {
    //     console.log(res)
    //     self.setData({
    //       //friends: res.data
    //       friends:friendsList
    //     });
    //   },
    //   fail: function (err) {
    //     console.error('获取通讯录失败', err);
    //     wx.showToast({
    //       title: '获取通讯录失败',
    //       icon: 'none'
    //     });
    //   }
    // });
  

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