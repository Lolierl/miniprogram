// pages/newfriends/newfriends.js

const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    myphone1:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getstatus()
    const myphone1 = wx.getStorageSync('userInfo').phone;
    this.setData({
      myphone0:myphone1
    })
  },

  toFriends(){
    wx.navigateBack({
      delta: 0,
    })
  },

  //获取添加好友信息
  getstatus(){
    let _ = db.command
    let acount = wx.getStorageSync('userinfo').num
    db.collection("chat_users").where(_.or([
      {
        Auser: acount
      },
      {
        Buser: acount
      }
    ])).get().then(res=>{
      console.log(res)
      this.setData({
        list:res.data
      })
    })
  },

  //同意好友请求
  agree(e){
    let id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确认通过好友请求',
      complete: (res) => {
        if (res.confirm) {
          db.collection("chat_users").doc(id).update({
            data:{
              status:1
            }
          }).then(res=>{
            console.log(res)
            wx.showToast({
              title: '已添加',
              icon:'success'
            })
            this.getstatus()
          })
          
        }
      }
    })
  }
})