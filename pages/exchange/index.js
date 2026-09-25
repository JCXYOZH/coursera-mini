const app = getApp()

Page({
  data: {
    items: [],
    loading: true,   // 控制加载状态
    loadError: false,
    errorMsg: ''
  },
  onLoad() {
    this.loadItems()
  },
  loadItems() {
    // 每次加载前显示loading
    this.setData({ loading: true })

    const token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loading: false, loadError: true, errorMsg: '请先登录' })
      return
    }
    wx.showNavigationBarLoading()
    wx.request({
      url: app.globalData.baseAPI + '/api/student/exchange/list',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': token
      },
      success: (res) => {
        wx.hideNavigationBarLoading()
        if (res.statusCode === 200 && res.data.code === 1) {
          this.setData({ items: res.data.response, loadError: false, loading: false })
        } else if (res.data.code === 401) {
          this.setData({ loadError: true, errorMsg: '登录已过期，请重新登录', loading: false })
        } else {
          this.setData({ loadError: true, errorMsg: res.data.message || '加载失败', loading: false })
        }
      },
      fail: () => {
        wx.hideNavigationBarLoading()
        this.setData({ loadError: true, errorMsg: '网络不可用', loading: false })
      }
    })
  },
  exchange(e) {
    const item = e.currentTarget.dataset.item
    const points = Number(item.pointsRequired) || 0
    wx.showModal({
      title: '确认兑换',
      content: `使用${points}积分兑换《${item.name}》？`,
      success: (res) => {
        if (res.confirm) {
          wx.showNavigationBarLoading()
          wx.request({
            url: app.globalData.baseAPI + '/api/student/exchange/do/' + item.id,
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded',
              'token': wx.getStorageSync('token')
            },
            success: (res) => {
              wx.hideNavigationBarLoading()
              if (res.statusCode === 200 && res.data.code === 1 && res.data.response.success) {
                wx.showToast({ title: '兑换成功', icon: 'success' })
                this.loadItems()
              } else {
                wx.showToast({ title: res.data.response.message || '兑换失败', icon: 'none' })
              }
            },
            fail: () => {
              wx.hideNavigationBarLoading()
              wx.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  },
  viewPdf() {
    // 不再跳转 PDF 预览，而是提示用户前往 Web 端查看
    wx.showModal({
      title: '提示',
      content: '请前往 Web 端查看 PDF 文件',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})