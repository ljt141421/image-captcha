/**
 * Created by yuchimin on 2018/04/26.
 */

const request = require('request');
const fs = require('fs');

class HttpRequest {
    constructor(){

    }

    async request(options){
        return new Promise(function (resolve, reject) {
            request(options,function (error, httpResponse, body) {
                if(error){
                    console.error(httpResponse);
                    console.error(error);
                    return reject(error);
                }
                console.debug(options);
                console.debug(body);
                if(typeof body == "string" && body.startsWith("{") && body.endsWith("}")) {
                    resolve(JSON.parse(body));
                } else {
                    resolve(body);
                }
            });
        });
    }

    async get(options){
        options = typeof options === "string"? {url:options} : options;
        options.method = "GET";
        return this.request(options);
    }

    async post(options){
        options = typeof options === "string"? {url:options} : options;
        options.method = "POST";
        return this.request(options);
    }

    async delete(options){
        options = typeof options === "string"? {url:options} : options;
        options.method = "DELETE";
        return this.request(options);
    }

    async put(options){
        options = typeof options === "string"? {url:options} : options;
        options.method = "PUT";
        return this.request(options);
    }

    async down(url, file){
        return new Promise(function (resolve, reject) {
            request.get(url).on('err', function (err) {
                reject(err)
            }).pipe(fs.createWriteStream(file).on('close', function () {
                resolve('down')
            }));
        })
    }
}
module.exports = new HttpRequest();