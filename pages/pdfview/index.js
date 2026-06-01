Page({
  onLoad(options) {
    this.setData({
      pdfUrl: decodeURIComponent(options.url || '')
    })
  }
})