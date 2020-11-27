/**
 *  文件上传模块
 */

const uuId = require('uuid');
const fse = require('fs-extra');
const multiparty = require('multiparty');
const { uploadDir } = require('../../config');
const path = require('path');


module.exports = {
  // 上传切片
  uploadFile: (req, res) => {
    // 初始时间
    const nowTime = new Date();
    const Year = nowTime.getFullYear();
    const Month = nowTime.getMonth() + 1;
    const Day = nowTime.getDate();
    const Hours = nowTime.getHours();
    const dataPath = `${uploadDir}/${Year}/${Month}/${Day}/${Hours}/`
    // 生成存储文件夹 日期为目录  方便后期寻找
    const uploadPath = path.resolve(__dirname, '../../', dataPath);

    const multipart = new multiparty.Form();

    multipart.parse(req, async (err, fields, files) => {
      if (err) {
        res.send({
          code: '10001',
          msg: err
        })
        return;
      }
      if (!fields || !files) {
        res.send({
          code: '10002',
          msg: '未上传文件'
        })
        return;
      }
      const [file] = files.file;
      const [hash] = fields.hash;
      const [filename] = fields.filename;

      const chunkDir = path.resolve(uploadPath, filename);
      console.log('目标保存地址=======》', chunkDir)

      // 切片目录不存在，创建切片目录
      if (!fse.existsSync(chunkDir)) {
        await fse.mkdirs(chunkDir);
      }

      try {
        // 把文件移动至目标文件夹 等待后面合并
        await fse.move(file.path, `${chunkDir}/${hash}`);
      } catch (err) {
        res.send({
          code: '10003',
          msg: '上传出错'
        })
      }

      res.send({
        code: '10000',
        msg: '上传成功',
        filePath: dataPath + filename
      })

    });
  },

  // 合并文件
  mergeFile: async (req, res) => {
    console.log('合并请求', req.body);
    const { fileName, filePath } = req.body;

   


    res.send({
      code: '10000',
      msg: '上传成功'
    })
  }

}

