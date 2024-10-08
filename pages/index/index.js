// index.js
Page({

  //跳转到注册页面
  toRegister(){
    wx.navigateTo({
      url: '/pages/register/register',
    })
  },

  //获取账号
  getAccount(event){
    this.setData({
      phone:event.detail.value
    })
  },

  //获取密码
  getPassword(event){
    this.setData({
      password:event.detail.value
    })
  },

  //登录
  login(){
    if(!this.data.phone||!this.data.password){
      wx.showToast({
        title: '请输入完整信息',
        icon:'error'
      })
      return
    }
    wx.cloud.database().collection("login_users").where({
      phone:this.data.phone,
      password:this.data.password
    })
    .get()
    .then(result=>{
      if (result.data.length!=0){
        wx.setStorageSync('userInfo', result.data[0])
        wx.switchTab({
          url: '/pages/chat/chat',
          success(){
            wx.showToast({
              title: 'success',
              icon:'success'
            })
          }
        })
      }
      else{
        wx.showToast({
          title: '账号或密码错误',
          icon:'error'
        })
      }
    })
  },
  
  onLoad(){
    if (wx.getStorageSync('userInfo')) {
      wx.switchTab({
        url: '/pages/chat/chat',
      })
    }
  }

})
