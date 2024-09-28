// pages/register/register.js
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

  },

  toLogin(){
    wx.navigateBack({
      delta: 0,
    })
  },
  
  //获取头像
  getAvatar(event){
    console.log(event)
    this.setData({
      avatarUrl: event.detail.avatarUrl
    })

    wx.showLoading({
      title: 'uploading',
    })
    wx.cloud.uploadFile({
      cloudPath:"avatarImages/" + Math.random() + Date.now() + '.png',
      filePath:event.detail.avatarUrl
    })
    .then(res=>{
      console.log(res.fileID)
      this.setData({
        avatarUrl:res.fileID
      })
      wx.hideLoading({
        success: (res) => {},
      })
    })
  },

  //注册
  register1(event){
    console.log(event)
    let userFormInfo = event.detail.value
    this.setData({
      userFormInfo
    })
  
    if (!this.data.avatarUrl) {
      wx.showToast({
        title: '请上传头像',
        icon:'error'
      })
      return
    }

    if(!userFormInfo.nickname||!userFormInfo.phone||!userFormInfo.password||!userFormInfo.password2){
      wx.showToast({
        title: '请输入完整信息',
        icon:'error'
      })
      return
    }

    if(userFormInfo.password!=userFormInfo.password2){
      wx.showToast({
        title: '密码不一致',
        icon:'error'
      })
      return
    }

    wx.cloud.database().collection("login_users").where({
      phone:userFormInfo.phone
    })
    .get()
    .then(result=>{
      console.log(result)
      if (result.data.length!=0) {
        wx.showToast({
          title: '手机号已注册',
          icon:'error'
        })
      }
      else{
        this.addUser()
      }
    })

    

  },
  addUser(){
    wx.cloud.database().collection("login_users").add({
      data:{
        nickName:this.data.userFormInfo.nickname,
        phone:this.data.userFormInfo.phone,
        password:this.data.userFormInfo.password,
        avatarUrl:this.data.avatarUrl,
        num:Date.now()
      }
    })
    .then(res=>{
      console.log(res)
      wx.navigateBack({
        delta:0,
        success(){
          wx.showToast({
            title: 'success',
            icon:"success"
          })
        }
      })
    })
  },

  showConfirmDialog(){
    wx.showModal({
      title: '提示',
      content: '请输入一串数字，这串数字将用于登陆、搜索和添加好友，为避免重复和忘记，建议使用电话号码~'
    })
  }

  
})