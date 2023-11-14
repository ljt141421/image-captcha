/**
 * 常量配置
 * Created by longjianlin on 16/10/26.
 */
const util = require('util');
const glob = require('glob');
const path = require('path');
const fs   = require('fs');

const env = process.env.NODE_ENV || "development";
const pattern = path.join(__dirname,env,'/**/*.json');

console.log(`env:${env}; pattern:${pattern}`);

let configs = {};
glob.sync(pattern).forEach(file => {
    //console.log(`${file}:${name}`);
    let name = path.basename(file,'.json');
    let text = fs.readFileSync(file, {encoding: "utf-8"});
    //过滤注释代码 /* ??? */
    text = text.replace(/\/\*.*?\*\//g, "");
    try {
        let json = JSON.parse(text);
        configs[name] = json;
    }catch (e){
        console.error(`Invalid config file. ${file}\n${e}`);
    }
});
console.log(util.inspect(configs));

module.exports = configs;
