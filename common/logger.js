/**
 * Created by yuchimin on 16/10/29.
 */
const util = require('util')
const log4js = require('log4js');
const fs = require('fs');
const configs = require('../configs');

const logDir = "logs";
fs.existsSync(logDir) || fs.mkdirSync(logDir); //目录不存在则创建

log4js.configure(configs.log4js, { cwd: logDir });

let logger = log4js.getLogger('console');
console.log = logger.info.bind(logger);
console.error = function(...args) { logger.error(util.inspect(args)); } //logger.error.bind(logger);

module.exports = (name) => {
    //let logger = log4js.getLogger(name);
    return logger;
};