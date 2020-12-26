/**
 *  文件上传模块
 */

const fse = require('fs-extra');
const multiparty = require('multiparty');
const { uploadDir } = require('../../config');
const path = require('path');

const pieceFolder = '-piece'

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

    /**
     * 解析FormData  利用parse()方法来解析
     * fields 存储着FormData里的字段信息
     * files 存储着FormData里的字段信息
     */
    multipart.parse(req, async (err, fields, files) => {
      // 判断错误 文件是否存在
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

      const [ file ] = files.file;
      const [ hash ] = fields.hash;
      const [ fileHash ] = fields.fileHash;
      console.log('上传文件收到的参数------------>', files)
      
      // 处理文件名称 区分切片文件夹与真文件夹
      let fileDirName = fileHash + pieceFolder;

      const chunkDir = path.resolve(uploadPath, fileDirName);
      console.log('切片文件存放文件夹路径------------>', chunkDir)

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
        filePath: dataPath + fileDirName
      })

    });
  },

  // 合并文件
  mergeFile: async (req, res) => {
    console.log('请求合并接口 && 收到的参数------------>', req.body);
    const { filePath, pieceSize, fileName } = req.body;
    if(!filePath){
      res.send({
        code: '10001',
        msg: '缺少参数 filePath',
      });
      return;
    }
    const chunkDir = path.resolve(__dirname, `../../${filePath}`, );
    console.log('切片文件夹------------>', chunkDir)

    const chunkPaths = await fse.readdir(chunkDir);
    console.log('切片文件集合------------>', chunkPaths);

    // 进行排序 保证顺序的准确
    chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1]);

    const pipeStream = (path, writeStream) => {
      console.log('处理的切片路劲------------>',path);
       return new Promise((resolve,reject) => {
       try{
          // 读文件流
        const readStream = fse.createReadStream(path);

        // 写入文件流完成后 删除文件切片
        readStream.on("end", () => {

          // fse.unlinkSync(path);
          resolve();

        });

        // 写入文件流
        readStream.pipe(writeStream);

        } catch(err) {

          reject();

        }

      });
    }
    
    // 生成文件的文件路径
    let  newFilePath = (filePath.replace(pieceFolder,'').split('.')[0]).split('/');
    newFilePath = newFilePath.join('/') + '.' +fileName.split('.')[1];
    console.log('生成文件名---->', newFilePath);

    await Promise.all(
      chunkPaths.map((chunkPath, index) =>
        pipeStream(

          // 切片的路径
          path.resolve(chunkDir, chunkPath),

          // 生成文件 指定位置创建可写流
          fse.createWriteStream(newFilePath, {
            start: index * pieceSize,
            end: (index + 1) * pieceSize
          })
        )
      )
    ).then((result)=>{
        console.log('合并切片成功------------>', result);
        // fse.rmdirSync(chunkDir); // 合并后删除保存切片的目录
    });

    res.send({
      code: '10000',
      msg: '上传成功',
      path: newFilePath
    });

  },

  // 核实文件切片或文件已经存在
  verifyFile: (req, res) => {
    
  }
}

