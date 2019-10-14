/***
 * 
 * 2019.10.11
 * 张飞东（81436335）
 */

Component({
  options: {
    addGlobalClass: true
  },
  data: {
    currentFiles: [], //上传图片的例表
    showPreview: false,
    previewImageUrls: []
  },
  /**
   * type为1表示图片超过大小限制，type为2表示选择图片失败，type为3表示图片上传失败。
   */
  properties: {
    extClass: { //添加在组件内部结构的class，可用于修改组件内部的样式
      type: String,
      value: ''
    },
    title: { //组件标题
      type: String,
      value: '图片上传'
    },
    currentFilesName: { //组件标题
      type: String,
      value: ''
    },
    maxCount: { //最多上传多少张
      type: Number,
      value: 1
    },
    sourceTypeArr: {
      type: Array,
      value: ['album'], //	选择图片的来源[album	从相册选图,camera	使用相机]
    },
    tips: { //组件的提示
      type: String,
      value: ''
    },
    maxSize: { //图片上传的最大文件限制，默认是5M
      type: Number,
      value: 5 * 1024 * 1024
    },
    files: { //当前的图片列表
      type: Array,
      value: [],
      observer: function observer(newVal, oldVal, changedP) {
        this.setData({
          currentFiles: newVal
        });
      }
    },
    hideOnClick: {
      type: Boolean,
      value: true
    },
    // --------------------------------?组件的方法-----------------------------------
    select: { //选择图片时的过滤函数，返回true表示图片有效
      type: Function,
      value: function value() {}
    },
    upload: {
      type: Function,
      value: null
    },
    deletePic: {
      type: Function,
      value: null
    },
    /**properties End*/
  },
  ready: function ready() {},
  methods: { //方法
    // this --?上传
    chooseImage: function chooseImage(e) {
      let _this = this; // 1）上来存个this，咋也不知道，咋也不敢问
      if (this.uploading) return; // 2)卧槽开始搞事情了
      wx.chooseImage({
        count: 1, //3)count上传个数,//this.data.maxCount - this.data.files.length
        sourceType: _this.data.sourceTypeArr, //选择图片的来源
        success: function success(res) { //成功
          wx.showLoading({
            title: '正在上传...',
            icon: 'loading',
            mask: true
          })
          let invalidIndex = -1;
          res.tempFiles.forEach(function(item, index) { //4)判断上传的文件size是否超出规定的大小；超出就记录下标invalidIndex = index[下标]; 
            if (item.size > _this.data.maxSize) {
              invalidIndex = index;
            }
          })
          if (typeof _this.data.select === 'function') { //5 )判断select方法是否有
            let ret = _this.data.select(res);
            if (ret === false) {
              return;
            }
          }

          /*****bindfail--Statr
           * 图片上传失败的事件，detail为{type, errMsg}，type为1表示图片超过大小限制，type为2表示选择图片失败，type为3表示图片上传失败
           */
          if (invalidIndex >= 0) { //6）invalidIndex下标大于等于0 说明上传文件大小不对， 抛出异常 =====》type: 1
            _this.triggerEvent('fail', {
              type: 1,
              errMsg: 'chooseImage:fail size exceed ' + _this.data.maxSize,
              total: res.tempFilePaths.length,
              index: invalidIndex
            }, {});
            return;
          }


          /*****select--Statr
           * 功能bindselect图片选择触发的事件
           * 功能看项目需求
           */
          let zfd_lujing = wx.getFileSystemManager(); //7 ）文件管理器
          let contents = res.tempFilePaths.map(function(item) { //8 ）要读取的文件的路径；以 ArrayBuffer 格式读取文件的二进制内容
            let fileContent = zfd_lujing.readFileSync(item);
            return fileContent;
          });
          let UploadObj = { //8)把这些东西放到一个对象里面了图片选择触发的事件，detail为{tempFilePaths, UploadObj, contents},其中UploadObj和tempFilePaths是chooseImage返回的字段，contents表示所选的图片的二进制Buffer列表
            tempFilePaths: res.tempFilePaths,
            tempFiles: res.tempFiles,
            contents: contents
          };
          _this.triggerEvent('select', UploadObj, {}); // 9）这里不用多BIBI
          /****
           *select--End *
           * */

          /*****success------------
           * 功能bindsuccess图片上传成功的事件
           * 功能看项目需求
           */
          let files = res.tempFilePaths.map(function(item, i) {
            return {
              loading: true,
              url: 'data:image/jpg;base64,' + wx.arrayBufferToBase64(contents[i])
            };
          });
          if (!files || !files.length) return;
          if (typeof _this.data.upload === 'function') {
            let leng = _this.data.files.length;
            let newFiles = _this.data.files.concat(files);
            _this.setData({
              files: newFiles,
              currentFiles: newFiles
            }); //将上传的图片赋值到data
            _this.loading = true;

            _this.data.upload(UploadObj).then(function(json) { //这里通过Promise拿到了服务器返回的结果
              if (json.urls) { //Promise的callback里面必须resolve({urls})表示成功，否则表示失败
                let oldFiles = _this.data.files; //这里拿到的是上一次的图片例表
                json.urls.forEach(function(url, index) {
                  oldFiles[leng + index].url = url;
                  oldFiles[leng + index].loading = false;
                });
                _this.setData({
                  files: oldFiles,
                  currentFiles: newFiles
                });
                _this.triggerEvent('success', json, {});

              } else {
                _this.triggerEvent('fail', {
                  type: 3,
                  errMsg: 'upload file fail, urls not found'
                }, {});
              }
            }).catch(function(err) {
              _this.loading = false;
              let oldFiles = _this.data.files;
              res.tempFilePaths.map(function(item, index) {
                oldFiles[leng + index].error = true;
                oldFiles[leng + index].loading = false;
              });
              _this.setData({
                files: oldFiles,
                currentFiles: newFiles
              });
              _this.triggerEvent('fail', {
                type: 3,
                errMsg: 'upload file fail',
                error: err
              }, {});
            })
            setTimeout(function() {
              wx.hideLoading()
            }, 2000)
          }

        },
        fail: function fail(_fail) {
          if (_fail.errMsg.indexOf('chooseImage:fail cancel') >= 0) {
            _this.triggerEvent('cancel', {}, {});
            return;
          }
          _fail.type = 2;
          _this.triggerEvent('fail', _fail, {});
        }
      })
    },

    /*****删除事件--预览------------
     * 
     * 功能看项目需求
     */
    previewImage: function previewImage(e) {
      let _this = this;
      let deleIndex = e.target.dataset.index;
      let clickName = e.target.dataset.name;
      if (clickName == 'uploader__del') { //删除事件
        let olderFiles = _this.data.files;
        let leng = olderFiles.length
        olderFiles.splice(deleIndex, 1)
        if (olderFiles.length < leng) {
          _this.setData({
            files: olderFiles,
            currentFiles: olderFiles
          });
          let obj = {
            deleIndex: deleIndex,
            currentFilesName: _this.data.currentFilesName
          }
          _this.triggerEvent('deleCcess', obj, {});
        }

      } else { //图片放大预览
        let index = e.currentTarget.dataset.index;
        let previewImageUrls = [];
        this.data.files.map(function(item) {
          previewImageUrls.push(item.url);
        });
        this.setData({
          previewImageUrls: previewImageUrls,
          previewCurrent: index,
          showPreview: true
        });
      }
    },

    // 隐藏图片预览
    hideGallery: function hideGallery(e) {
      let data = this.data;
      if (data.hideOnClick) {
        this.setData({
          showPreview: false
        });
      }
    },
    change: function change(e) {
      this.setData({
        previewCurrent: e.detail.current
      });
      this.triggerEvent('change', {
        current: e.detail.current
      }, {}); //这是拓展
    },
  }
})