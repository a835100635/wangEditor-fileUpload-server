const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')

const FileController = require('./controllers/fileUpload')


// 上传视频
router.post('/api/fileUploadVideo', bodyParser.urlencoded({
    extended: false
}), FileController.uploadFile)

module.exports = router;