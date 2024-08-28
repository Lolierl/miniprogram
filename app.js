// app.js
App({
  onLaunch() {
    //云开发环境的初始化
    wx.cloud.init({
      env:"photochat01-0g1zw77g869cb462", 
      traceUser: true,
    })
    
  },
  globalData: {
    userInfo: null
  }
})
