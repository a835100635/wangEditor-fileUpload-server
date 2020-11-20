/**
 *  文件上传模块
 */

const uuId = require('uuid');
const fs = require('fs');
const multiparty = require('multiparty');
const Helper = require('../../config/helper.js');
const {uploadDir} = require('../../config');

module.exports = {
    uploadFile: (req, res) => {
        console.log('开始执行上传事件', req.file)
        // 初始时间
        const nowTime = new Date();
        const Year = nowTime.getFullYear();
        const Month = nowTime.getMonth();
        const Day = nowTime.getDate();
        const Hours = nowTime.getHours();

        // 生成存放文件夹路径
        const pathInfo = `${uploadDir}${Year}/${Month}/${Day}/${Hours}/`
        console.log('初始化存放路径：======》', pathInfo);

        // 执行创建文件夹 
        try{
            Helper.mkdirsSync(pathInfo);
        } catch (err) {
            res.send({
                code: '10001',
                msg: '创建文件夹出错，请稍后再试'
            })
            return;
        }

        //文件默认存放路径
        const form = new multiparty.Form({
            uploadDir: pathInfo
        });

        form.parse(req, (err, fields, files) => {
            console.log(req.file,fields,files)
            form.encoding = 'utf-8';
            if (!files) {
                res.send({
                    code: '10002',
                    msg: '未上传文件'
                })
                fs.unlink(files.path, (err) => { //防止上传文件夹中，删除
                    if (err) {
                        console.log('err=======> ',err);
                    } else {
                        console.log('delete ok');
                    }
                });
                return;
            }
            if (err) {
                res.send({
                    code: '10003',
                    msg: '上传错误'
                })
            } else {
                let item = files.file
                let fileList=[]
                try {
                    for (const i in item) {
                        // 生成uuid
                        const uuid = uuId.v4().replace(/\-/g, '')
                        // uuid替换文件随机名称
                        const format = item[i].originalFilename.split('.')[item[i].originalFilename.split('.').length - 1]; // 获取文件格式
                        fs.renameSync(item[i].path, pathInfo + uuid + '.' + format); // 修改操作
                        // 上传成功后push fileList，整个事件执行完毕后返回
                        fileList.push(`${pathInfo}${uuid}.${format}`)
                    }
                    res.send({
                        data: fileList,
                        code: '200',
                        msg: 'success'
                    })
                } catch (r) {
                    console.log('上传过程中出错：====>', r);
                    for (const i in item) {
                        fs.unlink(item[i].path, (err) => { //上传过程处理出错,防止已上传文件夹中，删除
                            if (err) {
                                console.log('上传过程失败->删除文件失败->错误提示', err);
                            } else {
                                console.log('上传过程失败->删除文件成功 delete ok');
                            }
                        });
                    }
                    res.send({
                        code: '10004',
                        msg: '上传过程错误'
                    })
                }
            }
        })
    }
}