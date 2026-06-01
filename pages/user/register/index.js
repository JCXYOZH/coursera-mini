const app = getApp()
import { checkMobile } from '../../../utils/member'
Page({
  data: {
    levelIndex: 0
  },
  bindLevelChange: function (e) {
    this.setData({
      levelIndex: e.detail.value
    })
  },
  formSubmit: function(e) {
    let _this = this;
    let form = e.detail.value
    if (form.userName == null || form.userName == '') {
      app.message('用户名不能为空', 'error');
      return;
    }
    if (form.password == null || form.password == '') {
      app.message('密码不能为空', 'error');
      return;
    }
    if (form.userLevel == null || form.userLevel == '') {
      app.message('年级不能为空', 'error');
      return;
    }

    // 先校验手机号是否在知新堂注册
    checkMobile(form.userName).then(res => {
      if (res.response === true) {
        // 存在，继续注册
        _this.setData({ spinShow: true });
        app.formPost('/api/wx/student/user/register', form)
          .then(res => {
            _this.setData({ spinShow: false });
            if (res.code == 1) {
              wx.reLaunch({ url: '/pages/user/bind/index' });
            } else {
              app.message(res.message, 'error')
            }
          }).catch(e => {
            _this.setData({ spinShow: false });
            app.message(e, 'error')
          })
      } else {
        app.message('该手机号未在知新堂注册，请先在知新堂注册账号', 'error')
      }
    }).catch(() => {
      app.message('校验手机号失败', 'error')
    })
  }
})