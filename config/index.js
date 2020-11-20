/** 
 * 全局配置信息
 * 
*/

const path = require('path');

module.exports = {
    Port:3000, //启动端口
    staticDir: path.resolve('./public'), // 静态资源路径
    uploadDir: 'public/uploads/', // 上传文件路径
}
