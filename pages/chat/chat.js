// pages/chat/chat.js
Page({
  data: {
    chatList: []
  },

  onLoad: function() {
    this.loadChatList();
  },
  onShow: function() {
    this.loadChatList();
  },
  loadChatList: function() {
    const db = wx.cloud.database();
    let currentUserNum = wx.getStorageSync('userInfo').num
    db.collection('chat_users').where(
      db.command.or([
        { Auser: currentUserNum },
        { Buser: currentUserNum }
      ])
    ).orderBy('lastMessageTime', 'desc')
    .get().then(res => {
      console.log(res)
      const chatListPromises = res.data.map(chat_users => {
        let otherUserNum;
        
        // 判断谁是非本人的用户
        if (chat_users.Auser === currentUserNum) {
          otherUserNum = chat_users.Buser;
        } 
        else {
          otherUserNum = chat_users.Auser;
        }

        // 获取非本人的用户信息
        return this.fetchUserInfo(otherUserNum).then(otherUserInfo => {
          // 查询未读消息通知
          return db.collection('notifications').where({
            userNum: currentUserNum,    // 当前用户
            chatUserNum: otherUserNum,  // 聊天对象用户
            isRead: false               // 未读消息
          }).get().then(notificationRes => {
            return {
              ...chat_users,
              otherUserInfo: otherUserInfo, // 非本人的用户信息
              hasUnreadMessages: notificationRes.data.length > 0 // 判断是否有未读消息
            };
          });
        }); 
      });

      // 处理所有异步操作
      Promise.all(chatListPromises).then(chatList => {
        this.setData({
          chatList: chatList
        });
      }).catch(console.error);
    }).catch(console.error);
},

  fetchUserInfo: function(num) {
    const db = wx.cloud.database();
    return db.collection('login_users').where({ num: num }).get().then(res => {
      if (res.data.length > 0) {
        return res.data[0];
      }
      return {};
    }).catch(console.error);
  },

  navigateToMessage: function(e) {
    const currentUserNum = wx.getStorageSync('userInfo').num
    const otherUserNum = e.currentTarget.dataset.otherusernum;
    const db = wx.cloud.database();
    db.collection('notifications').where({
      userNum: currentUserNum,
      chatUserNum: otherUserNum,
      isRead: false
    }).update({
      data: {
        isRead: true
      }
    }).then(() => {
      wx.navigateTo({
        url: `/pages/message/message?otherUserNum=${otherUserNum}`
      });
    }).catch(console.error);
  }
});