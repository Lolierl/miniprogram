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
    const currentUserNum = wx.getStorageSync('userInfo').num; // 获取当前用户的 num
    this.setData({
      currentUserNum: currentUserNum,
    });  
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
 getfriends: async function() {
    const db = wx.cloud.database();
    let _ = db.command;
    const BATCH_SIZE = 20; // 每次获取的记录数
    let acount = wx.getStorageSync('userInfo').num;
    let allFriends = [];  // 存储所有符合条件的好友
    let skip = 0;         // 从第几条记录开始获取
    let hasMore = true;   // 是否还有更多记录
    const currentUserNum = this.data.currentUserNum; 
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
                for (const chat_users of res.data) {
                  let otherUserNum;
                  
                  if (chat_users.Auser === currentUserNum) {
                    otherUserNum = chat_users.Buser;
                  } else {
                    otherUserNum = chat_users.Auser;
                  }
        
                  // 异步获取用户信息
                  const otherUserInfo = await db.collection('login_users').where({ num: otherUserNum }).get();
                  allFriends.push(otherUserInfo.data[0]); // 将用户信息添加到 allFriends 数组中
                }
                
                if (res.data.length < BATCH_SIZE) {
                      hasMore = false; // 没有更多记录了
                }
            } else {
                hasMore = false; // 没有更多记录了
            }
            skip += BATCH_SIZE;
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