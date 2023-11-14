const request = require('./request');


class FileUpload {
    constructor(){

    }

    async upload(stream) {
        let res = await request.post({
            url: "https://xxx.com/api/upload/file",
            formData: {
                file: {
                    value: stream,
                    options: {
                        filename: 'png'
                    }
                }
            }
        });

        return res.data.url;
    }
}

module.exports = new FileUpload();