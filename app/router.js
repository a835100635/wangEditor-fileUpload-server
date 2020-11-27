const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')

const FileController = require('./controllers/fileUpload')


// 上传视频
router.post('/api/fileUploadVideo', bodyParser.urlencoded({
    extended: false
}), FileController.uploadFile)

// 合并切片
router.post('/api/merge', FileController.mergeFile);

module.exports = router;