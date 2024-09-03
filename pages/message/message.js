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

  getCurrentUserNum: function() {
    return wx.getStorageSync('userInfo').num;
  },

  loadChatMessages: function(currentUserNum, otherUserNum) {
    const db = wx.cloud.database();
    db.collection('messages').where(
      wx.cloud.database().command.or([
        { senderNum: currentUserNum, receiverNum: otherUserNum },
        { senderNum: otherUserNum, receiverNum: currentUserNum }
      ])
    ).orderBy('timestamp', 'asc').get()
      .then(res => {
        console.log(res); // Log the entire response object
        this.setData({ chatMessages: res.data });
      })
      .catch(console.error);
  },
  onInput: function(e) {
    this.setData({ messageText: e.detail.value });
  },
  sendMessage: function(e) {
    const { currentUserNum, otherUserNum, messageText } = this.data;
    const db = wx.cloud.database();
    if (!messageText.trim()) {
      wx.showToast({ title: 'Message cannot be empty', icon: 'none' });
      return;
    }
    db.collection('messages').add({
      data: {
        senderNum: currentUserNum,
        receiverNum: otherUserNum,
        message: messageText,
        messageType: 'text', 
        timestamp: Date.now()
      }
    }).then(() => {
      this.updateChat(messageText);
      this.setData({ messageText: '' });
      const options = {
        otherUserNum: this.data.otherUserNum
      };
      this.onLoad(options); 
    }).catch(console.error);
  },
  chooseImage: function() {
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFilePaths[0];
        const cloudPath = `images/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}.png`;

        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: uploadRes => {
            this.sendImageMessage(uploadRes.fileID);
          },
          fail: e => {
            wx.showToast({
              icon: 'none',
              title: 'Upload failed',
            });
            console.error('[上传文件] 失败：', e);
          }
        });
      }
    });
  },

  // 发送图片消息
  sendImageMessage: function(imageFileID) {
    const { currentUserNum, otherUserNum } = this.data;
    const db = wx.cloud.database();

    db.collection('messages').add({
      data: {
        senderNum: currentUserNum,
        receiverNum: otherUserNum,
        message: imageFileID, // 这里存储的是图片的 fileID
        messageType: 'image', // 标识为图片消息
        imageStatus: 'new image', 
        timestamp: Date.now()
      }
    }).then(() => {
      this.updateChat('[New Image]');
      const options = {
        otherUserNum: this.data.otherUserNum
      };
      this.onLoad(options); 
    }).catch(console.error);
  },
  previewImage: function(e) {
    const currentImageUrl = e.currentTarget.dataset.src;
    console.log(currentImageUrl)
    wx.previewImage({
      current: currentImageUrl, // 当前显示图片的http链接
      urls: [currentImageUrl] // 需要预览的图片http链接列表
    });
  },

  // 处理"exchange"按钮点击
  exchangeImage: function(e) {
    const messageId = e.currentTarget.dataset.messageid;
    const db = wx.cloud.database();

    // 选择图片进行回复
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFilePaths[0];
        const cloudPath = `images/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}.png`;

        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: uploadRes => {
            this.replyWithImage(messageId, uploadRes.fileID);
          },
          fail: e => {
            wx.showToast({
              icon: 'none',
              title: 'Upload failed',
            });
            console.error('[上传文件] 失败：', e);
          }
        });
      }
    });
  },
  replyWithImage: function(messageId, imageFileID) {
    const { currentUserNum, otherUserNum } = this.data;
    const db = wx.cloud.database();
    // 发送回复的图片
    db.collection('messages').add({
      data: {
        senderNum: currentUserNum,
        receiverNum: otherUserNum,
        message: imageFileID,
        messageType: 'image',
        imageStatus: 'new image', 
        timestamp: Date.now()
      }
    }).then(() => {
      this.updateChat('[New Image]');
      // 更新原先图片的状态为"replied message"
      return db.collection('messages').doc(messageId).update({
        data: {
          imageStatus: 'replied message'
        }
      });
    }).then(() => {
      const options = {
        otherUserNum: this.data.otherUserNum
      };
      this.onLoad(options); 
    }).catch(console.error);
  },
  navigateBack: function() {
    wx.navigateBack();
  },

  updateChat: function(lastMessage) {
    const db = wx.cloud.database();
    const { currentUserNum, otherUserNum } = this.data;

    db.collection('chat_users').where({
      $or: [
        { Auser: currentUserNum, Buser: otherUserNum },
        { Auser: otherUserNum, Buser: currentUserNum }
      ]
    }).get().then(res => {
      db.collection('notifications').add({
        data: {
          userNum: otherUserNum,
          chatUserNum: currentUserNum, 
          messageId: res._id,
          isRead: false
        }})
        return db.collection('chat_users').doc(res.data[0]._id).update({
          data: {
            lastMessage: lastMessage,
            lastMessageTime: Date.now()
          }
        });
    }).then(console.log).catch(console.error);
}
});