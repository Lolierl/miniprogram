// pages/message/message.js
Page({
  data: {
    chatMessages: [],
    messageText: '',
    currentUserNum: null, // 本人 num
    otherUserNum: null,   // 对方 num
    otherUserInfo: null,
  },

  onLoad: function(options) {
    const currentUserNum = this.getCurrentUserNum(); // 获取当前用户的 num
    const otherUserNum = Number(options.otherUserNum);
    const db = wx.cloud.database();
    this.setData({
      currentUserNum: currentUserNum,
      otherUserNum: otherUserNum
    });  
    db.collection('login_users').where({
      num: otherUserNum
    }).get().then(res => {
      if (res.data.length > 0) {
        this.setData({ otherUserInfo: res.data[0] });
      }
    });
    this.loadChatMessages(currentUserNum, otherUserNum);
  },

  // 获取当前用户的 num，假设从本地存储获取
  getCurrentUserNum: function() {
    return wx.getStorageSync('userInfo').num;
  },

  // 加载聊天记录
  loadChatMessages: function(currentUserNum, otherUserNum) {
    const db = wx.cloud.database();
    db.collection('messages').where(
      wx.cloud.database().command.or([
        { senderNum: currentUserNum, receiverNum: otherUserNum },
        { senderNum: otherUserNum, receiverNum: currentUserNum }
      ])
    ).orderBy('timestamp', 'asc').get().then(res => {
      this.setData({
        chatMessages: res.data
      });
    }).catch(console.error);
  },
  onInput: function(e) {
    this.setData({
      messageText: e.detail.value // 更新 messageText 为输入框的当前值
    });
  },
  // 发送消息
  sendMessage: function(e) {
    const currentUserNum = this.data.currentUserNum; // 获取当前用户的 num
    const otherUserNum = this.data.otherUserNum;
    const messageText = this.data.messageText;
    const db = wx.cloud.database();
    if (!messageText.trim()) {
      wx.showToast({
        title: 'Message cannot be empty',
        icon: 'none'
      });
      return;
    }
    console.log('Current User Num:', currentUserNum);
    console.log('Other User Num:', otherUserNum);
    console.log('Message Text:', messageText);

    db.collection('messages').add({
      data: {
        senderNum: currentUserNum,
        receiverNum: otherUserNum,
        message: messageText,
        timestamp: Date.now()
      }
    }).then(() => {
      this.updateChat(messageText);
      this.loadChatMessages(currentUserNum, otherUserNum);
      this.setData({ messageText: '' }); // 清空输入框
    }).catch(console.error);
  },
  navigateBack: function() {
    wx.navigateBack();
  },
  // 更新聊天记录
  updateChat: function(lastMessage) {
    const db = wx.cloud.database();
    const currentUserNum = this.data.currentUserNum;
    const otherUserNum = this.data.otherUserNum;
    db.collection('chats').where({
      firstNum: Math.min(currentUserNum, otherUserNum),
      secondNum: Math.max(currentUserNum, otherUserNum)
    }).get().then(res => {
      if (res.data.length > 0) {
        db.collection('chats').doc(res.data[0]._id).update({
          data: {
            lastMessage: lastMessage,
            lastMessageTime: Date.now()
          }
        }).then(console.log).catch(console.error);
      } else {
        db.collection('chats').add({
          data: {
            firstNum: Math.min(currentUserNum, otherUserNum),
            secondNum: Math.max(currentUserNum, otherUserNum),
            lastMessage: lastMessage,
            lastMessageTime: Date.now()
          }
        }).then(console.log).catch(console.error);
      }
    }).catch(console.error);
  }
});