// pages/message/message.js
Page({
  data: {
    chatMessages: [],
    messageText: '',
    currentUserNum: null, // 本人 num
    otherUserNum: null,   // 对方 num
    otherUserInfo: null,

    textContent1: '',
    textContent2: '',
    textContent3: '',
    textContent4: '',
    firstChar1: '',
    firstChar2: '',
    firstChar3: '',
    firstChar4: '',
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

    this.extractFirstChar1();
    this.extractFirstChar2();
    this.extractFirstChar3();
    this.extractFirstChar4();


  },

  // 获取当前用户的 num，假设从本地存储获取
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
      .then(res => this.setData({ chatMessages: res.data }))
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
        return db.collection('chat_users').doc(res.data[0]._id).update({
          data: {
            lastMessage: lastMessage,
            lastMessageTime: Date.now()
          }
        });
    }).then(console.log).catch(console.error); 
  },

  changePhrase1(){
    const currentUserNum = this.getCurrentUserNum();
    const db = wx.cloud.database();
    wx.showModal({
      title: '请输入新口头禅',
      content: this.data.textContent1,
      editable: true,
      placeholderText: '请输入新文字',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            textContent1: res.content
          });

          db.collection('Phrase').where({ num: 1, userNum:currentUserNum}).count().then(countRes => {
            if (countRes.total > 0) {
              // 如果记录存在，则更新
              db.collection('Phrase').where({ num: 1 }).update({
                data: {
                  textContent:this.data.textContent1,
                },
                // success: function(updateRes) {
                //   console.log('更新成功', updateRes);
                // },
                // fail: function(updateErr) {
                //   console.error('更新失败', updateErr);
                // }
              });
            } else {
              // 如果记录不存在，则新增
              db.collection('Phrase').add({
                data: {
                  num: 1,
                  textContent: this.data.textContent1,
                  userNum: currentUserNum, 
                },
                // success: function(addRes) {
                //   console.log('新增成功', addRes);
                // },
                // fail: function(addErr) {
                //   console.error('新增失败', addErr);
                // }
              });
            }
          });
        }
      }
    });
    this.onLoad()
  },

  changePhrase2(){
    const currentUserNum = this.getCurrentUserNum();
    const db = wx.cloud.database();
    wx.showModal({
      title: '请输入新口头禅',
      content: this.data.textContent2,
      editable: true,
      placeholderText: '请输入新文字',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            textContent2: res.content
          });

          db.collection('Phrase').where({ num: 2, userNum:currentUserNum}).count().then(countRes => {
            if (countRes.total > 0) {
              // 如果记录存在，则更新
              db.collection('Phrase').where({ num: 2 }).update({
                data: {
                  textContent:this.data.textContent2,
                },
                // success: function(updateRes) {
                //   console.log('更新成功', updateRes);
                // },
                // fail: function(updateErr) {
                //   console.error('更新失败', updateErr);
                // }
              });
            } else {
              // 如果记录不存在，则新增
              db.collection('Phrase').add({
                data: {
                  num: 2,
                  textContent: this.data.textContent2,
                  userNum: currentUserNum, 
                },
                // success: function(addRes) {
                //   console.log('新增成功', addRes);
                // },
                // fail: function(addErr) {
                //   console.error('新增失败', addErr);
                // }
              });
            }
          });
        }
      }
    });
    this.onLoad()
  },

  changePhrase3(){
    const currentUserNum = this.getCurrentUserNum();
    const db = wx.cloud.database();
    wx.showModal({
      title: '请输入新口头禅',
      content: this.data.textContent3,
      editable: true,
      placeholderText: '请输入新文字',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            textContent3: res.content
          });

          db.collection('Phrase').where({ num: 3, userNum:currentUserNum}).count().then(countRes => {
            if (countRes.total > 0) {
              // 如果记录存在，则更新
              db.collection('Phrase').where({ num: 3 }).update({
                data: {
                  textContent:this.data.textContent3,
                },
                // success: function(updateRes) {
                //   console.log('更新成功', updateRes);
                // },
                // fail: function(updateErr) {
                //   console.error('更新失败', updateErr);
                // }
              });
            } else {
              // 如果记录不存在，则新增
              db.collection('Phrase').add({
                data: {
                  num: 3,
                  textContent: this.data.textContent3,
                  userNum: currentUserNum, 
                },
                // success: function(addRes) {
                //   console.log('新增成功', addRes);
                // },
                // fail: function(addErr) {
                //   console.error('新增失败', addErr);
                // }
              });
            }
          });
        }
      }
    });
    this.onLoad()
  },

  changePhrase4(){
    const currentUserNum = this.getCurrentUserNum();
    const db = wx.cloud.database();
    wx.showModal({
      title: '请输入新口头禅',
      content: this.data.textContent4,
      editable: true,
      placeholderText: '请输入新文字',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            textContent4: res.content
          });

          db.collection('Phrase').where({ num: 4, userNum:currentUserNum}).count().then(countRes => {
            if (countRes.total > 0) {
              // 如果记录存在，则更新
              db.collection('Phrase').where({ num: 4 }).update({
                data: {
                  textContent:this.data.textContent4,
                },
                // success: function(updateRes) {
                //   console.log('更新成功', updateRes);
                // },
                // fail: function(updateErr) {
                //   console.error('更新失败', updateErr);
                // }
              });
            } else {
              // 如果记录不存在，则新增
              db.collection('Phrase').add({
                data: {
                  num: 4,
                  textContent: this.data.textContent4,
                  userNum: currentUserNum, 
                },
                // success: function(addRes) {
                //   console.log('新增成功', addRes);
                // },
                // fail: function(addErr) {
                //   console.error('新增失败', addErr);
                // }
              });
            }
          });
        }
      }
    });
    this.onLoad()
  },

  extractFirstChar1(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    console.log(currentUserNum); 
    db.collection('Phrase').where({ userNum: currentUserNum, num:1 }).get().then(res => {
      if (res.data.length > 0) {
      const content = res.data[0].textContent;
      
      console.log(content)
      if (content && content.length > 0) {
        // 取第一个字
        const firstChar = content.charAt(0);
        this.setData({
          firstChar1: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  extractFirstChar2(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    console.log(currentUserNum); 
    db.collection('Phrase').where({ userNum: currentUserNum, num:2 }).get().then(res => {
      if (res.data.length > 0) {
      const content = res.data[0].textContent;
      
      console.log(content)
      if (content && content.length > 0) {
        // 取第一个字
        const firstChar = content.charAt(0);
        this.setData({
          firstChar2: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  extractFirstChar3(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    console.log(currentUserNum); 
    db.collection('Phrase').where({ userNum: currentUserNum, num:3 }).get().then(res => {
      if (res.data.length > 0) {
      const content = res.data[0].textContent;
      
      console.log(content)
      if (content && content.length > 0) {
        // 取第一个字
        const firstChar = content.charAt(0);
        this.setData({
          firstChar3: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  extractFirstChar4(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    console.log(currentUserNum); 
    db.collection('Phrase').where({ userNum: currentUserNum, num:4 }).get().then(res => {
      if (res.data.length > 0) {
      const content = res.data[0].textContent;
      
      console.log(content)
      if (content && content.length > 0) {
        // 取第一个字
        const firstChar = content.charAt(0);
        this.setData({
          firstChar4: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },


});