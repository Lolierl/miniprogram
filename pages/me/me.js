Page({

  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      userInfo:wx.getStorageSync('userInfo')
    })
  },

  logout(){
    wx.showModal({
      title: '提示',
      content: '确定退出当前帐号吗？',
      success(res){
        if(res.confirm){
          wx.removeStorageSync('userInfo')
          wx.redirectTo({
            url: '/pages/index/index',
          })
        }
        else{
          console.log(123)
        }
      }
    })
  },
  ChangeAvatar(event) {
    const { avatarUrl } = event.detail;
    const db = wx.cloud.database();
    wx.showLoading({
      title: 'Uploading...',
    });

    wx.cloud.uploadFile({
      cloudPath: "avatarImages/" + Math.random() + Date.now() + '.png',
      
      filePath: event.detail.avatarUrl
    })
    .then(res => {
      const fileID = res.fileID;
      // 假设你有用户的唯一标识符（userID）
      const num = this.data.userInfo.num; // 从存储中获取用户ID或其他方式
      // 更新数据库中的用户数据
      db.collection('login_users').where({num:num}).update({
        data: {
          avatarUrl: fileID
        }
      }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: 'Avatar updated',
      });
      const num = this.data.userInfo.num
      db.collection("login_users").where({
        num:num
      })
      .get()
      .then(result=>{
        wx.setStorageSync('userInfo', result.data[0])
        this.setData({
          userInfo:result.data[0]
        })
      })
    })
    })
    
    .catch(error => {
      console.error('Update failed', error);
      wx.hideLoading();
      wx.showToast({
        title: 'Update failed',
        icon: 'none'
      });
    });
  }
  
})