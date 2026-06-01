const app = getApp()

export function checkMobile(mobile) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseAPI + '/user/ucenter/member/checkMobile/' + mobile,
      method: 'GET',
      header: { 'token': wx.getStorageSync('token') },
      success(res) {
        if (res.statusCode === 200 && res.data) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}