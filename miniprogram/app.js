// 小程序入口文件
App({
  onLaunch() {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      })
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    }
  },

  globalData: {
    // 全局数据
  }
})
