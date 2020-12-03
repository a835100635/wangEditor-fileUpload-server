const express = require('express');
const bodyParser = require('body-parser'); //express分离body参数 
const path = require('path');
const fs = require('fs');
const {
    Port,staticDir,uploadDir
} = require('./config');
const Router = require('./app/router');

let app = express();

//设置跨域访问 
app.all('*', (req, res, next) => {
    console.log('访问url------------> ', req.url)
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "POST", "GET");
    res.header("X-Powered-By", ' 3.2.1');
    // res.header("Content-Type", "application/json;charset=utf-8"); // 放开导致无法正常显示图片
    next();
});

console.log('静态访问地址头----> ' ,staticDir)

// 静态文件
app.use(express.static(staticDir));

// html页面访问
app.get('/', (req, res) => {
    res.writeHead(200, {
            'Content-Type': 'text/html' 
        })
    fs.readFile('./examples/index.html', 'utf-8', function (err, data) {
        if (err) {
            throw err;
        }
        res.end(data);

    });
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(Router);


app.listen(Port, (err) => {
    if (err) {
        console.log('服务启动失败');
    } else {
        console.log(`${new Date()}===>服务启动成功--${Port}`);
    }
})