// 知新堂主站相关校验
// 地址由公告 mainBackendUrl 动态下发（app.js 启动时填充 globalData.mainAPI）
// 本常量仅作公告拉取失败时的兜底
const DEFAULT_MAIN_API = 'https://3c21566.r16.vip.cpolar.cn'

export function checkMobile(mobile) {
  return new Promise((resolve, reject) => {
    const base = getApp().globalData.mainAPI || DEFAULT_MAIN_API
    wx.request({
      url: base + '/user/ucenter/member/checkMobile/' + mobile,
      method: 'GET',
      header: { 'token': wx.getStorageSync('token') },
      success(res) {
        // 知新堂返回结构：{success, code:20000, message, data:{isRegistered}}
        if (res.statusCode === 200 && res.data && res.data.code === 20000) {
          resolve(res.data)
        } else {
          // 非 20000 一律视为服务异常走 catch，绝不静默放行成"未注册"
          reject((res.data && res.data.message) || '校验服务异常')
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}