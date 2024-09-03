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
          return {
            ...chat_users,
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
// const db = wx.cloud.database();
// Page({
//   data: {
//     chatList: [],
//     friendList: [] // 用于存储好友列表
//   },

//   onLoad: function() {
//     this.loadFriendList(); // 首先加载好友列表
//   },

//   loadFriendList: function() {
//     let _ = db.command
//     let acount = wx.getStorageSync('userinfo').num
//     db.collection("chat_users").where(
//       _.or([
//         {
//           Auser: acount
//         },
//         {
//           Buser: acount
//         }
//       ])
//     ).where({
//       status:1
//     }).get().then(res=>{
//       console.log(res)
//       this.setData({
//         friendList:res.data
//       })
//     });
//     this.loadChatList(); // 确保 this 仍指向 Page 对象
  
// },

// loadChatList: function() {
//   const currentUserNum = wx.getStorageSync('userinfo').num;

//   db.collection('chats').where(
//     db.command.or([
//       { firstNum: currentUserNum },
//       { secondNum: currentUserNum }
//     ])
//   ).orderBy('lastMessageTime', 'desc').get().then(res => {
//     console.log('Chat List:', res.data); // 调试输出
//     const chatListPromises = res.data.filter(chat => {
//       return this.data.friendList.includes(chat.firstNum) || this.data.friendList.includes(chat.secondNum);
//     }).map(chat => {
//       let otherUserNum;
      
//       if (chat.firstNum === currentUserNum) {
//         otherUserNum = chat.secondNum;
//       } else {
//         otherUserNum = chat.firstNum;
//       }

//       return this.fetchUserInfo(otherUserNum).then(otherUserInfo => {
//         return {
//           ...chat,
//           otherUserInfo: otherUserInfo
//         };
//       });
//     });

//     Promise.all(chatListPromises).then(chatList => {
//       this.setData({
//         chatList: chatList
//       });
//     }).catch(console.error);
//   }).catch(console.error);
// },

//   fetchUserInfo: function(num) {
//     const db = wx.cloud.database();
//     return db.collection('login_users').where({ num: num }).get().then(res => {
//       if (res.data.length > 0) {
//         return res.data[0];
//       }
//       return {};
//     }).catch(console.error);
//   },

//   navigateToMessage: function(e) {
//     const otherUserNum = e.currentTarget.dataset.otherusernum;
//     wx.navigateTo({
//       url: `/pages/message/message?otherUserNum=${otherUserNum}`
//     });
//   }
// });