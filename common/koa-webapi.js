/**
 * Created by yuchimin on 17/2/11.
 * api response 中间件
 * 建议api返回json数据,统一使用ctx.json(status, message, data)方法
 */
'use strict';

const util = require('util');
const debug = require('debug')('koa-webapi');
const assert = require('assert');

const defaultJsonpCallbackFn = 'callback';

module.exports = webapi;

function webapi(app, options = {}) {
    assert(app && app.constructor.name === 'Application', 'app is must be an instance of koa');

    //extend json function
    app.context.json = function(status, message, data){
        let contentType = "application/json",
            response;

        if (arguments.length == 1) {
            response = {status: 0, message: '成功', data: arguments[0]}
        } else {
            response = {status, message, data};
        }
        this.type = contentType;
        this.body = response;

        debug(`response: ${response}`);
    }

    //extend jsonp function
    let callbackFn;
    if (options.jsonpCallbackFn) {
        assert(isString(options.jsonpCallbackFn), 'jsonpCallbackFn must be string');
        callbackFn = options.jsonpCallbackFn;
    } else {
        callbackFn = defaultJsonpCallbackFn;
    }

    debug(`callback function name: ${callbackFn}`);

    app.context.jsonp = function (data) {
        let callback = this.query[callbackFn],
            contentType = 'text/javascript',
            response;

        if (this.method !== 'GET') {
            debug('the request mehtod is not "GET", return.');
            return;
        }

        if(!callback) {
            debug(`${callbackFn} is undefined, return.`);
            return;
        }

        response = `${callback}(${JSON.stringify(data)})`;

        this.type = contentType;
        this.body = response;

        debug(`response: ${response}`);
    }
}

function isString(str) {
    return Object.prototype.toString.call(str) === '[object String]';
}