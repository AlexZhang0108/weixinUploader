const app = getApp()

Page({
  data: {

  },
  onLoad: function () {
    this.setData({
      selectFile: this.selectFile,
      uplaodFile: this.uplaodFile,
      deletePic: this.deletePic
    })
  },
  // 图片选择前对格式的校验
  selectFile(files) {
    console.log(files,'selectFile')
  },
  // 这个过程是图片上传服务器
  uplaodFile(files) {
    console.log(files,'uplaodFile')
    let _this = this
    let fileName = files.tempFilePaths[0]
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: api.ProviderPicUrl,//路径
        filePath: files.tempFilePaths[0], //此处为图片的path
        name: "XXX",
        header: {},
        formData: {},
        success: function (res) {
          resolve({})
        },
        fail: function (res) {
          reject(res)
        }
      })
    })
  },
  // 图片上传失败
  uploadError(e) {
    
  },
  // 图片上传成功
  uploadSuccess(e) {
  },

  // 图片删除
  deletePic(deleIndex) {
  },
})
