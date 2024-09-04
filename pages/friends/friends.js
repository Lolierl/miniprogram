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
  async getfriends() {
    const db = wx.cloud.database();
    let _ = db.command;
    const BATCH_SIZE = 20; // 每次获取的记录数
    let acount = wx.getStorageSync('userinfo').num;
    let allFriends = [];  // 存储所有符合条件的好友
    let skip = 0;         // 从第几条记录开始获取
    let hasMore = true;   // 是否还有更多记录

    while (hasMore) {
        try {
            const res = await db.collection("chat_users").where(
              _.or([
                { Auser: acount },
                { Buser: acount }
              ])
            ).where({
              status: 1
            }).skip(skip).limit(BATCH_SIZE).get();

            if (res.data.length > 0) {
                allFriends = allFriends.concat(res.data);
                skip += BATCH_SIZE;
                if (res.data.length < BATCH_SIZE) {
                    hasMore = false; // 没有更多记录了
                }
            } else {
                hasMore = false; // 没有更多记录了
            }
        } catch (error) {
            console.error(error);
            hasMore = false; // 如果发生错误，停止循环
        }
    }

    this.setData({
        friends: allFriends
    });
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