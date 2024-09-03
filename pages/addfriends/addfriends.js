// pages/addfriends/addfriends.js
const db= wx.cloud.database()

Page({

  data: {
    search_value:"",
    search_list:{},
    is_friend:{},
    is_add:false,
    status0_num:0
  },

  onLoad(options) {

  },

  getInput(e){
    console.log(e),
    this.setData({
      search_value:e.detail.value
    })
  },

  //取消按钮
  cancel(){
    this.setData({
      search:false,
      search_value:'',
      search_list:{},
      is_friend:{},
      is_add:false
    })
  },

  //搜索
  search(){
    var that = this
    let myphone = wx.getStorageSync('userInfo').phone
    if (that.data.search_value == myphone) {
      wx.showToast({
        title: '不能搜索本账号',
        icon:"error"
      })
    }
    else{
      if(that.data.search_value==''){
        wx.showToast({
          title: '请输入内容',
          icon:"none"
        })
      }
      else{
        wx.showLoading({
          title: '搜索中',
        })
        db.collection('login_users').where({phone:that.data.search_value}).get().then(res=>{
          console.log(res)
          if (res.data.length==0) {
            wx.hideLoading()
            wx.showToast({
              title: '该账号不存在',
              icon:"error"
            })
          }
          else{
            wx.hideLoading()
            that.setData({
              search_list:res.data[0],
              search:true
            })
            let _ = db.command
            db.collection("chat_users").where(_.or([
              {
                Auser: that.data.search_value
              },
              {
                Buser: that.data.search_value
              }
            ])).get().then(res=>{
              console.log(res)
              if (res.data.length!=0) {
                that.setData({
                  is_add:true,
                  is_friend:rs.data[0]
                })
              }
            })
            
          }
        })
      }
    }
  },


  toFriends(){
    wx.navigateBack({
      delta: 0,
    })
  },

  //加好友
  add(){
    var that = this
    let userinfo = wx.getStorageSync('userInfo');
    let targetUser = that.data.search_list.num;

    // 查询是否已经是好友
    db.collection("chat_users").where({
        Auser: userinfo.num,
        Buser: targetUser
    }).get().then(res => {
        if (res.data.length > 0 && res.data[0].status == 1) {
            wx.showToast({
                title: '已是好友',
                icon: 'none'
            });
            return;
        }
    wx.showModal({
      title: '提示',
      content: '添加为好友?',
      complete: (res) => {
        if (res.confirm) {
          let userinfo = wx.getStorageSync('userInfo')
          db.collection("chat_users").add({
            data:{
              Auser:userinfo.num,
              AuserFace:userinfo.avatarUrl,
              AuserName:userinfo.nickName,
              AuserPhone:userinfo.phone,
              Buser:that.data.search_list.num,
              BuserFace:that.data.search_list.avatarUrl,
              BuserName:that.data.search_list.nickName,
              BuserPhone:that.data.search_list.phone,
              lastMessage: "",
              lastMessageTime: Date.now(),  
              chatinfo:[],
              status:0//0表示已申请待通过; 1表示添加完成 ； 
            }
          }).then(res=>{
            console.log(res)
              that.setData({
                search:false,
                search_value:'',
                search_list:{},
                is_friend:{},
                is_add:false
              })
          })
          
        }
      },
      success(){
        wx.showToast({
          title: '已发送请求',
          icon:"success"
        })
      }
    })
  })

 



}
})
