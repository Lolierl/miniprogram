// pages/start/start.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (wx.getStorageSync('userInfo')) {
      wx.switchTab({
        url: '/pages/chat/chat',
      })
    }

  },

  toIndex(){
    wx.navigateTo({
      url: '/pages/index/index',
    })
  },

  

  
})