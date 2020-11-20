/**
 * 公共方法
 */

const fs = require('fs');
const path = require('path');

// 递归创建目录 同步方法
const mkdirsSync = (dirname)=>{
    // console.log('执行创建文件夹')
    if(fs.existsSync(dirname)){
        console.log('已存在文件夹', dirname);
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            console.log('在' + path.dirname(dirname) + '目录创建好' + dirname  +'目录');
            return true;
        }
    }
}

module.exports = {
    mkdirsSync
}