const {
  $Message
} = require('/component/iView/base/index');
const mtjwxsdk = require('./utils/mtj-wx-sdk.js');

// 地址常量区（缺失会直接 ReferenceError，务必整段保留）
const ADDR_URL = 'https://coursera-addr.oss-cn-beijing.aliyuncs.com/addr-bloc.json'   // OSS 公告端点
const DEFAULT_BASE_API = 'https://38d5e904.r16.vip.cpolar.cn'              // mini 后端兜底
const DEFAULT_MAIN_API = 'https://3c21566.r16.vip.cpolar.cn'               // 知新堂后端兜底
const ADDR_STORAGE_KEY = 'addr-announce-bloc-v2'

// 启动自检：控制台必须打印出本行，否则说明常量区没复制全
console.log('[addr] 初始化 | mini后端：', DEFAULT_BASE_API, '| 知新堂后端：', DEFAULT_MAIN_API)

App({
  globalData: {
    baseAPI: '',     // mini 后端地址（登录/注册等业务接口），由公告动态填充
    mainAPI: '',     // 知新堂后端地址（checkMobile 校验用），由公告动态填充
    pageSize: 20
  },

  onLaunch: function () {
    let _this = this
    _this.initAddr()
    let token = wx.getStorageSync('token')
    if (null == token || token == '') {
      wx.login({
        success(wxres) {
          if (wxres.code) {
            _this.formPost('/api/wx/student/auth/checkBind', {
              "code": wxres.code
            }).then(res => {
              if (res.code == 1) {
                wx.setStorageSync('token', res.response)
                wx.reLaunch({ url: '/pages/index/index' })
              } else if (res.code == 2) {
                wx.reLaunch({ url: '/pages/user/bind/index' })
              } else {
                _this.message(res.message, 'error')
              }
            }).catch(e => { _this.message(e, 'error') })
          } else {
            _this.message(res.errMsg, 'error')
          }
        }
      })
    }
  },

  // ===== 地址公告：初始化（幂等；先套本地缓存，再异步刷新）=====
  initAddr: function () {
    if (this._addrReady) return this._addrReady
    try {
      const cached = wx.getStorageSync(ADDR_STORAGE_KEY)
      this.globalData.baseAPI = (cached && cached.backendUrl) || DEFAULT_BASE_API
      this.globalData.mainAPI = (cached && cached.mainBackendUrl) || DEFAULT_MAIN_API
    } catch (e) {
      this.globalData.baseAPI = this.globalData.baseAPI || DEFAULT_BASE_API
      this.globalData.mainAPI = this.globalData.mainAPI || DEFAULT_MAIN_API
    }
    this._addrReady = this._applyLatest().catch(() => {})
    return this._addrReady
  },

  // 强制刷新（网络失败重试用）
  refreshAddr: function () {
    return this._applyLatest().catch(() => null)
  },

  _applyLatest: function () {
    const _this = this
    return new Promise(function (resolve, reject) {
      wx.request({
        url: ADDR_URL,
        method: 'GET',
        success: (res) => {
          let rec = res.data
          if (rec && rec.record && typeof rec.record === 'object') rec = rec.record
          if (rec && rec.backendUrl) {
            _this.globalData.baseAPI = rec.backendUrl
            if (rec.mainBackendUrl) _this.globalData.mainAPI = rec.mainBackendUrl
            wx.setStorageSync(ADDR_STORAGE_KEY, rec)
            console.log('[addr] 公告已刷新：', JSON.stringify(rec))
            resolve(rec)
          } else {
            reject(new Error('bad addr record'))
          }
        },
        fail: reject
      })
    })
  },

  message: function (content, type) {
    $Message({
      content: content,
      type: type
    });
  },

  formPost: function (url, data, _addrRetry) {
    let _this = this
    return _this.initAddr().then(() => {
      return new Promise(function (resolve, reject) {
        const usedBase = _this.globalData.baseAPI
        wx.showNavigationBarLoading();
        wx.request({
          url: usedBase + url,
          header: {
            'content-type': 'application/x-www-form-urlencoded',
            'token': wx.getStorageSync('token')
          },
          method: 'POST',
          data,
          success(res) {
            if (res.statusCode !== 200 || typeof res.data !== 'object') {
              reject('网络出错')
              return false;
            }
            if (res.data.code === 400) {
              let token = res.data.response
              wx.setStorageSync('token', token)
              wx.request({
                url: _this.globalData.baseAPI + url,
                header: {
                  'content-type': 'application/x-www-form-urlencoded',
                  'token': wx.getStorageSync('token')
                },
                method: 'POST',
                data,
                success(result) {
                  resolve(result.data);
                  return true;
                }
              })
            } else if (res.data.code === 401) {
              wx.reLaunch({ url: '/pages/user/bind/index' })
              return false;
            } else if (res.data.code === 500) {
              reject(res.data.message)
              return false;
            } else if (res.data.code === 501) {
              reject(res.data.message)
              return false;
            } else {
              resolve(res.data);
              return true;
            }
          },
          fail(res) {
            // 服务器不可达：刷新公告，mini 后端地址变了就自动重发一次（仅一次）
            if (!_addrRetry) {
              _this.refreshAddr().then(rec => {
                if (rec && _this.globalData.baseAPI !== usedBase) {
                  _this.formPost(url, data, true).then(resolve, reject)
                } else {
                  reject(res.errMsg)
                }
              })
            } else {
              reject(res.errMsg)
            }
            return false;
          },
          complete(res) {
            wx.hideNavigationBarLoading();
          }
        })
      })
    })
  }
})