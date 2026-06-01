const app = getApp()

Page({
  data: {
    points: 0,
    continuousDays: 0,
    todaySigned: false,
    inviteMobile: '',
    inviting: false
  },

  onLoad() {
    this.loadInfo()
  },

  loadInfo() {
    const token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ points: 0, continuousDays: 0, todaySigned: false })
      return
    }
    wx.showNavigationBarLoading()
    // 直接使用原始 wx.request，不经过 app.formPost
    wx.request({
      url: app.globalData.baseAPI + '/api/student/sign/info',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': token
      },
      success: (res) => {
        wx.hideNavigationBarLoading()
        if (res.statusCode === 200 && res.data.code === 1) {
          const resp = res.data.response
          const signed = resp.isSigned === true || resp.isSigned === 'true' || resp.isSigned === 1
          this.setData({
            points: resp.points || 0,
            continuousDays: resp.continuousDays || 0,
            todaySigned: signed
          })
        } else if (res.data.code === 401) {
          // 关键：只给一个轻提示，不弹窗，不跳转
          wx.showToast({ title: '登录状态已过期', icon: 'none', duration: 2000 })
          this.setData({ points: 0, continuousDays: 0, todaySigned: false })
        } else {
          wx.showToast({ title: '数据加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideNavigationBarLoading()
        wx.showToast({ title: '网络不可用', icon: 'none' })
      }
    })
  },

  onSignTap() {
    if (this.data.todaySigned) return
    this.doSign()
  },

  doSign() {
    const token = wx.getStorageSync('token')
    if (!token) return
    wx.showNavigationBarLoading()
    wx.request({
      url: app.globalData.baseAPI + '/api/student/sign/do',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': token
      },
      success: (res) => {
        wx.hideNavigationBarLoading()
        if (res.statusCode === 200 && res.data.code === 1 && res.data.response.success) {
          wx.showToast({ title: '签到成功+' + res.data.response.pointsEarned, icon: 'none' })
          this.setData({
            points: res.data.response.totalPoints || 0,
            continuousDays: res.data.response.continuousDays || 0,
            todaySigned: true
          })
        } else if (res.data.code === 401) {
          wx.showToast({ title: '登录已过期', icon: 'none' })
        } else {
          wx.showToast({ title: res.data.message || '签到失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideNavigationBarLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  onInviteMobileInput(e) {
    this.setData({ inviteMobile: e.detail.value })
  },

  onInvite() {
    const mobile = this.data.inviteMobile.trim()
    if (!mobile) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    this.setData({ inviting: true })
    wx.request({
      url: app.globalData.baseAPI + '/api/student/sign/invite',
      method: 'POST',
      data: { mobile },
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': wx.getStorageSync('token')
      },
      success: (res) => {
        this.setData({ inviting: false })
        if (res.statusCode === 200 && res.data.code === 1 && res.data.response.success) {
          wx.showToast({ title: res.data.response.message, icon: 'none' })
          this.setData({ inviteMobile: '' })
          this.loadInfo()
        } else if (res.data.code === 401) {
          wx.showToast({ title: '登录已过期', icon: 'none' })
        } else {
          wx.showToast({ title: res.data.response.message || '邀请失败', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ inviting: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})