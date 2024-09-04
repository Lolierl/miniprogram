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

    bubbles: [],
    bubbleText1:'',
    bubbleText2:'',
    bubbleText3:'',
    bubbleText4:'',
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

    this.findbubbleText1();
    this.findbubbleText2();
    this.findbubbleText3();
    this.findbubbleText4();
  },

  onShow: function() {
    // 页面显示时调用函数，触发气泡特效
    this.triggerBubblesForUserB();
  },

  getCurrentUserNum: function() {
    return wx.getStorageSync('userInfo').num;
  },

  loadChatMessages: async function(currentUserNum, otherUserNum) {
    const db = wx.cloud.database();
    const _ = db.command;
    const BATCH_SIZE = 20; // 每次获取的记录数
    let allMessages = [];  // 存储所有消息
    let skip = 0;          // 从第几条记录开始获取
    let hasMore = true;    // 是否还有更多记录

    while (hasMore) {
        try {
            const res = await db.collection('messages').where(
              _.or([
                { senderNum: currentUserNum, receiverNum: otherUserNum },
                { senderNum: otherUserNum, receiverNum: currentUserNum }
              ])
            ).orderBy('timestamp', 'asc')
             .skip(skip)
             .limit(BATCH_SIZE)
             .get();

            if (res.data.length > 0) {
                allMessages = allMessages.concat(res.data);
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
    this.setData({ chatMessages: allMessages }); // 更新聊天消息
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
    const options = {
      otherUserNum: this.data.otherUserNum
    };
    this.onLoad(options); 
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
    const options = {
      otherUserNum: this.data.otherUserNum
    };
    this.onLoad(options); 
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
    const options = {
      otherUserNum: this.data.otherUserNum
    };
    this.onLoad(options); 
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
    const options = {
      otherUserNum: this.data.otherUserNum
    };
    this.onLoad(options); 
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
        const firstChar = content.charAt(0);
        this.setData({
          firstChar1: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  findbubbleText1(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    db.collection('Phrase').where({ userNum: currentUserNum, num: 1 }).get().then(res => {
      if (res.data.length > 0) {
        const content = res.data[0].textContent;
        if (content && content.length > 0) {
          // 取整个textContent
          this.setData({
            bubbleText1: content
          });
        }
      }
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
        const firstChar = content.charAt(0);
        this.setData({
          firstChar2: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  findbubbleText2(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    db.collection('Phrase').where({ userNum: currentUserNum, num: 2 }).get().then(res => {
      if (res.data.length > 0) {
        const content = res.data[0].textContent;
        if (content && content.length > 0) {
          // 取整个textContent
          this.setData({
            bubbleText2: content
          });
        }
      }
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
        const firstChar = content.charAt(0);
        this.setData({
          firstChar3: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  findbubbleText3(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    db.collection('Phrase').where({ userNum: currentUserNum, num: 3 }).get().then(res => {
      if (res.data.length > 0) {
        const content = res.data[0].textContent;
        if (content && content.length > 0) {
          // 取整个textContent
          this.setData({
            bubbleText3: content
          });
        }
      }
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
        const firstChar = content.charAt(0);
        this.setData({
          firstChar4: firstChar
        });
    }}
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  findbubbleText4(){
    const db = wx.cloud.database();
    const currentUserNum = this.getCurrentUserNum();
    db.collection('Phrase').where({ userNum: currentUserNum, num: 4 }).get().then(res => {
      if (res.data.length > 0) {
        const content = res.data[0].textContent;
        if (content && content.length > 0) {
          // 取整个textContent
          this.setData({
            bubbleText4: content
          });
        }
      }
    }).catch(err => {
      console.error('查询失败:', err);
    });
  },

  // 口头禅气泡
  createBubbles1() {
    const db = wx.cloud.database();
    const bubbles = this.data.bubbles;
    const text = this.data.bubbleText1;
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


  createBubbles2() {
    const db = wx.cloud.database();
    const bubbles = this.data.bubbles;
    const text = this.data.bubbleText2;
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

  createBubbles3() {
    const db = wx.cloud.database();
    const bubbles = this.data.bubbles;
    const text = this.data.bubbleText3;
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
    const text = this.data.bubbleText4;
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
      left: `${Math.random() * 60}% `,
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