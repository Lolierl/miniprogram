// pages/message/message.js
Page({
  data: {
    chatMessages: [],
    messageText: '',
    messageLength: 0, 
    scrolledToTop: false, 
    scrollMessageId: '', 
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
    bubbles: [],
  },

  onLoad: function(options) {
    const currentUserNum = this.getCurrentUserNum(); // 获取当前用户的 num
    const otherUserNum = Number(options.otherUserNum);
    const db = wx.cloud.database();
    const _ = db.command;
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
    this.loadChatMessages(currentUserNum, otherUserNum, 0, false, true);
    this.messageWatcher = db.collection('messages').where(
      _.or([
        { senderNum: currentUserNum, receiverNum: otherUserNum },
        { senderNum: otherUserNum, receiverNum: currentUserNum }
      ])
    ).watch({
      onChange: snapshot => {
        this.loadChatMessages(currentUserNum, otherUserNum, 0, false, false);
      }, 
      onError: (err) => { // onError 必须是一个函数
        console.error('Message watcher error:', err);
      }})
      this.notificationWatcher = db.collection('notifications').where(
        _.or([
          { userNum: otherUserNum, chatUserNum: currentUserNum },
          { chatUserNum: otherUserNum, userNum: currentUserNum }
        ])
      ).watch({
        onChange: snapshot => {
          this.loadChatMessages(currentUserNum, otherUserNum, 0, false, false);
        }, 
        onError: (err) => { // onError 必须是一个函数
          console.error('Message watcher error:', err);
        }})
    this.extractFirstChar1();
    this.extractFirstChar2();
    this.extractFirstChar3();
    this.extractFirstChar4();
    this.phraseMsgWatcher = db.collection('PhraseMsg').where(
      _.or([
        { num1: currentUserNum, num2: otherUserNum },
        { num1: otherUserNum, num2: currentUserNum }
      ])
    ).watch({
      onChange: snapshot => {
        this.triggerBubblesForUserB();
      }, 
      onError: (err) => { // onError 必须是一个函数
        console.error('Message watcher error:', err);
      }})
  },
  onUnload: function() {
    if (this.messageWatcher) {
      this.messageWatcher.close();
    }
    if(this.notificationWatcher){
      this.notificationWatcher.close();
    }
    if(this.phraseMsgWatcher){
      this.phraseMsgWatcher.close(); 
    }
  }, 
  onShow: function() {
    // 页面显示时调用函数，触发气泡特效
    this.triggerBubblesForUserB();
  },

  getCurrentUserNum: function() {
    return wx.getStorageSync('userInfo').num;
  },

  loadChatMessages: async function(currentUserNum, otherUserNum, addLength, scrollToTop, scrollToBottom) {
    const db = wx.cloud.database();
    const _ = db.command;
    const BATCH_SIZE = 20; // 每次获取的记录数
    let allMessages = [], skip = 0; 
    let hasMore = true;    // 是否还有更多记录
    let scrollMessageId = ''; 
    const currentLength = this.data.messageLength; 
    db.collection('notifications').where({
      userNum: currentUserNum,
      chatUserNum: otherUserNum,
      isRead: false
    }).update({
      data: {
        isRead: true
      }
    })
    if(scrollToTop)
    {
      const chatMessages = this.data.chatMessages
      if(chatMessages.length > 0)scrollMessageId = "message-" + chatMessages[0]._id
    }
    const notificationsRes = await db.collection('notifications').where({
      userNum: otherUserNum,    // 聊天对象用户
      chatUserNum: currentUserNum,  // 当前用户
      isRead: false               // 未读消息
    }).get();
    const unreadMessageIds = notificationsRes.data.map(notification => notification.messageId);
    while(hasMore)
    {
      try {
        // 获取最后 BATCH_SIZE 条记录，并根据 skip 加载更多
        const res = await db.collection('messages').where(
          _.or([
            { senderNum: currentUserNum, receiverNum: otherUserNum },
            { senderNum: otherUserNum, receiverNum: currentUserNum }
          ])
        ).orderBy('timestamp', 'desc') // 按时间降序排序
        .skip(skip)  // 跳过之前已经加载的消息
        .limit(BATCH_SIZE)  // 每次加载 BATCH_SIZE 条
        .get();
        if (res.data.length > 0) {
            res.data.forEach(message => {
                message.isUnread = unreadMessageIds.includes(message._id);
            });
            // 将新获取的消息插入到现有消息之前
            allMessages = res.data.reverse().concat(allMessages);
            skip += res.data.length;
            if(skip >= currentLength + addLength)
              break; 
            // 如果获取的消息数小于 BATCH_SIZE，表示没有更多记录
            if (res.data.length < BATCH_SIZE) {
                hasMore = false;
            }
        } else {
            hasMore = false;
        }
      } catch (error) {
        console.error(error);
        hasMore = false; // 如果发生错误，停止加载
      } 
    }
    if(!hasMore)
      await this.setData({scrolledToTop: true})
    if(scrollToTop)
      await this.setData({messageLength: skip})
    this.setData({
      chatMessages: allMessages, 
    }, () => {
      if (scrollToBottom && allMessages.length > 0) {
          scrollMessageId = "message-" + allMessages[allMessages.length - 1]._id
      }
      if(scrollToBottom || scrollToTop)this.setData({
        scrollMessageId: scrollMessageId
      })
    });
  }, 
  onInput: function(e) {
    this.setData({ messageText: e.detail.value });
  },
  sendMessage: async function(e) {
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
    }).then(res => {
      this.updateChat(messageText, res._id).then(() => {
        this.setData({ messageText: '' });
        /*const options = {
          otherUserNum: this.data.otherUserNum
        };
        this.onLoad(options); */
      })
    }).catch(console.error);
  },
  onScrollToUpper: function() {
    // 监听滚动到顶部事件，加载更多消息
    if(!this.data.scrolledToTop)
    {
      const { currentUserNum, otherUserNum} = this.data;
      this.loadChatMessages(currentUserNum, otherUserNum, 20, true, false);
    }
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
    }).then(res => {
      this.updateChat('[New Image]', res._id)
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
  replyWithImage: async function(messageId, imageFileID) {
    const { currentUserNum, otherUserNum } = this.data;
    const db = wx.cloud.database();
    // 发送回复的图片
    const res = await db.collection('messages').add({
      data: {
        senderNum: currentUserNum,
        receiverNum: otherUserNum,
        message: imageFileID,
        messageType: 'image',
        imageStatus: 'new image', 
        timestamp: Date.now()
      }
    });

    // 更新原先图片的状态为 "replied message"
    await db.collection('messages').doc(messageId).update({
      data: {
        imageStatus: 'replied message'
      }
    });

    // 更新聊天记录
    await this.updateChat('[New Image]', res._id);

    // 重新加载页面数据
    /*const options = {
      otherUserNum: this.data.otherUserNum
    };
    this.onLoad(options); */
  },
  navigateBack: function() {
    wx.navigateBack();
  },

  updateChat: async function(lastMessage, lastMessageId) {
    const db = wx.cloud.database();
    const { currentUserNum, otherUserNum } = this.data;
  
    return db.collection('chat_users').where({
      $or: [
        { Auser: currentUserNum, Buser: otherUserNum },
        { Auser: otherUserNum, Buser: currentUserNum }
      ]
    }).get().then(res => {
      if (res.data.length > 0) {
        // 先添加通知
        return db.collection('notifications').add({
          data: {
            userNum: otherUserNum,
            chatUserNum: currentUserNum, 
            messageId: lastMessageId,
            isRead: false
          }
        }).then(() => {
          // 更新 chat_users 集合中的信息
          return db.collection('chat_users').doc(res.data[0]._id).update({
            data: {
              lastMessage: lastMessage,
              lastMessageTime: Date.now()
            }
          });
        });
      } else {
        throw new Error('No matching chat_users found');
      }
    });
  }, 

  // 修改口头禅
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
          const firstChar = res.content.charAt(0);
          this.setData({
            firstChar1: firstChar
          });
          db.collection('Phrase').where({ num: 1, userNum:currentUserNum}).count().then(countRes => {
            if (countRes.total > 0) {
              // 如果记录存在，则更新
              db.collection('Phrase').where({ num: 1, userNum:currentUserNum}).update({
                data: {
                  textContent:this.data.textContent1,
                },
              });
            } else {
              // 如果记录不存在，则新增
              db.collection('Phrase').add({
                data: {
                  num: 1,
                  textContent: this.data.textContent1,
                  userNum: currentUserNum, 
                },
              });
            }
          });
        }
        
      }
    });
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
          const firstChar = res.content.charAt(0);
          this.setData({
            firstChar2: firstChar
          });
          db.collection('Phrase').where({ num: 2, userNum:currentUserNum}).count().then(countRes => {
            if (countRes.total > 0) {
              // 如果记录存在，则更新
              db.collection('Phrase').where({ num: 2, userNum:currentUserNum}).update({
                data: {
                  textContent:this.data.textContent2,
                },
              });
            } else {
              // 如果记录不存在，则新增
              db.collection('Phrase').add({
                data: {
                  num: 2,
                  textContent: this.data.textContent2,
                  userNum: currentUserNum, 
                },
              });
            }
          });
        }
      }
    });
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
          const firstChar = res.content.charAt(0);
          this.setData({
            firstChar3: firstChar
          });
          db.collection('Phrase').where({ num: 3, userNum:currentUserNum}).count().then(countRes => {
            if (countRes.total > 0) {
              // 如果记录存在，则更新
              db.collection('Phrase').where({ num: 3, userNum:currentUserNum}).update({
                data: {
                  textContent:this.data.textContent3,
                },
              });
            } else {
              // 如果记录不存在，则新增
              db.collection('Phrase').add({
                data: {
                  num: 3,
                  textContent: this.data.textContent3,
                  userNum: currentUserNum, 
                },
              });
            }
          });
        }
      }
    });
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
          const firstChar = res.content.charAt(0);
          this.setData({
            firstChar4: firstChar
          });
          db.collection('Phrase').where({ num: 4, userNum:currentUserNum}).count().then(countRes => {
            if (countRes.total > 0) {
              // 如果记录存在，则更新
              db.collection('Phrase').where({ num: 4, userNum:currentUserNum}).update({
                data: {
                  textContent:this.data.textContent4,
                },
              });
            } else {
              // 如果记录不存在，则新增
              db.collection('Phrase').add({
                data: {
                  num: 4,
                  textContent: this.data.textContent4,
                  userNum: currentUserNum, 
                },
              });
            }
          });
        }
      }
    });
  },

  // 查找口头禅内容
  extractFirstChar1(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    db.collection('Phrase').where({ userNum: currentUserNum, num:1 }).get().then(res => {
      if (res.data.length > 0) {
      const content = res.data[0].textContent;
      if (content && content.length > 0) {
        // 取第一个字
        
        this.setData({
          textContent1: content
        });
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
    db.collection('Phrase').where({ userNum: currentUserNum, num:2 }).get().then(res => {
      if (res.data.length > 0) {
      const content = res.data[0].textContent;
      if (content && content.length > 0) {
        // 取第一个字
        this.setData({
          textContent2: content
        });
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
    db.collection('Phrase').where({ userNum: currentUserNum, num:3 }).get().then(res => {
      if (res.data.length > 0) {
      const content = res.data[0].textContent;
      if (content && content.length > 0) {
        // 取第一个字
        this.setData({
          textContent3: content
        });
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
    db.collection('Phrase').where({ userNum: currentUserNum, num:4 }).get().then(res => {
      if (res.data.length > 0) {
      const content = res.data[0].textContent;
      if (content && content.length > 0) {
        // 取第一个字
        this.setData({
          textContent4: content
        });
        const firstChar = content.charAt(0);
        this.setData({
          firstChar4: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  // 口头禅气泡
  createBubbles1() {
    const db = wx.cloud.database();
    const bubbles = this.data.bubbles;
    const text = this.data.textContent1;
    const userA = this.data.currentUserNum;// 发出者的信息
    const userB = this.data.otherUserNum; // 用户B的信息
  
    if (!text) {
      wx.showToast({
        title: '口头禅为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    for (let i = 0; i < 2; i++) {
      const bubble = {
        left: `${Math.random() * 90}% `,
        duration: Math.random() * 2 + 1,
        text1: text
      };
      bubbles.push(bubble);
    }
    this.setData({ bubbles });
  
    // 将信息存入数据库，并记录当前时间
    const currentTime = new Date().toISOString();
    db.collection('PhraseMsg').add({
      data: {
        num1: userA,
        num2: userB,
        bubblecontent: text,
        status: 0,
        time: currentTime
      },
      success: res => {
        console.log('气泡信息存入数据库成功', res);
      },
      fail: err => {
        console.error('气泡信息存入数据库失败', err);
      }
    });
  
    setTimeout(() => {
      this.setData({ bubbles: [] });
    }, 9000);
  },


  createBubbles2() {
    const db = wx.cloud.database();
    const bubbles = this.data.bubbles;
    const text = this.data.textContent2;
    const userA = this.data.currentUserNum;// 发出者的信息
    const userB = this.data.otherUserNum; // 用户B的信息
  
    if (!text) {
      wx.showToast({
        title: '口头禅为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    for (let i = 0; i < 2; i++) {
      const bubble = {
        left: `${Math.random() * 90}% `,
        duration: Math.random() * 2 + 1,
        text1: text
      };
      bubbles.push(bubble);
    }
    this.setData({ bubbles });
  
    // 将信息存入数据库，并记录当前时间
    const currentTime = new Date().toISOString();
    db.collection('PhraseMsg').add({
      data: {
        num1: userA,
        num2: userB,
        bubblecontent: text,
        status: 0,
        time: currentTime
      },
      success: res => {
        console.log('气泡信息存入数据库成功', res);
      },
      fail: err => {
        console.error('气泡信息存入数据库失败', err);
      }
    });
  
    setTimeout(() => {
      this.setData({ bubbles: [] });
    }, 9000);
  },

  createBubbles3() {
    const db = wx.cloud.database();
    const bubbles = this.data.bubbles;
    const text = this.data.textContent3;
    const userA = this.data.currentUserNum;// 发出者的信息
    const userB = this.data.otherUserNum; // 用户B的信息
  
    if (!text) {
      wx.showToast({
        title: '口头禅为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    for (let i = 0; i < 2; i++) {
      const bubble = {
        left: `${Math.random() * 60}% `,
        duration: Math.random() * 2 + 1,
        text1: text
      };
      bubbles.push(bubble);
    }
    this.setData({ bubbles });
  
    // 将信息存入数据库，并记录当前时间
    const currentTime = new Date().toISOString();
    db.collection('PhraseMsg').add({
      data: {
        num1: userA,
        num2: userB,
        bubblecontent: text,
        status: 0,
        time: currentTime
      },
      success: res => {
        console.log('气泡信息存入数据库成功', res);
      },
      fail: err => {
        console.error('气泡信息存入数据库失败', err);
      }
    });
  
    setTimeout(() => {
      this.setData({ bubbles: [] });
    }, 9000);
  },
  
  createBubbles4() {
    const db = wx.cloud.database();
    const bubbles = this.data.bubbles;
    const text = this.data.textContent4;
    const userA = this.data.currentUserNum;// 发出者的信息
    const userB = this.data.otherUserNum; // 用户B的信息
  
    if (!text) {
      wx.showToast({
        title: '口头禅为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    for (let i = 0; i < 2; i++) {
      const bubble = {
        left: `${Math.random() * 80}% `,
        duration: Math.random() * 2 + 1,
        text1: text
      };
      bubbles.push(bubble);
    }
    this.setData({ bubbles });
  
    // 将信息存入数据库，并记录当前时间
    const currentTime = new Date().toISOString();
    db.collection('PhraseMsg').add({
      data: {
        num1: userA,
        num2: userB,
        bubblecontent: text,
        status: 0,
        time: currentTime
      },
      success: res => {
        console.log('气泡信息存入数据库成功', res);
      },
      fail: err => {
        console.error('气泡信息存入数据库失败', err);
      }
    });
  
    setTimeout(() => {
      this.setData({ bubbles: [] });
    }, 9000);
  },


  // 用户B进入聊天页面时触发的函数
triggerBubblesForUserB() {
  const db = wx.cloud.database();
  const userBNum = this.data.currentUserNum; // 用户B的num

  // 查询数据库中num2与用户B的num相同且status为0的数据，按时间顺序排列
  db.collection('PhraseMsg')
    .where({
      num2: userBNum,
      status: 0
    })
    .orderBy('time', 'asc') // 按时间升序排列
    .get({
      success: res => {
        if (res.data.length > 0) {
          // 遍历查询结果，依次触发气泡特效
          res.data.forEach(phraseMsg => {
            this.showBubblesForUserB(phraseMsg.bubblecontent);

            // 删除数据库中对应记录
            db.collection('PhraseMsg').doc(phraseMsg._id).remove({
              success: removeRes => {
                console.log('删除记录成功', removeRes);
              },
              fail: removeErr => {
                console.error('删除记录失败', removeErr);
              }
            });
          });
        }
      },
      fail: err => {
        console.error('查询失败', err);
      }
    });
},

// 显示气泡特效的函数
showBubblesForUserB(bubbleContent) {
  const bubbles = this.data.bubbles;
  for (let i = 0; i < 2; i++) {
    const bubble = {
      left: `${Math.random() * 80}% `,
      duration: Math.random() * 2 + 1,
      text1: bubbleContent
    };
    bubbles.push(bubble);
  }
  this.setData({ bubbles });

  setTimeout(() => {
    this.setData({ bubbles: [] });
  }, 50000);
}

});