// pages/chat/chat.js
Page({
  data: {
    chatList: []
  },

  onLoad: function() {
    this.loadChatList();
  },

  loadChatList: function() {
    const db = wx.cloud.database();
    const currentUserNum = this.data.currentUserNum; // 假设你已经获取到了当前用户的 num

    db.collection('chats').where(
      db.command.or([
        { firstNum: currentUserNum },
        { secondNum: currentUserNum }
      ])
    ).orderBy('lastMessageTime', 'desc').get().then(res => {
      const chatListPromises = res.data.map(chat => {
        let otherUserNum;
        
        // 判断谁是非本人的用户
        if (chat.firstNum === currentUserNum) {
          otherUserNum = chat.secondNum;
        } else {
          otherUserNum = chat.firstNum;
        }

        // 获取非本人的用户信息
        return this.fetchUserInfo(otherUserNum).then(otherUserInfo => {
          return {
            ...chat,
            otherUserInfo: otherUserInfo // 非本人的用户信息
          };
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
    const otherUserNum = e.currentTarget.dataset.otherusernum;
    wx.navigateTo({
      url: `/pages/message/message?otherUserNum=${otherUserNum}`
    });
  }
});