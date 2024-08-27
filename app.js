// app.js
App({
  onLaunch() {
  
    //云开发环境的初始化
    wx.cloud.init({
      env:"photochat01"
    })
    
  },
  globalData: {
    userInfo: null
  }
})
