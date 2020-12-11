// 生成切片大小
const pieceSize = 1024 * 1024;

const spark = new SparkMD5();
const fileReader = new FileReader();
let fileHash = null;
const uploadedInfo = { // 上传信息
    total: 0,
    loaded: 0
}
/**
 * 
 * @param {*} files  文件集合
 * @param {*} callback  回调函数 文件上传进度
 */
async function fileUploadAction(files,callback) {
    console.log('选择的文件 FileList---------->', files)
    // for (const item of files) {
    const item = files[0];
    uploadedInfo.total = item.size; // 赋值文件总大小
    console.log('文件 file---------->', item)

    // 获取文件名
    const fileName = item.name;

    // 1、生成切片
    const fileChunkList = createFileChunk(item, pieceSize);

    // 生成文件hash值 
    fileHash = await calFileHash(item, pieceSize, fileChunkList.length)
    console.log('文件唯一hash值---------->', fileHash);

    // 上传文件
    const requestList = fileChunkList.map(({ file, index }) => {
        const formData = new FormData();
        formData.append("fileHash", fileHash); // 文件hash值 唯一
        formData.append("file", file); // 文件切片
        formData.append("hash", fileHash + '-' + index); // 文件切片名称 (文件名字+切片index 组合)
        return { formData, index };
    }).map(async ({ formData, index }) => {
        return uploadAction(formData, index, callback);
    });

    await Promise.all(requestList).then(async (data) => {
        console.log(data)
        await mergeRequest(data[0].data.filePath, fileName);
    }).catch((err) => {
        console.log('上传失败，稍后重试', err);
    });

    // }
}

// 上传文件函数
function uploadAction(item, index, callback) {
    return new Promise((resolve, reject) => {
        const data = request({
            url: "http://localhost:3000/api/fileUploadVideo",
            data: item, //发送数据
            onProgress: createProgressHandler(index, callback),
        });
        resolve(data);
    })
}

// 上传进度处理事件
function createProgressHandler(index, callback) {
    return e => {
        // item.percentage = parseInt(String((e.loaded / e.total) * 100));
        uploadedInfo.loaded = uploadedInfo.loaded + e.loaded
        callback(uploadedInfo);
    }
}

// 1、生成切片
function createFileChunk(file, size) {
    const fileChunkList = [];
    let cur = 0;
    let index = 0;
    while (cur < file.size) {
        fileChunkList.push({
            file: file.slice(cur, cur + size),
            index: index
        });
        index += 1
        cur += size;
    }
    console.log('生成的切片：', fileChunkList)
    return fileChunkList;
}

// 2、合并切片
function mergeRequest(filePath, fileName) {
    console.log('filePath', filePath)
    request({
        url: "http://localhost:3000/api/merge",
        data: JSON.stringify({
            filePath: filePath,
            pieceSize: pieceSize,
            fileName: fileName
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });
}

// 生成文件hash值
let currentChunk = 0;
function calFileHash(file, chunkSize, length) {
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    return new Promise((resolve, reject) => {
        const chunks = Math.ceil(file.size / chunkSize);
        console.log('chunks----->', chunks)
        const spark = new SparkMD5.ArrayBuffer();
        const fileReader = new FileReader();
        const that = this;
        let currentChunk = 0;

        fileReader.onload = function (e) {
            console.log("read chunk nr", currentChunk + 1, "of", length);
            spark.append(e.target.result); // Append array buffer
            currentChunk++;

            if (currentChunk < chunks) {
                loadNext();
            } else {
                that.chunkTotal = currentChunk;
                const hash = spark.end();
                console.log("success", "加载文件成功，文件哈希为" + hash);
                resolve(hash);
            }
        };

        fileReader.onerror = function () {
            console.log("error", "读取切分文件失败，请重试");
            reject("读取切分文件失败，请重试");
        };

        function loadNext() {
            var start = currentChunk * chunkSize,
                end =
                    start + chunkSize >= file.size
                        ? file.size
                        : start + chunkSize;

            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }

        loadNext();
    }).catch((err) => {
        console.log(err);
    });
}

function request({
    url,
    method = "post",
    data,
    headers = {},
    onProgress = e => e,
    requestList
}) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = onProgress;
        xhr.open(method, url);
        Object.keys(headers).forEach(key =>
            xhr.setRequestHeader(key, headers[key])
        );
        xhr.send(data);
        xhr.onload = e => {
            resolve({
                data: JSON.parse(e.target.response)
            });
        };
    });
}