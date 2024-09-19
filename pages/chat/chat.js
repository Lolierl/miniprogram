
Page({
  data: {
    chatList: []
  },

  onLoad: function() {
    const db = wx.cloud.database();
    let currentUserNum = wx.getStorageSync('userInfo').num
    this.loadChatList();
    this.chatWatcher = db.collection('chat_users').where(
        db.command.or([
          { Auser: currentUserNum },
          { Buser: currentUserNum }
      ])
    ).watch({
      onChange: snapshot => {
        this.loadChatList();
      }, 
      onError: (err) => { // onError 必须是一个函数
        console.error('Message watcher error:', err);
      }})
      this.notificationWatcher = db.collection('notifications').where(
        {userNum: currentUserNum, 
          isRead: false}
    ).watch({
      onChange: snapshot => {
        this.loadChatList();
      }, 
      onError: (err) => { // onError 必须是一个函数
        console.error('Message watcher error:', err);
      }})
  },
  onShow: function() {
    this.onLoad();
  },
  onPullDownRefresh() {
    this.loadChatList();
  },
  onUnload: function() {
    if (this.chatWatcher) {
      this.chatWatcher.close();
    }
    if(this.notificationWatcher){
      this.notificationWatcher.close();
    }
  }, 
  loadChatList: async function() {
    const db = wx.cloud.database();
    let currentUserNum = wx.getStorageSync('userInfo').num
    let skip = 0, BATCH_SIZE = 20, hasMore = true, res = []; 
    while(hasMore)
    {
      const result = await db.collection('chat_users').where(
      db.command.and([
        db.command.or([
          { Auser: currentUserNum },
          { Buser: currentUserNum }
        ]),
        { status: 1 }
      ])
    ).orderBy('lastMessageTime', 'desc')
    .skip(skip)  
    .limit(BATCH_SIZE)  
    .get()
    if (result.data.length < BATCH_SIZE) {
      hasMore = false;
    }
    res.push(...result.data)
    skip += BATCH_SIZE; 
    }

    const chatListPromises = res.map(chat_users => {
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
    wx.navigateTo({
      url: `/pages/message/message?otherUserNum=${otherUserNum}`
    });
  }
});