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

    
  }
})